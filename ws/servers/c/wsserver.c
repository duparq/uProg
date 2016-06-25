
/*
 *  Standalone minimal Websocket server (https://tools.ietf.org/html/rfc6455)
 *
 *  LANG=C gcc --std=c11 -Wall -Wno-unused-function -Os -s wsserver.c -o wsserver
 *  LANG=C i686-w64-mingw32-gcc --std=gnu11 -D_ISOC99_SOURCE -Wall -pedantic -Wno-unused-function -Os -s -o wsserver.exe wsserver.c -lws2_32 -lhid -lsetupapi
 *
 *  See:
 *	https://github.com/Links2004/arduinoWebSockets/blob/master/src/WebSocketsServer.cpp
 */

#ifdef __WIN32__
#  include <winsock2.h>
#  define socklen_t	int
#else
#  include <sys/socket.h>
#  include <netinet/in.h>
#  include <arpa/inet.h>
#endif

#include <stdarg.h>
#include <stdlib.h>
#include <stdint.h>
#include <strings.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>

#include "wsserver-lib.c"
#include "win32.c"

enum wsFrameType {
  WS_TEXT_FRAME		= 0x01,
  WS_CLOSING_FRAME	= 0x08
};

static void	frameInit ( enum wsFrameType frameType );
static void	sendFrame ( int socket );
static void	framePrintf ( char *msg, ... );
static void	sendTextFrame ( int socket, char *msg, ...);

#ifdef WIN32
#  include "wsserver-win32.c"
#else
#  include "wsserver-linux.c"
#endif


#define PORT		39000

static char		buffer[512] ;
static char		sbuf[256] ;
static int		sbuflen ;


static uint16_t frameDataLen ( )
{
  uint16_t dlen = 0xFFFF ;

  char c = buffer[1] & 0x7f ;
  if ( c < 126 )
    dlen = c ;
  else if ( c == 126 ) {
    dlen = (uint8_t)buffer[2] ;
    dlen <<= 8 ;
    dlen += (uint8_t)buffer[3];
    //prn( 0, "frameDataLen: %02X%02X = %d\n", (uint8_t)buffer[2], (uint8_t)buffer[3], dlen);
  }

  return dlen ;
}


/*  Send the frame in the buffer
 */
static void sendFrame ( int socket )
{
  uint16_t dlen = frameDataLen();

  const char *data = (dlen < 126) ? buffer+2 : buffer+4 ;
  uint16_t flen = (dlen < 126) ? dlen+2 : dlen+4 ;

  if ( dlen < 126 )
    prn( 4, "sendFrame (%d bytes): %02X %02X \"%*s\"\n",
	 flen, (uint8_t)buffer[0], (uint8_t)buffer[1], dlen, data);

  ssize_t r = send( socket, buffer, flen, 0 );

  if ( r != flen ) {
    close( socket );
    error("send() failed. Closing connection.");
  }
}


/*  Begin a new frame in the buffer
 */
static void frameInit ( enum wsFrameType frameType )
{
  /*  We only send final fragments
   */
  buffer[0] = 0x80 | frameType;
  buffer[1] = 0 ;
}


static void frameVPrintf ( char *msg, va_list ap )
{
  uint16_t dlen = frameDataLen();
  uint16_t flen = (dlen < 126) ? dlen+2 : dlen+4 ;
  char *p = buffer+flen ;

  int len = vsnprintf( p, sizeof(buffer)-flen, msg, ap );

  if ( len > sizeof(buffer)-flen ) {
    error("frames of more than %d data bytes are not supported.",
	  (int)sizeof(buffer)-4);
    return ;
  }

  /*  Update payload length
   */
  if ( dlen < 126 ) {
    dlen += len ;
    if ( dlen < 126 ) {
      buffer[1] = dlen ;
      return ;
    }

    /*  Need to move the resident payload
     */
    buffer[1] = 126;
    memmove( buffer+4, buffer+2, dlen );
    flen = dlen + 4 ;
  }
  else
    flen += len ;

  buffer[2] = flen >> 8 ;
  buffer[3] = flen & 0xFF ;
}


static void framePrintf ( char *msg, ... )
{
  va_list ap ;
  va_start( ap, msg );

  frameVPrintf( msg, ap );

  va_end( ap );
}


static void sendTextFrame ( int socket, char *msg, ... )
{
  va_list ap ;
  va_start( ap, msg );

  frameInit( WS_TEXT_FRAME );
  frameVPrintf( msg, ap );
  sendFrame( socket );

  va_end( ap );
}


/*  Process an incomming message
 */
static void onMessage ( int socket, char *data )
{
  prn( 4, "DATA: %s---\n", data );

  if ( *data == '>' ) {
    /*
     *  >HEXDATA
     */
    serialWrite( socket, data+1 );
    us_count();
    return ;
  }
  else if ( !strncmp( data, "HRTIME", 6) ) {
    prn( 3, "HRTIME\n" );

    char reply[32];
    hrtime( reply, sizeof(reply) );

    prn( 4, "REPLY: %s\n", reply );

    sendTextFrame( socket, reply );
    return ;
  }
  else if ( !strcmp( data, "SERIALS" ) ) {
    /*
     *  List of serial ports
     */
    prn( 3, "SERIALS\n" );
    listserials( socket );
    return ;
  }
  else if ( !strncmp( data, "OPEN ", 5 ) ) {
    /*
     *    <OPEN> <PORTNAME> <BAUDRATE>
     */
    char *portname ;
    char *p ;

    /*  Get serial name
     */
    portname = data+5 ;
    p = strchr( portname, ' ' );
    if ( p == 0 ) {
      //sendTextFrame( socket, "ERROR PORTNAME" );
      //return ;
      portname = "COM1" ;
      goto defaultbaud ;
    }
    *p = '\0' ; p++ ;
    prn( 0, "%s ", portname );

    uint32_t baudrate ;
    if ( sscanf( p, "%u", &baudrate ) != 1 ) {
      sendTextFrame( socket, "ERROR BAUDRATE" );
      /* return ; */
    defaultbaud:
      baudrate = 115200 ;
    }

    serialOpen( socket, portname, baudrate );
    return ;
  }

  sendTextFrame( socket, "WHAT?", 0);
}


/*  Copy 'size' chars of header field from '*src' to 'dst'
 */
int getField ( char *dst, const char **src, int size )
{
  char const *end = dst+size ;
  while ( **src != '\r' ) {
    *dst++ = **src ;
    (*src)++ ;
    if ( dst >= end ) {
      error("header field buffer overflow.\n");
      return 1 ;
    }
    *dst = '\0' ;
  }
  return 0 ;
}


/*  Wait for a Websocket header.
 *  Return 0 if OK.
 */
static int processHeader ( int socket )
{
  const char	*p ;
  char		x_upgrade = 0 ;
  char		x_connection = 0 ;
  char		x_key = 0 ;
  char		x_version = 0 ;
  char		key[25];

  /*  Wait for the connection header
   */
  //#include <sys/ioctl.h>
  /* recv( socket, 0, 0, 0 ); */
  /* int count ; */
  /* ioctl( socket, FIONREAD, &count ); */
  /* prn( 0, "Should read %d bytes.\n", count ); */
  /* char zbuf[ count ]; */
  /* buffer = zbuf ; */

  ssize_t len = recv( socket, buffer, sizeof(buffer), 0 );

  if ( len == 0 ) {
    error("header of 0 bytes, closing the connection.\n");
    return 1 ;
  }

  if ( len == -1 ) {
    error("recv() returned -1, closing the connection.\n");
    return 1 ;
  }

  buffer[len > sizeof(buffer) ? sizeof(buffer) : len] = '\0' ;

  prn( 2, "Connection header:\n%s---\n", buffer );

  if ( memcmp( buffer, "GET / HTTP/1.1\r\n", 16 ) != 0 ) {
    error("malformed GET header field: '%s'\n", buffer);
    return 1 ;
  }
  p = buffer + 16 ;

  if ( !strstr( buffer, "\r\n\r\n") ) {
    error("unterminated header:\n%s---\n", buffer);
    return 1 ;
  }

  /*  Process other fields of connection header
   */
  while ( p < buffer+len ) {
    if ( !strncmp( p, "Upgrade: websocket", 18 ) ) {
      x_upgrade = 1 ;
      prn( 2, "Upgrade: websocket;\n" );
    }
    else if ( !strncasecmp( p, "Connection: ", 12 ) ) {
      char	tmpfield[20];
      p += 12 ;
      if ( getField( tmpfield, &p, sizeof(tmpfield) ) ) {
	error("could not get 'Connection: ' field.");
	return 1 ;
      }
      if ( !strstr(tmpfield, "Upgrade") ) {
	error("no 'upgrade' in 'Connection' field.");
	return 1;
      }
      prn( 2, "Connection: upgrade;\n" );
      x_connection = 1 ;
    }
    else if ( !strncasecmp( p, "Sec-WebSocket-Key: ", 19 ) ) {
      p += 19 ;
      if ( getField( key, &p, sizeof(key) ) ) {
	error("no 'Sec-WebSocket-Key' field in connection header.");
	return 1;
      }
      prn( 2, "Sec-WebSocket-Key: %s;\n", key );
      x_key = 1 ;
    }
    else if ( !strncmp( p, "Sec-WebSocket-Version: 13", 25 ) ) {
      p += 25 ;
      prn( 2, "Sec-WebSocket-Version: 13\n" );
      x_version = 1 ;
    }
    else if ( !strncmp( p, "Sec-WebSocket-Protocol: ", 24 ) ) {
      error("unsupported field 'Sec-WebSocket-Protocol' in connection header.\n");
      return 1;
    }

    while ( *p != '\n' ) p++ ;
    p++ ;
  }

  prn( 2, "---\n");

  if ( x_upgrade == 0 ) {
    error("no 'Upgrade' field in connection header.\n");
    return 1;
  }

  if ( x_connection == 0 ) {
    error("no 'Connection' field in connection header.\n");
    return 1;
  }

  if ( x_key == 0 ) {
    error("no 'Key' field in connection header.\n");
    return 1;
  }

  if ( x_version == 0 ) {
    error("no 'Version' field in connection header.\n");
    return 1;
  }

  /*  Build the connection reply directly in the buffer
   */
  memcpy( buffer,    "HTTP/1.1 101 Switching Protocols\r\n", 34 );
  memcpy( buffer+34, "Upgrade: websocket\r\n", 20 );
  memcpy( buffer+54, "Connection: Upgrade\r\n", 21 );
  memcpy( buffer+75, "Sec-WebSocket-Accept: ", 22 );

  char *rkey = buffer + 97 ;
  memcpy( rkey, key, 24 );
  memcpy( rkey+24, "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", 36 );

  unsigned char *shkey = (unsigned char *)buffer+157 ;
  sha1( shkey, rkey, 60 );
  base64( buffer+97, shkey, 20 );

  memcpy( buffer+125, "\r\n\r\n\0", 5 );

  prn( 2, "Reply:\n%s---\n", buffer);

  ssize_t r = send( socket, buffer, 129, 0 );
  if ( r != 129 ) {
    close( socket );
    error("send() failed.");
    return 1;
  }

  return 0 ;
}


/*  Wait for a Websocket message.
 *  Return 0 if OK.
 */
static int processBuffer ( int socket, char *buffer, int len )
{
  if ( len == -1 ) {
    error("recv() returned -1.\n");
    return 0 ;
  }

  if ( len == 0 ) {
    prn( 2, "Client close the connection.\n");
    return 1 ;
  }

  if ( len < 2 ) {
    prn( 1, "Incomplete frame.");
    return 0 ;
  }

  if ( (buffer[0] & 0x80) != 0x80 ) {
    prn( 0, "Fragmented messages are not supported.\n");
    return 0 ;
  }

  if ( (buffer[0] & 0x70) != 0 ) {
    prn( 0, "Extensions are not supported.\n");
    return 1 ;
  }

  if ( (buffer[1] & 0x80) != 0x80 ) {
    prn( 0, "Frame is not masked. The server must close the connection.\n");
    return 1 ;
  }

  uint8_t opcode = buffer[0] & 0x0F;
  if ( opcode == 0x0 ) {
    prn( 0, "Continuation frames are not supported.\n");
    return 1 ;
  }
  else if ( opcode == 0x1 ) {
    prn( 2, "Text frame.\n");

    /*  Compute length of payload data
     */
    uint8_t *mkey ;
    uint16_t dlen ;
    char c = buffer[1] & 0x7f ;
    if ( c < 126 ) {
      dlen = c ;
      mkey = (uint8_t*)buffer + 2 ;
    }
    else if ( c == 126 ) {
      if ( len < 4 ) {
	error("incomplete frame.\n");
	return 0 ;
      }
      dlen = (((uint8_t)buffer[2])<<8) + ((uint8_t)buffer[3]) ;
      mkey = (uint8_t*)buffer + 4 ;
    }
    else if ( c == 127 ) {
      error("text frames of size > 65535 bytes are not supported.\n");
      return 0 ;
    }

    /*  Unmask payload data
     */
    char *data = (char*)mkey + 4 ;
    for ( int i = 0 ; i < dlen ; i++ )
      data[i] = data[i] ^ mkey[i%4] ;

    /*  Process data
     */
    data[dlen]='\0';
    onMessage( socket, data );
  }
  else if ( opcode == 0x2 ) {
    prn( 0, "Binary frames are not supported.\n");
    return 0 ;
  }
  else if ( opcode == 0x8 ) {
    prn( 0, "Closing frame. Sending a closing frame back.\n");
    frameInit( WS_CLOSING_FRAME );
    sendFrame( socket );
  }
  else if ( opcode == 0x9 ) {
    prn( 0, "Ping frames are not supported.\n");
    return 0 ;
  }
  else if ( opcode == 0xA ) {
    prn( 0, "Pong frames are not supported.\n");
    return 0 ;
  }
  else {
    prn( 0, "Frames of type 0x%X are not supported.\n", opcode);
    return 0 ;
  }

  return 0 ;
}


static void usage ( )
{
  printf("RFC6455 Websocket server (protocol 13)\n");
  printf("Options:\n");
  printf("  -v <n>, --verbose <n>    level of verbosity:\n");
  printf("                             0: errors only.\n");
  printf("                            *1: connection status.\n");
  printf("                             2: messages.\n");
  printf("\n");
}


int main ( int ac, char** av )
{
#ifdef __WIN32__
  WORD		versionWanted = MAKEWORD(1,1);
  WSADATA	wsaData ;
  WSAStartup( versionWanted, &wsaData );
#endif

  us_init();

  verbosity = 2 ;

  /*  Process command line options
   */
  for ( int i=1 ; i<ac ; i++ ) {
    if ( !strcmp(av[i], "-h") || !strcmp(av[i], "--help") ) {
      usage();
      return 0 ;
    }
    else if ( !strcmp(av[i], "-v") || !strcmp(av[i], "--verbose") ) {
      i++ ;
      if ( i == ac || sscanf(av[i],"%d",&verbosity) != 1 ) {
	usage();
	return 1 ;
      }
    }
    else {
      usage();
      return 1 ;
    }
  }


  int serverId = socket( AF_INET, SOCK_STREAM, 0 );
  if ( serverId == -1 ) {
    error("can not create listening socket.\n");
    return 1 ;
  }

  if ( setsockopt( serverId, SOL_SOCKET, SO_REUSEADDR,
		   (void*)&(int){1}, sizeof(int) ) < 0 ) {
    error("can not use setsockopt(SO_REUSEADDR).\n");
    return  1;
  }

  struct sockaddr_in serverAddr;
  memset( &serverAddr, 0, sizeof(serverAddr) );
  serverAddr.sin_family = AF_INET;
  serverAddr.sin_addr.s_addr = INADDR_ANY;
  serverAddr.sin_port = htons(PORT);

  if ( bind( serverId,
	     (struct sockaddr*) &serverAddr,
	     sizeof(serverAddr) ) == -1 ) {
    error("can not bind listening socket.\n");
    return 1 ;
  }

  if ( listen( serverId, 1 ) == -1 ) {
    error("socket can not listen.");
    return 1 ;
  }

  prn( 1, "Listening on %s:%d\n", inet_ntoa( serverAddr.sin_addr ), ntohs( serverAddr.sin_port ));

  for(;;) {
    struct sockaddr_in clientAddr;
    socklen_t sockaddrLen = sizeof(clientAddr);
    int clientId = accept( serverId, (struct sockaddr*) &clientAddr, &sockaddrLen );

    if ( clientId == -1 ) {
      error("accept() returned -1.\n");
      continue ;
    }

    prn( 1, "\n\nConnection from %s:%d\n",
	 inet_ntoa(clientAddr.sin_addr), ntohs(clientAddr.sin_port) );

#if 0
    /*
     *  Synchronous
     */
    if ( processHeader( clientId )) {
      close( clientId );
      continue ;
    }

    for(;;) {
      ssize_t len = recv( clientId, buffer, sizeof(buffer), 0 );
      if ( processBuffer( clientId, buffer, len )) {
	close( clientId );
	break ;
      }
    }
#else
    /*
     *  Asynchronous
     */
    if ( processHeader( clientId )) {
      close( clientId );
      continue ;
    }

    /*  Put the connection socket in non-blocking mode
     */
    if ( ioctlsocket( clientId, FIONBIO, &(unsigned long){1} )) {
      close( clientId );
      error("ioctlsocket() failed.\n");
      continue ;
    }

    struct fd_set 	set ;
    struct timeval	tv ;

    while( clientId) {
      //prn( 2, "\nWaiting for a new message from client.\n");

      FD_ZERO( &set );
      FD_SET( clientId, &set );
      tv.tv_sec = 0 ;
      tv.tv_usec = 100 ;

      int r = select( 1, &set, 0, 0, &tv );

      if ( r == -1 ) {
	error("select() failed.\n");
	break ;
      }
      if ( r ) {
	/*
	 *  client socket has data to be read
	 */
	if ( FD_ISSET( clientId, &set )) {
	  ssize_t len = recv( clientId, buffer, sizeof(buffer), 0 );
	  if ( processBuffer( clientId, buffer, len )) {
	    close( clientId );
	    clientId = 0 ;
	    break ;
	  }
	}
      }

      /*  Data on the serial port ?
       */
      if ( sid != INVALID_HANDLE_VALUE ) {
	for(;;) {
	  char	c ;
	  DWORD	n ;
	  ReadFile( sid, &c, 1, &n, 0 );
	  if ( n == 0 ) {
	    if ( sbuflen > 0 ) {
	      uint64_t dt = us_count();
	      prn( 0, "serialRead: %lu\n", dt );
	    sendsbuf:
	      frameInit( WS_TEXT_FRAME );
	      framePrintf("<");
	      for ( int i=0 ; i<sbuflen ; i++ )
		framePrintf( "%02X", (uint8_t)sbuf[i] );
	      sbuflen = 0 ;
	      sendFrame( clientId );
	    }
	    break ;
	  }
	  else {
	    if ( sbuflen < sizeof(sbuf) ) {
	      sbuf[sbuflen++] = c ;
	    }
	    else
	      goto sendsbuf ;
	  }
	}
      }
    }
#endif
  }
}
