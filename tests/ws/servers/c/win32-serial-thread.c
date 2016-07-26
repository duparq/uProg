
#include <winsock2.h>
//#define socklen_t	int

#include <stdarg.h>
#include <stdlib.h>
#include <stdint.h>
#include <strings.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>

#include <windows.h>
#include <setupapi.h>

#include <ntdef.h>
#include <initguid.h> /* before ntddser.h */
#include <ntddser.h>
#include <cfgmgr32.h>

#include <sys/timeb.h>


#include "wsserver-lib.c"
#include "win32.c"


static HANDLE		sid = INVALID_HANDLE_VALUE ; /* Serial id */

int main ( )
{
  sid = CreateFile( "COM1",  
		    GENERIC_READ | GENERIC_WRITE, 
		    0,			// exclusive access
		    0,			// default security attributes
		    OPEN_EXISTING,
		    FILE_ATTRIBUTE_NORMAL /* | FILE_FLAG_OVERLAPPED */, /* Asynchronous I/Os */
		    0 );

  if ( sid == INVALID_HANDLE_VALUE ) {
    prn( 0, "ERROR SERIAL CreateFile() failed" );
    return 1 ;
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
    prn( 0, "ERROR SERIAL SetCommTimeouts() failed" );
  close:
    if ( CloseHandle( sid ) == 0 )
      prn( 0, "ERROR SERIAL CloseHandle() failed" );
    sid = INVALID_HANDLE_VALUE ;
    return 1 ;
  }

  /*  Clear errors
   */
  DWORD		errors ;
  COMSTAT	status;

  if ( ClearCommError( sid, &errors, &status ) == 0 ) {
    prn( 0, "ClearCommError() failed" );
    goto close ;
  }

  /*  Frame format
   */
  DCB		dcb ;

  memset( &dcb, 0, sizeof(DCB) );
  dcb.DCBlength = sizeof(DCB);

  if ( !GetCommState( sid, &dcb ) ) {
    prn( 0, "ERROR SERIAL GetCommState() failed" );
    goto close ;
  }

  dcb.BaudRate    = 9600 ;
  dcb.ByteSize    = 8 ;
  dcb.Parity      = NOPARITY ;
  dcb.StopBits    = ONESTOPBIT ;
  dcb.fBinary     = TRUE;
  dcb.fDtrControl = DTR_CONTROL_DISABLE ;
  dcb.fRtsControl = RTS_CONTROL_DISABLE ;

  if ( !SetCommState( sid, &dcb ) ) {
    prn( 0, "ERROR SERIAL SetCommState() failed" );
    goto close ;
  }


  /*  Overlapped
   */
#if 0
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

  DWORD		ev;

  if ( WaitCommEvent( sid, &ev, &o )) {
    /* Process char received */
  }
  else {
    if( GetLastError() != ERROR_IO_PENDING )
      sendTextFrame(socket, "Wait failed with error %d.\n", GetLastError());
  }
#endif

  us_init();

  int x = 0 ;

  for( int i=0 ; /* i<100 */ ; i++ ) {
    char	c ;
    DWORD	n ;
    us_count();
    ReadFile( sid, &c, 1, &n, 0 );
    uint32_t dt = us_count();
    if ( n != 0 ) {
      prn( 0, "us_count: %lu\n", dt );
      prn( 0, "ReadFile(): %lu bytes\n", n );
      x = 0 ;
    }
    else {
      if ( x == 0 ) {
	prn( 0, "us_count: %lu\n", dt );
	prn( 0, "ReadFile(): %lu bytes\n\n", n );
	x = 1 ;
      }
    }
  }
  sleep(500);
}
