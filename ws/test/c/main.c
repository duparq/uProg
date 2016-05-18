
/*
 * Borrowed from Andrey Putilov's websocket
 */

#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>


#define PORT		8080
#define BUF_LEN		0xFFFF
#define PACKET_DUMP


static uint8_t		gBuffer[BUF_LEN];
static char		x_quit ;
static char		rn[] = "\r\n";


#ifndef TRUE
#define TRUE 1
#endif
#ifndef FALSE
#define FALSE 0
#endif

static const char connectionField[] = "Connection: ";
static const char upgrade[] = "upgrade";
static const char upgrade2[] = "Upgrade";
static const char upgradeField[] = "Upgrade: ";
static const char websocket[] = "websocket";
static const char hostField[] = "Host: ";
static const char originField[] = "Origin: ";
static const char keyField[] = "Sec-WebSocket-Key: ";
static const char protocolField[] = "Sec-WebSocket-Protocol: ";
static const char versionField[] = "Sec-WebSocket-Version: ";
static const char version[] = "13";
static const char secret[] = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

enum wsFrameType { // errors starting from 0xF0
  WS_EMPTY_FRAME = 0xF0,
  WS_ERROR_FRAME = 0xF1,
  WS_INCOMPLETE_FRAME = 0xF2,
  WS_TEXT_FRAME = 0x01,
  WS_BINARY_FRAME = 0x02,
  WS_PING_FRAME = 0x09,
  WS_PONG_FRAME = 0x0A,
  WS_OPENING_FRAME = 0xF3,
  WS_CLOSING_FRAME = 0x08
};
    
enum wsState {
  WS_STATE_OPENING,
  WS_STATE_NORMAL,
  WS_STATE_CLOSING
};

struct handshake {
  char *host;
  char *origin;
  char *key;
  char *resource;
  enum wsFrameType frameType;
};


static void die ( const char *msg )
{
  perror(msg);
  exit(EXIT_FAILURE);
}


static void s2h ( const uint8_t *msg, size_t max )
{
  for ( ; *msg && max>0 ; max--, msg++ )
    printf("%02x", *msg);
}


static size_t base64len(size_t n) {
  return (n + 2) / 3 * 4;
}


static size_t base64(char *buf, size_t nbuf, const unsigned char *p, size_t n) {
  const char t[64] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  size_t i, m = base64len(n);
  unsigned x;
        
  if (nbuf >= m)
    for (i = 0; i < n; ++i) {
      x = p[i] << 0x10;
      x |= (++i < n ? p[i] : 0) << 0x08;
      x |= (++i < n ? p[i] : 0) << 0x00;
                
      *buf++ = t[x >> 3 * 6 & 0x3f];
      *buf++ = t[x >> 2 * 6 & 0x3f];
      *buf++ = (((n - 0 - i) >> 31) & '=') |
	(~((n - 0 - i) >> 31) & t[x >> 1 * 6 & 0x3f]);
      *buf++ = (((n - 1 - i) >> 31) & '=') |
	(~((n - 1 - i) >> 31) & t[x >> 0 * 6 & 0x3f]);
    }
        
  return m;
}



#if _MSC_VER
# define _sha1_restrict __restrict
#else
# define _sha1_restrict __restrict__
#endif

#define SHA1_SIZE 20


static void sha1mix(unsigned *_sha1_restrict r, unsigned *_sha1_restrict w) {
  unsigned a = r[0];
  unsigned b = r[1];
  unsigned c = r[2];
  unsigned d = r[3];
  unsigned e = r[4];
  unsigned t, i = 0;

#define rol(x,s) ((x) << (s) | (unsigned) (x) >> (32 - (s)))
#define mix(f,v) do {				\
    t = (f) + (v) + rol(a, 5) + e + w[i & 0xf]; \
    e = d;					\
    d = c;					\
    c = rol(b, 30);				\
    b = a;					\
    a = t;					\
  } while (0)

  for (; i < 16; ++i)
    mix(d ^ (b & (c ^ d)), 0x5a827999);

  for (; i < 20; ++i) {
    w[i & 0xf] = rol(w[(i+13) & 0xf] ^ w[(i+8) & 0xf] ^ w[(i+2) & 0xf] ^ w[i & 0xf], 1);
    mix(d ^ (b & (c ^ d)), 0x5a827999);
  }

  for (; i < 40; ++i) {
    w[i & 0xf] = rol(w[(i+13) & 0xf] ^ w[(i+8) & 0xf] ^ w[(i+2) & 0xf] ^ w[i & 0xf], 1);
    mix(b ^ c ^ d, 0x6ed9eba1);
  }

  for (; i < 60; ++i) {
    w[i & 0xf] = rol(w[(i+13) & 0xf] ^ w[(i+8) & 0xf] ^ w[(i+2) & 0xf] ^ w[i & 0xf], 1);
    mix((b & c) | (d & (b | c)), 0x8f1bbcdc);
  }

  for (; i < 80; ++i) {
    w[i & 0xf] = rol(w[(i+13) & 0xf] ^ w[(i+8) & 0xf] ^ w[(i+2) & 0xf] ^ w[i & 0xf], 1);
    mix(b ^ c ^ d, 0xca62c1d6);
  }

#undef mix
#undef rol

  r[0] += a;
  r[1] += b;
  r[2] += c;
  r[3] += d;
  r[4] += e;
}


static void sha1(unsigned char h[static SHA1_SIZE], const void *_sha1_restrict p, size_t n) {
  size_t i = 0;
  unsigned w[16], r[5] = {0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0};

  for (; i < (n & ~0x3f);) {
    do w[i >> 2 & 0xf] =
	 ((const unsigned char *) p)[i + 3] << 0x00 |
	 ((const unsigned char *) p)[i + 2] << 0x08 |
	 ((const unsigned char *) p)[i + 1] << 0x10 |
	 ((const unsigned char *) p)[i + 0] << 0x18;
    while ((i += 4) & 0x3f);
    sha1mix(r, w);
  }

  memset(w, 0, sizeof w);

  for (; i < n; ++i)
    w[i >> 2 & 0xf] |= ((const unsigned char *) p)[i] << (((3^i) & 3) << 3);

  w[i >> 2 & 0xf] |= 0x80 << (((3^i) & 3) << 3);

  if ((n & 0x3f) > 56) {
    sha1mix(r, w);
    memset(w, 0, sizeof w);
  }

  w[15] = n << 3;
  sha1mix(r, w);

  for (i = 0; i < 5; ++i)
    h[(i << 2) + 0] = (unsigned char) (r[i] >> 0x18),
      h[(i << 2) + 1] = (unsigned char) (r[i] >> 0x10),
      h[(i << 2) + 2] = (unsigned char) (r[i] >> 0x08),
      h[(i << 2) + 3] = (unsigned char) (r[i] >> 0x00);
}


void nullHandshake(struct handshake *hs)
{
  hs->host = NULL;
  hs->origin = NULL;
  hs->resource = NULL;
  hs->key = NULL;
  hs->frameType = WS_EMPTY_FRAME;
}


void freeHandshake(struct handshake *hs)
{
  if (hs->host) {
    free(hs->host);
  }
  if (hs->origin) {
    free(hs->origin);
  }
  if (hs->resource) {
    free(hs->resource);
  }
  if (hs->key) {
    free(hs->key);
  }
  nullHandshake(hs);
}


static char* getUptoLinefeed(const char *startFrom)
{
  char *writeTo = NULL;
  uint8_t newLength = strstr(startFrom, rn) - startFrom;
  writeTo = (char *)malloc(newLength+1); //+1 for '\x00'
  memcpy(writeTo, startFrom, newLength);
  writeTo[ newLength ] = 0;

  return writeTo;
}


enum wsFrameType wsParseHandshake(const uint8_t *inputFrame, size_t inputLength,
                                  struct handshake *hs)
{
  const char *inputPtr = (const char *)inputFrame;
  const char *endPtr = (const char *)inputFrame + inputLength;

  if (!strstr((const char *)inputFrame, "\r\n\r\n"))
    return WS_INCOMPLETE_FRAME;
	
  if (memcmp(inputFrame, "GET ", 4) != 0)
    return WS_ERROR_FRAME;
  // measure resource size
  char *first = strchr((const char *)inputFrame, ' ');
  if (!first)
    return WS_ERROR_FRAME;
  first++;
  char *second = strchr(first, ' ');
  if (!second)
    return WS_ERROR_FRAME;

  if (hs->resource) {
    free(hs->resource);
    hs->resource = NULL;
  }
  hs->resource = (char *)malloc(second - first + 1); // +1 is for \x00 symbol

  if (sscanf(inputPtr, "GET %s HTTP/1.1\r\n", hs->resource) != 1)
    return WS_ERROR_FRAME;
  inputPtr = strstr(inputPtr, rn) + 2;

  /*
    parse next lines
  */
#define prepare(x) do {if (x) { free(x); x = NULL; }} while(0)
#define strtolower(x) do { int i; for (i = 0; x[i]; i++) x[i] = tolower(x[i]); } while(0)

  uint8_t connectionFlag = FALSE;
  uint8_t upgradeFlag = FALSE;
  uint8_t subprotocolFlag = FALSE;
  uint8_t versionMismatch = FALSE;
  while (inputPtr < endPtr && inputPtr[0] != '\r' && inputPtr[1] != '\n') {
    if (memcmp(inputPtr, hostField, strlen(hostField)) == 0) {
      inputPtr += strlen(hostField);
      prepare(hs->host);
      hs->host = getUptoLinefeed(inputPtr);
    }
    else if (memcmp(inputPtr, originField, strlen(originField)) == 0) {
      inputPtr += strlen(originField);
      prepare(hs->origin);
      hs->origin = getUptoLinefeed(inputPtr);
    } else if (memcmp(inputPtr, protocolField, strlen(protocolField)) == 0) {
      inputPtr += strlen(protocolField);
      subprotocolFlag = TRUE;
    } else if (memcmp(inputPtr, keyField, strlen(keyField)) == 0) {
      inputPtr += strlen(keyField);
      prepare(hs->key);
      hs->key = getUptoLinefeed(inputPtr);
    } else if (memcmp(inputPtr, versionField, strlen(versionField)) == 0) {
      inputPtr += strlen(versionField);
      char *versionString = NULL;
      versionString = getUptoLinefeed(inputPtr);
      if (memcmp(versionString, version, strlen(version)) != 0)
	versionMismatch = TRUE;
      free(versionString);
    } else if (memcmp(inputPtr, connectionField, strlen(connectionField)) == 0) {
      inputPtr += strlen(connectionField);
      char *connectionValue = NULL;
      connectionValue = getUptoLinefeed(inputPtr);
      strtolower(connectionValue);
      if (strstr(connectionValue, upgrade) != NULL)
	connectionFlag = TRUE;
      free(connectionValue);
    } else if (memcmp(inputPtr, upgradeField, strlen(upgradeField)) == 0) {
      inputPtr += strlen(upgradeField);
      char *compare = NULL;
      compare = getUptoLinefeed(inputPtr);
      strtolower(compare);
      if (memcmp(compare, websocket, strlen(websocket)) == 0)
	upgradeFlag = TRUE;
      free(compare);
    };

    inputPtr = strstr(inputPtr, rn) + 2;
  }

  // we have read all data, so check them
  if (!hs->host || !hs->key || !connectionFlag || !upgradeFlag || subprotocolFlag
      || versionMismatch)
    {
      hs->frameType = WS_ERROR_FRAME;
    } else {
    hs->frameType = WS_OPENING_FRAME;
  }
    
  return hs->frameType;
}


void wsGetHandshakeAnswer(const struct handshake *hs, uint8_t *outFrame, 
                          size_t *outLength)
{
  char *responseKey = NULL;
  uint8_t length = strlen(hs->key)+strlen(secret);
  responseKey = malloc(length);
  memcpy(responseKey, hs->key, strlen(hs->key));
  memcpy(&(responseKey[strlen(hs->key)]), secret, strlen(secret));
  unsigned char shaHash[20];
  memset(shaHash, 0, sizeof(shaHash));
  sha1(shaHash, responseKey, length);
  size_t base64Length = base64(responseKey, length, shaHash, 20);
  responseKey[base64Length] = '\0';
    
  int written = sprintf((char *)outFrame,
			"HTTP/1.1 101 Switching Protocols\r\n"
			"%s%s\r\n"
			"%s%s\r\n"
			"Sec-WebSocket-Accept: %s\r\n\r\n",
			upgradeField,
			websocket,
			connectionField,
			upgrade2,
			responseKey);
	
  free(responseKey);
  // if assert fail, that means, that we corrupt memory
  *outLength = written;
}

void wsMakeFrame(const uint8_t *data, size_t dataLength,
                 uint8_t *outFrame, size_t *outLength, enum wsFrameType frameType)
{
  outFrame[0] = 0x80 | frameType;
    
  if (dataLength <= 125) {
    outFrame[1] = dataLength;
    *outLength = 2;
  } else if (dataLength <= 0xFFFF) {
    outFrame[1] = 126;
    uint16_t payloadLength16b = htons(dataLength);
    memcpy(&outFrame[2], &payloadLength16b, 2);
    *outLength = 4;
  } else {
        
    /* implementation for 64bit systems
       outFrame[1] = 127;
       dataLength = htonll(dataLength);
       memcpy(&outFrame[2], &dataLength, 8);
       *outLength = 10;
       */
  }
  memcpy(&outFrame[*outLength], data, dataLength);
  *outLength+= dataLength;
}

static size_t getPayloadLength(const uint8_t *inputFrame, size_t inputLength,
                               uint8_t *payloadFieldExtraBytes, enum wsFrameType *frameType) 
{
  size_t payloadLength = inputFrame[1] & 0x7F;
  *payloadFieldExtraBytes = 0;
  if ((payloadLength == 0x7E && inputLength < 4) || (payloadLength == 0x7F && inputLength < 10)) {
    *frameType = WS_INCOMPLETE_FRAME;
    return 0;
  }
  if (payloadLength == 0x7F && (inputFrame[3] & 0x80) != 0x0) {
    *frameType = WS_ERROR_FRAME;
    return 0;
  }

  if (payloadLength == 0x7E) {
    uint16_t payloadLength16b = 0;
    *payloadFieldExtraBytes = 2;
    memcpy(&payloadLength16b, &inputFrame[2], *payloadFieldExtraBytes);
    payloadLength = ntohs(payloadLength16b);
  } else if (payloadLength == 0x7F) {
    *frameType = WS_ERROR_FRAME;
    return 0;
        
    /* // implementation for 64bit systems
       uint64_t payloadLength64b = 0;
       *payloadFieldExtraBytes = 8;
       memcpy(&payloadLength64b, &inputFrame[2], *payloadFieldExtraBytes);
       if (payloadLength64b > SIZE_MAX) {
       *frameType = WS_ERROR_FRAME;
       return 0;
       }
       payloadLength = (size_t)ntohll(payloadLength64b);
    */
  }

  return payloadLength;
}

enum wsFrameType wsParseInputFrame(uint8_t *inputFrame, size_t inputLength,
                                   uint8_t **dataPtr, size_t *dataLength)
{
  if (inputLength < 2)
    return WS_INCOMPLETE_FRAME;
	
  if ((inputFrame[0] & 0x70) != 0x0) // checks extensions off
    return WS_ERROR_FRAME;
  if ((inputFrame[0] & 0x80) != 0x80) // we haven't continuation frames support
    return WS_ERROR_FRAME; // so, fin flag must be set
  if ((inputFrame[1] & 0x80) != 0x80) // checks masking bit
    return WS_ERROR_FRAME;

  uint8_t opcode = inputFrame[0] & 0x0F;
  if (opcode == WS_TEXT_FRAME ||
      opcode == WS_BINARY_FRAME ||
      opcode == WS_CLOSING_FRAME ||
      opcode == WS_PING_FRAME ||
      opcode == WS_PONG_FRAME
      ){
    enum wsFrameType frameType = opcode;

    uint8_t payloadFieldExtraBytes = 0;
    size_t payloadLength = getPayloadLength(inputFrame, inputLength,
					    &payloadFieldExtraBytes, &frameType);
    if (payloadLength > 0) {
      if (payloadLength + 6 + payloadFieldExtraBytes > inputLength) // 4-maskingKey, 2-header
	return WS_INCOMPLETE_FRAME;
      uint8_t *maskingKey = &inputFrame[2 + payloadFieldExtraBytes];

      *dataPtr = &inputFrame[2 + payloadFieldExtraBytes + 4];
      *dataLength = payloadLength;
		
      size_t i;
      for (i = 0; i < *dataLength; i++) {
	(*dataPtr)[i] = (*dataPtr)[i] ^ maskingKey[i%4];
      }
    }
    return frameType;
  }

  return WS_ERROR_FRAME;
}


static int safeSend ( int clientSocket, const uint8_t *buffer, size_t bufferSize )
{
#ifdef PACKET_DUMP
  //  printf("out packet:\n");
  //  fwrite(buffer, bufferSize, 1, stdout);

  printf("OUT %d bytes (", (int)bufferSize);
  s2h(buffer,bufferSize);
  printf("): %*s\n", (int)bufferSize, buffer);
#endif

  ssize_t written = send(clientSocket, buffer, bufferSize, 0);
  if (written == -1) {
    close(clientSocket);
    perror("send failed");
    return EXIT_FAILURE;
  }
  if (written != bufferSize) {
    close(clientSocket);
    perror("written not all bytes");
    return EXIT_FAILURE;
  }
    
  return EXIT_SUCCESS;
}


/*  Process all incomming data
 *  
 */
void clientWorker(int clientSocket)
{
  memset(gBuffer, 0, BUF_LEN);
  size_t readLength = 0;
  size_t frameSize = BUF_LEN;
  enum wsState state = WS_STATE_OPENING;
  uint8_t *data = NULL;
  size_t dataSize = 0;
  enum wsFrameType frameType = WS_INCOMPLETE_FRAME;
  struct handshake hs;
  nullHandshake(&hs);
    
#define prepareBuffer frameSize = BUF_LEN; memset(gBuffer, 0, BUF_LEN);
#define initNewFrame frameType = WS_INCOMPLETE_FRAME; readLength = 0; memset(gBuffer, 0, BUF_LEN);
    
  while (frameType == WS_INCOMPLETE_FRAME) {
    ssize_t read = recv(clientSocket, gBuffer+readLength, BUF_LEN-readLength, 0);
    if (!read) {
      close(clientSocket);
      perror("recv failed");
      return;
    }

#ifdef xPACKET_DUMP
    printf("in packet:\n");
    fwrite(gBuffer, 1, read, stdout);
    printf("\n");
#endif

    readLength+= read;

    if (state == WS_STATE_OPENING)
      frameType = wsParseHandshake(gBuffer, readLength, &hs);
    else
      frameType = wsParseInputFrame(gBuffer, readLength, &data, &dataSize);

    if ((frameType == WS_INCOMPLETE_FRAME && readLength == BUF_LEN)
	|| frameType == WS_ERROR_FRAME) {
      if (frameType == WS_INCOMPLETE_FRAME)
	printf("buffer too small");
      else
	printf("error in incoming frame\n");
            
      if (state == WS_STATE_OPENING) {
	printf("Bad Request\n");
	prepareBuffer;
	frameSize = sprintf((char *)gBuffer,
			    "HTTP/1.1 400 Bad Request\r\n"
			    "%s%s\r\n\r\n",
			    versionField,
			    version);
	safeSend(clientSocket, gBuffer, frameSize);
	break;
      } else {
	printf("WS_STATE_CLOSING\n");
	prepareBuffer;
	wsMakeFrame(NULL, 0, gBuffer, &frameSize, WS_CLOSING_FRAME);
	if (safeSend(clientSocket, gBuffer, frameSize) == EXIT_FAILURE)
	  break;
	state = WS_STATE_CLOSING;
	initNewFrame;
      }
    }
        
    if (state == WS_STATE_OPENING) {
      printf("state == WS_STATE_OPENING\n");
      if (frameType == WS_OPENING_FRAME) {
	printf("frameType == WS_OPENING_FRAME\n");
	// if resource is right, generate answer handshake and send it
	if (strcmp(hs.resource, "/echo") != 0) {
	  frameSize = sprintf((char *)gBuffer, "HTTP/1.1 404 Not Found\r\n\r\n");
	  safeSend(clientSocket, gBuffer, frameSize);
	  break;
	}
                
	prepareBuffer;
	wsGetHandshakeAnswer(&hs, gBuffer, &frameSize);
	freeHandshake(&hs);
	if (safeSend(clientSocket, gBuffer, frameSize) == EXIT_FAILURE)
	  break;
	state = WS_STATE_NORMAL;
	printf("state == WS_STATE_NORMAL\n");
	initNewFrame;
      }
    }
    else if (frameType == WS_CLOSING_FRAME) {
      if (state == WS_STATE_CLOSING) {
	break;
      } else {
	prepareBuffer;
	wsMakeFrame(NULL, 0, gBuffer, &frameSize, WS_CLOSING_FRAME);
	safeSend(clientSocket, gBuffer, frameSize);
	break;
      }
    }
    else if (frameType == WS_TEXT_FRAME) {
      printf("frameType == WS_TEXT_FRAME\n");
      /*
       *  Process received text
       */
      uint8_t *receivedString = NULL;
      receivedString = malloc(dataSize+1);
      memcpy(receivedString, data, dataSize);
      receivedString[ dataSize ] = 0;

      printf("IN %d bytes (", (int)dataSize);
      s2h(receivedString, dataSize);
      printf("): %*s\n", (int)dataSize, receivedString);
      if ( !strncmp((const char*)receivedString, "quit", 4) ) {
	x_quit = 1 ;
	break ;
      }

      prepareBuffer;
      wsMakeFrame(receivedString, dataSize, gBuffer, &frameSize, WS_TEXT_FRAME);
      free(receivedString);

      printf("REPLY: ");
      s2h(gBuffer, frameSize);

      if (safeSend(clientSocket, gBuffer, frameSize) == EXIT_FAILURE)
	break;
      initNewFrame;
    }
  }
    
  close(clientSocket);
}


int main(int argc, char** argv)
{
  int listenSocket = socket(AF_INET, SOCK_STREAM, 0);
  if (listenSocket == -1)
    die("create socket failed");

  if (setsockopt(listenSocket, SOL_SOCKET, SO_REUSEADDR, &(int){ 1 }, sizeof(int)) < 0)
    die("setsockopt(SO_REUSEADDR) failed");

  struct sockaddr_in local;
  memset(&local, 0, sizeof(local));
  local.sin_family = AF_INET;
  local.sin_addr.s_addr = INADDR_ANY;
  local.sin_port = htons(PORT);
  if (bind(listenSocket, (struct sockaddr *) &local, sizeof(local)) == -1) {
    die("bind failed");
  }
    
  if (listen(listenSocket, 1) == -1) {
    die("listen failed");
  }
  printf("opened %s:%d\n", inet_ntoa(local.sin_addr), ntohs(local.sin_port));
    
  while (!x_quit) {
    struct sockaddr_in remote;
    socklen_t sockaddrLen = sizeof(remote);
    int clientSocket = accept(listenSocket, (struct sockaddr*)&remote, &sockaddrLen);

    if (clientSocket == -1)
      die("accept failed");
        
    printf("connected %s:%d\n", inet_ntoa(remote.sin_addr), ntohs(remote.sin_port));
    clientWorker(clientSocket);
    printf("disconnected\n");
  }
    
  close(listenSocket);
  return EXIT_SUCCESS;
}
