
/*  Serial Communications: https://msdn.microsoft.com/en-us/library/ff802693.aspx
 */

#include <windows.h>
#include <setupapi.h>

#include <ntdef.h>
#include <initguid.h> /* before ntddser.h */
#include <ntddser.h>
#include <cfgmgr32.h>

#include <sys/timeb.h>


static HANDLE		sid = INVALID_HANDLE_VALUE ; /* Serial id */
static OVERLAPPED	sido ;


/*  List of event objects for overlapped operations
 */
//static HANDLE		events[1];


static uint8_t htoi ( char c )
{
  if ( c >= '0' && c <= '9' )
    return c - '0' ;

  if ( c >= 'A' && c <= 'F' )
    return 10 + c - 'A' ;

  return 0xFF ;
}


static void serialWrite ( int socket, char *data )
{
  if ( sid == INVALID_HANDLE_VALUE ) {
    sendTextFrame(socket, "ERROR SERIAL CLOSED");
    return ;
  }

  if ( data[0] == 'X' ) {
    /*
     *    X0 | X1 : BRK control
     */
    if ( data[1] == '0' )
      EscapeCommFunction( sid, SETBREAK );
    else if ( data[1] == '1' )
      EscapeCommFunction( sid, CLRBREAK );
    else {
    error:
      sendTextFrame( socket, "ERROR SERIAL %c%c", data[0], data[1] );
      return ;
    }
  cret:
    if ( data[2] != '\0' ) 
      sendTextFrame( socket, "ERROR SERIAL %c%c GARBAGE", data[0], data[1] );
    return ;
  }
    /*
     *    R0 | R1 : DTR control
     */
  else if ( data[0] == 'R' ) {
    if ( data[1] == '0' )
      EscapeCommFunction( sid, SETDTR );
    else if ( data[1] == '1' )
      EscapeCommFunction( sid, CLRDTR );
    else
      goto error ;
    goto cret ;
  }
  else if ( data[0] == 'S' ) {
    /*
     *    S0 | S1 : RTS control
     */
    if ( data[1] == '0' )
      EscapeCommFunction( sid, SETRTS );
    else if ( data[1] == '1' )
      EscapeCommFunction( sid, CLRRTS );
    else
      goto error ;
    goto cret ;
  }

  /*  Hexadecimal data string
   */

  /*  WARNING: the ASCII -> binary translation is done directly into the input
      buffer. So, if we need to send a frame to the client, that will overwrite
      the buffer so we need to create a copy first.
   */

  //  prn( 0, "SERIAL WRITE: %s\n", data );
  /* char *src = malloc( strlen(data) ); */
  /* if ( !src ) { */
  /*   sendTextFrame( socket, "ERROR: malloc(%d) failed.", strlen(data) ); */
  /*   return ; */
  /* } */
  /* strcpy( src, data ); */

  char		*src = data ;

  /* sendTextFrame( socket, "SEND: (%d) '%s'", strlen(src), src ); */

  uint8_t	*binary = (uint8_t*)src ;
  uint8_t	n = 0 ;
  for(;;) {
    if ( !*src )
      break ;
    uint8_t b1 = htoi( src[0] );
    uint8_t b2 = htoi( src[1] );
    if ( (b1 | b2) == 0xFF ) {
      sendTextFrame( socket, "ERROR %c%c", src[0], src[1] );
      /* free( src ); */
      return ;
    }
    *(binary+n) = (b1<<4) | b2 ;
    /* sendTextFrame( socket, "BYTE 0x%02X", *(binary+n) ); */
    src += 2 ;
    n++ ;
  }
  /* int		n = strlen( src ); */
  DWORD		w ;

  if ( !WriteFile( sid, binary, n, &w, &sido ) ) {
    if ( GetLastError() != ERROR_IO_PENDING )
      sendTextFrame( socket, "ERROR SERIAL WRITE %d BYTES", n );
    else
      sendTextFrame( socket, "SERIAL WRITE (%d BYTES) PENDING", n );
  }
  else
    sendTextFrame( socket, "SERIAL WRITE %lu/%d BYTES", w, n );

  /* free( src ); */
}


static void serialOpen ( int socket, const char *portname, uint32_t baudrate )
{
  sid = CreateFile( portname,  
		    GENERIC_READ | GENERIC_WRITE, 
		    0,			// exclusive access
		    0,			// default security attributes
		    OPEN_EXISTING,
		    FILE_ATTRIBUTE_NORMAL /* | FILE_FLAG_OVERLAPPED */, /* Asynchronous I/Os */
		    0 );

  if ( sid == INVALID_HANDLE_VALUE ) {
    sendTextFrame(socket, "ERROR SERIAL CreateFile() failed" );
    return ;
  }

  /*  Timeouts
   */
  COMMTIMEOUTS	to ;

  to.ReadIntervalTimeout         = 0 ;
  to.ReadTotalTimeoutMultiplier  = 1 ;
  to.ReadTotalTimeoutConstant    = 0 ;
  to.WriteTotalTimeoutMultiplier = 0 ;
  to.WriteTotalTimeoutConstant   = 0 ;

  if ( SetCommTimeouts( sid, &to ) == 0 ) {
    sendTextFrame(socket, "ERROR SERIAL SetCommTimeouts() failed" );
  close:
    if ( CloseHandle( sid ) == 0 )
      sendTextFrame(socket, "ERROR SERIAL CloseHandle() failed" );
    sid = INVALID_HANDLE_VALUE ;
    return ;
  }

  /*  Clear errors
   */
  DWORD		errors ;
  COMSTAT	status;

  if ( ClearCommError( sid, &errors, &status ) == 0 ) {
    sendTextFrame(socket, "ClearCommError() failed" );
    goto close ;
  }

  /*  Frame format
   */
  DCB		dcb ;

  memset( &dcb, 0, sizeof(DCB) );
  dcb.DCBlength = sizeof(DCB);

  if ( !GetCommState( sid, &dcb ) ) {
    sendTextFrame(socket, "ERROR SERIAL GetCommState() failed" );
    goto close ;
  }

  dcb.BaudRate    = baudrate ;
  dcb.ByteSize    = 5 ;
  dcb.Parity      = NOPARITY ;
  dcb.StopBits    = ONESTOPBIT ;
  dcb.fBinary     = TRUE;
  dcb.fDtrControl = DTR_CONTROL_DISABLE ;
  dcb.fRtsControl = RTS_CONTROL_DISABLE ;

  if ( !SetCommState( sid, &dcb ) ) {
    sendTextFrame(socket, "ERROR SERIAL SetCommState() failed" );
    goto close ;
  }


  /*  Overlapped
   */
  if ( !SetCommMask( sid, EV_RXCHAR ) ) {
    sendTextFrame(socket, "SetCommMask failed with error %d.\n", GetLastError());
    return;
  }

  sido.hEvent = CreateEvent( NULL,   // default security attributes 
			     TRUE,   // manual-reset event 
			     FALSE,  // not signaled 
			     NULL    // no name
			     );
  sido.Internal     = 0;
  sido.InternalHigh = 0;
  sido.Offset       = 0;
  sido.OffsetHigh   = 0;

#if 0
  DWORD		ev;

  if ( WaitCommEvent( sid, &ev, &o )) {
    /* Process char received */
  }
  else {
    if( GetLastError() != ERROR_IO_PENDING )
      sendTextFrame(socket, "Wait failed with error %d.\n", GetLastError());
  }
#endif
}


static void details ( int socket, const char *portname )
{
  /* Description limited to 127 char, anything longer
   * would not be user friendly anyway.
   */
  char			description[128];
  SP_DEVINFO_DATA	device_info_data = { .cbSize = sizeof(device_info_data) };
  HDEVINFO		device_info;

  device_info = SetupDiGetClassDevs(NULL, 0, 0, DIGCF_PRESENT | DIGCF_ALLCLASSES);
  if ( device_info == INVALID_HANDLE_VALUE ) {
    error("SetupDiGetClassDevs() failed");
    return ;
  }

  for ( int i=0 ; SetupDiEnumDeviceInfo(device_info, i, &device_info_data) ; i++ ) {
    HKEY	device_key;
    DEVINST	dev_inst;
    char	value[8];
    DWORD	size, type;
    CONFIGRET	cr;

    /* Check if this is the device we are looking for.
     */
    device_key = SetupDiOpenDevRegKey( device_info, &device_info_data,
				       DICS_FLAG_GLOBAL, 0,
				       DIREG_DEV, KEY_QUERY_VALUE) ;
    if ( device_key == INVALID_HANDLE_VALUE )
      continue;

    size = sizeof(value);
    if ( RegQueryValueExA( device_key, "PortName", NULL, &type, (LPBYTE)value,
			   &size) != ERROR_SUCCESS || type != REG_SZ ) {
      RegCloseKey( device_key );
      continue;
    }

    RegCloseKey( device_key );
    value[sizeof(value)-1] = 0;
    if ( strcmp(value, portname) )
      continue;

    /*  Get port description (friendly name).
     */
    dev_inst = device_info_data.DevInst;
    size = sizeof(description);
    while( (cr = CM_Get_DevNode_Registry_PropertyA( dev_inst, CM_DRP_FRIENDLYNAME, 0, description, &size, 0)) != CR_SUCCESS
	   && CM_Get_Parent(&dev_inst, dev_inst, 0) == CR_SUCCESS ) {}

    if ( cr == CR_SUCCESS ) {
      prn( 4, "  Serial port: %s %s\n", portname, description);
      sendTextFrame( socket, "SERIAL:%s:%s", portname, description );
    }
    else {
      prn( 0, "  Serial port: %s\n", portname );
      sendTextFrame( socket, "SERIAL:%s", portname );
    }

    break;
  }

  SetupDiDestroyDeviceInfoList( device_info );
}


void listserials ( int socket )
{
  HKEY		key;
  TCHAR		*value, *data;
  DWORD		max_value_len, max_data_size, max_data_len;
  DWORD		value_len, data_size, data_len;
  DWORD		type, index = 0;

  prn( 2,"Opening registry key\n");
  if ( RegOpenKeyEx(HKEY_LOCAL_MACHINE, _T("HARDWARE\\DEVICEMAP\\SERIALCOMM"),
		    0, KEY_QUERY_VALUE, &key) != ERROR_SUCCESS ) {
    error("RegOpenKeyEx() failed.\n");
    return ;
  }

  prn( 2,"Querying registry key value and data sizes\n");
  if ( RegQueryInfoKey(key, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
		       &max_value_len, &max_data_size, NULL, NULL) != ERROR_SUCCESS ) {
    error("RegQueryInfoKey() failed.\n");
    goto out_close;
  }

  max_data_len = max_data_size / sizeof(TCHAR);
  if (!(value = malloc((max_value_len + 1) * sizeof(TCHAR)))) {
    error("Registry value malloc failed\n");
    goto out_close;
  }

  if (!(data = malloc((max_data_len + 1) * sizeof(TCHAR)))) {
    error("Registry data malloc failed\n");
    goto out_free_value;
  }

  prn( 2,"Iterating over values\n");
  while ( value_len = max_value_len + 1,
	  data_size = max_data_size,
	  RegEnumValue( key, index, value, &value_len,
			NULL, &type, (LPBYTE)data, &data_size) == ERROR_SUCCESS )
    {
      if (type == REG_SZ) {
	data_len = data_size / sizeof(TCHAR);
	data[data_len] = '\0';
	details( socket, data );
      }
      index++;
    }

  free(data);
 out_free_value:
  free(value);
 out_close:
  RegCloseKey(key);

  sendTextFrame( socket, "SERIAL:END", 0 );
}


static void hrtime ( char *dst, uint16_t size )
{
  struct timeb t ;
  ftime( &t );
  int len = snprintf( dst, size, "HRTIME:%ld%06d", (t.time % 1000), t.millitm * 1000 );
  if ( len >= size ) {
    error("hrtime(): buffer overflow.\n");
    len=size-1;
  }
  dst[len]='\0';
}


static char itoh ( uint8_t i )
{
  if ( i<10 )
    return '0'+i ;
  return ( 'A'+i-10 );
}


static void shell ( int socket, char *data )
{
  FILE *pipe = _popen( data, "rt" );

  if ( pipe == NULL ) {
    prn(0, "SHELL:_popen(\"%s\") failed\n", data);
    sendTextFrame( socket, "SHELL:ERROR" );
    return ;
  }

  char line[128];
  char hline[256];
  while( fgets(line, sizeof(line), pipe) ) {
    //prn(0, "SHELL:%s\n", line);
    for ( int i=0 ; i<strlen(line) ; i++ ) {
      char n = line[i] ;
      hline[2*i+0] = itoh( n >> 4 );
      hline[2*i+1] = itoh( n & 0xF );
    }
    sendTextFrame( socket, "SHELL:%*s", 2*strlen(line), hline );
  }

  if ( feof(pipe) )
    sendTextFrame( socket, "SHELL:EXIT %d", _pclose(pipe) );
  else
    sendTextFrame( socket, "SHELL:ERROR before end of file" );
}


static void binaryShell ( int socket, char *data )
{
  FILE *pipe = _popen( data, "rt" );

  if ( pipe == NULL ) {
    prn(0, "SHELL:_popen(\"%s\") failed\n", data);
    sendTextFrame( socket, "SHELL:ERROR" );
    return ;
  }

  char		line[128]="SHELL:";
  size_t	n ;
  while( fgets(line+6, sizeof(line), pipe) ) {
    n = strlen(line)+6;
    write( 1, line, n );
    sendBinaryFrame( socket, line, n );
  }

  if ( feof(pipe) )
    sendTextFrame( socket, "SHELL:EXIT %d", _pclose(pipe) );
  else
    sendTextFrame( socket, "SHELL:ERROR before end of file" );
}
