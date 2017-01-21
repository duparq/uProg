
/*
 *  Standalone Websocket server
 *
 *  Borrowed from Andrey Putilov's websocket
 *
 *  LANG=C gcc -Wall --std=c11 -Os -s shatest.c -o shatest
 *  LANG=C i686-w64-mingw32-gcc -Wall --std=c11 -Os -s -o shatest.exe shatest.c -lws2_32
 *
 *  See:
 *	https://github.com/Links2004/arduinoWebSockets/blob/master/src/WebSocketsServer.cpp
 */

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdint.h>


static void base64 ( char *dst, const unsigned char *src, size_t srclen )
{
  static char table[] = {
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '+', '/'};

  static int mod_table[] = {0, 2, 1};

  for( int i=0, j=0 ; i < srclen ; ) {
    uint32_t octet_a = (unsigned char)src[i++];
    uint32_t octet_b = ( i < srclen ) ? (unsigned char)src[i++] : 0 ;
    uint32_t octet_c = ( i < srclen ) ? (unsigned char)src[i++] : 0 ;

    uint32_t triple = (octet_a << 16) + (octet_b << 8) + octet_c;

    dst[j++] = table[(triple >> 3 * 6) & 0x3F];
    dst[j++] = table[(triple >> 2 * 6) & 0x3F];
    dst[j++] = table[(triple >> 1 * 6) & 0x3F];
    dst[j++] = table[(triple >> 0 * 6) & 0x3F];
  }

  int dstlen = 4 * ((srclen + 2) / 3);
  for (int i = 0; i < mod_table[srclen % 3]; i++)
    dst[dstlen - 1 - i] = '=';
}


/* static void base64 ( char *buf, const unsigned char *p, size_t n ) */
/* { */
/*   const char t[64] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; */
/*   unsigned x ; */
        
/*   for ( size_t i = 0; i < n; ++i ) { */
/*     x = p[i] << 0x10; */
/*     x |= (++i < n ? p[i] : 0) << 0x08; */
/*     x |= (++i < n ? p[i] : 0) << 0x00; */
                
/*     *buf++ = t[x >> 3 * 6 & 0x3f]; */
/*     *buf++ = t[x >> 2 * 6 & 0x3f]; */
/*     *buf++ = (((n - 0 - i) >> 31) & '=') | */
/*       (~((n - 0 - i) >> 31) & t[x >> 1 * 6 & 0x3f]); */
/*     *buf++ = (((n - 1 - i) >> 31) & '=') | */
/*       (~((n - 1 - i) >> 31) & t[x >> 0 * 6 & 0x3f]); */
/*   } */
/* } */

static void sha1mix ( unsigned *restrict r, unsigned *restrict w )
{
#define rol(x,s) ((x) << (s) | (unsigned) (x) >> (32 - (s)))
#define mix(f,v) do {				\
    t = (f) + (v) + rol(a, 5) + e + w[i & 0xf]; \
    e = d;					\
    d = c;					\
    c = rol(b, 30);				\
    b = a;					\
    a = t;					\
  } while (0)

  unsigned a = r[0];
  unsigned b = r[1];
  unsigned c = r[2];
  unsigned d = r[3];
  unsigned e = r[4];
  unsigned t, i = 0;

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

  r[0] += a;
  r[1] += b;
  r[2] += c;
  r[3] += d;
  r[4] += e;

#undef mix
#undef rol
}

static void sha1 ( unsigned char *h, const void *restrict p, size_t n )
{
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


int main ( )
{
  char		buffer[256];
  const char	*key = "7HAt1nTDMaTU0eLkyq6FUQ==";

  printf("KEY: %s\n", key);

  memcpy( buffer,    "HTTP/1.1 101 Switching Protocols\r\n", 34 );
  memcpy( buffer+34, "Upgrade: websocket\r\n", 20 );
  memcpy( buffer+54, "Connection: Upgrade\r\n", 21 );
  memcpy( buffer+75, "Sec-WebSocket-Accept: ", 22 );

  char *rkey = buffer + 97 ;
  memcpy( rkey, key, 24 );
  memcpy( rkey+24, "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", 36 );

  unsigned char *shkey = (unsigned char *)buffer+157 ;
  sha1( shkey, rkey, 60 );

  printf("SHA1: ");
  for (int i=0 ; i<20 ; i++)
    printf("%02X", shkey[i]);
  printf("\n");

  base64( buffer+97, shkey, 20 );
  buffer[97+28]='\0';

  printf("BASE64: %s\n", buffer+97);

  /* memcpy( buffer+125, "\r\n\r\n\0", 5 ); */

  /* printf("Reply:\n%s---\n", buffer); */
  
  return 0 ;
}
