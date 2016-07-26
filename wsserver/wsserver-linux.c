
#include <time.h>		/* --std=gnu11 required for clock_gettime() */


#define TERMIOS		2

#if TERMIOS == 1
#  include <termios.h>
#  include <sys/ioctl.h>
#else
#  include <stropts.h>
#  include <asm/ioctl.h>
#  include <asm/termios.h>
#endif


typedef int	HANDLE ;
#define INVALID_HANDLE_VALUE	-1

static HANDLE			sid = INVALID_HANDLE_VALUE ; /* Serial id */
static uint32_t			us_t0 ;


static void us_init ( )
{
  struct timespec t ;
  clock_gettime( CLOCK_REALTIME, &t );
  us_t0 = (t.tv_sec % 1000)*1000000 + t.tv_nsec / 1000 ;
}


static uint64_t us_count ( )
{
  struct timespec t ;
  clock_gettime( CLOCK_REALTIME, &t );
  uint32_t t1 = (t.tv_sec % 1000)*1000000 + t.tv_nsec / 1000 ;
  uint32_t dt = t1 - us_t0 ;
  us_t0 = t1 ;
  return dt ;
}


/* static void hrtime ( char *dst, uint16_t size ) */
/* { */
/*   struct timespec t ; */
/*   clock_gettime( CLOCK_REALTIME, &t ); */
/*   int len = snprintf( dst, size, "HRTIME:%lu%06lu", (t.tv_sec % 1000), t.tv_nsec / 1000 ); */
/*   if ( len >= size ) { */
/*     error("hrtime(): buffer overflow.\n"); */
/*     len=size-1; */
/*   } */
/*   dst[len]='\0'; */
/* } */


static void listserials ( int socket )
{
  prn( 4, "listserials\n" );

  char path[] = "/dev/ttyUSB?" ;
  for ( uint8_t i=0 ; i<8 ; i++ ) {
    path[sizeof(path)-2] = '0'+i ;
    int fd = open( path, O_RDWR );
    if ( fd != -1 ) {
      close(fd);
      sendTextFrame( socket, "SERIAL:%s", path );
    }
  }

  sendTextFrame( socket, "SERIAL:END" );
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
      ioctl( sid, TIOCSBRK, 0 );
    else if ( data[1] == '1' )
      ioctl( sid, TIOCCBRK, 0 );
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
    int flags = TIOCM_DTR ;
    if ( data[1] == '0' )
      ioctl( sid, TIOCMBIS, &flags );
    else if ( data[1] == '1' )
      ioctl( sid, TIOCMBIC, &flags );
    else
      goto error ;
    goto cret ;
  }
  else if ( data[0] == 'S' ) {
    /*
     *    S0 | S1 : RTS control
     */
    int status;

    if ( ioctl(sid, TIOCMGET, &status) == -1 )
      goto error ;

    if ( data[1] == '0' )
        status |= TIOCM_RTS;
    else if ( data[1] == '1' )
        status &= ~TIOCM_RTS;
    else
      goto error ;

    if ( ioctl(sid, TIOCMSET, &status) == -1 )
      goto error ;

    /* int flags = TIOCM_RTS ; */
    /* if ( data[1] == '0' ) */
    /*   ioctl( sid, TIOCMBIS, &flags ); */
    /* else if ( data[1] == '1' ) */
    /*   ioctl( sid, TIOCMBIC, &flags ); */
    /* else */
    /*   goto error ; */
    /* goto cret ; */
    goto cret ;
  }

  /*  Hexadecimal data string
   */

  /*  WARNING: the ASCII -> binary translation is done directly into the input
      buffer. So, if we need to send a frame to the client, that will overwrite
      the buffer so we need to create a copy first.
   */

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
      return ;
    }
    *(binary+n) = (b1<<4) | b2 ;
    src += 2 ;
    n++ ;
  }

  ssize_t w = write( sid, binary, n );

  if ( w != n ) {
    sendTextFrame( socket, "ERROR SERIAL write() failed" );
  }
}


static void serialOpen ( int socket, const char *portname, uint32_t baudrate )
{
  sid = open( portname, O_RDWR | O_NONBLOCK | O_NOCTTY );

  if ( sid == INVALID_HANDLE_VALUE ) {
    sendTextFrame(socket, "ERROR SERIAL open() failed" );
    return ;
  }

#if TERMIOS == 1
  tcflush( sid, TCIOFLUSH );

  int flags = TIOCM_DTR | TIOCM_RTS ;
  ioctl( sid, TIOCMBIC, &flags );

  struct termios termios ;

  int speed = cfsetospeed( &termios, B115200 /* baudrate */ );
  if ( speed != baudrate ) {
    sendTextFrame(socket, "ERROR SERIAL cfsetospeed: %d", speed );
  abort:
    close( sid );
    sid = INVALID_HANDLE_VALUE ;
    return ;
  }

  cfsetispeed( &termios, B115200 /* baudrate */ );
  //cfmakeraw( &termios );  
  termios.c_iflag &= ~(/* IGNBRK | */ BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL | IXON);
  termios.c_iflag |= (IGNBRK | IGNPAR);
  termios.c_oflag &= ~OPOST;
  termios.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
  termios.c_cflag &= ~(CSIZE | PARENB /* | CRTSCTS */);
  termios.c_cflag |= CS8;

  if ( tcsetattr( sid, TCSANOW, &termios ) == -1 ) {
    sendTextFrame(socket, "ERROR SERIAL tcsetattr failed" );
    goto abort ;
    /* close( sid ); */
    /* sid = INVALID_HANDLE_VALUE ; */
    /* return ; */
  }
#else

  /*  Set /DTR and /RTS high
   */
  int flags = TIOCM_DTR | TIOCM_RTS ;
  ioctl( sid, TIOCMBIC, &flags );
  //ioctl( sid, TIOCMBIC, &flags );

  struct termios2 tio;

  if ( ioctl( sid, TCGETS2, &tio ) == -1 ) {
    sendTextFrame(socket, "ERROR SERIAL TCGETS2 failed" );
  abort:
    close( sid );
    sid = INVALID_HANDLE_VALUE ;
    return ;
  }

  tio.c_cflag &= ~CBAUD;
  tio.c_cflag |= BOTHER;
  tio.c_ispeed = baudrate ;
  tio.c_ospeed = baudrate ;

  tio.c_iflag &= ~(/* IGNBRK | */ BRKINT | PARMRK | ISTRIP | INLCR | IGNCR | ICRNL | IXON);
  tio.c_iflag |= (IGNBRK | IGNPAR);
  tio.c_oflag &= ~OPOST;
  tio.c_lflag &= ~(ECHO | ECHONL | ICANON | ISIG | IEXTEN);
  tio.c_cflag &= ~(CSIZE | PARENB | CSTOPB | CRTSCTS);
  tio.c_cflag |= CS8;

  if ( ioctl( sid, TCSETS2, &tio ) == -1 ) {
    sendTextFrame(socket, "ERROR SERIAL TCSETS2 failed" );
    goto abort ;
  }
#endif

  sendTextFrame(socket, "$ " );
}


static void serialClose ( )
{
  if ( sid != INVALID_HANDLE_VALUE ) {
    close( sid );
    sid = INVALID_HANDLE_VALUE ;
  }
}


static void binaryShell ( int socket, char *data )
{
#if 0
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
#endif
}
