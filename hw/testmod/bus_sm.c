
#include "config.h"
#include "state_machine.h"

#pragma GCC diagnostic ignored "-Wpedantic"

/*  Protocol
 *    Bytes are sent LSb first
 *
 *    Byte 0
 *      bit 7     : FIN = 1 for final byte of message
 *      bits 6..4 : CMD command code
 *      bits 3..0 : ADDRESS (reversed for collision management)
 */
#define FIN		0x80
#define CMD_ID		0x70
#define CMD_VAL		0x60

static const uint8_t	*txptr ;
static uint8_t		txcnt ;
static uint8_t		byte ;

static uint8_t		buf[16];

extern uint32_t		count ;


typedef union {
  struct {
    unsigned int	b0 : 7 ;
    unsigned int	b1 : 7 ;
    unsigned int	b2 : 7 ;
    unsigned int	b3 : 7 ;
    unsigned int	b4 : 4 ;
  };
  uint32_t		w ;
} tr_t ;


void bus_sm ( )
{
  STATE_MACHINE(1);

  SM_RESUME();

  /*  Initial (default) state: first byte of a message
   */
  byte = hw_read(UART);

  /*  Process the byte
   */
  if ( (byte & 0x0F) != R4(ADDRESS) ) {
    /*
     *  We're not addressed: skip all until the end of the message
     */
  skip:
    while ( !(byte & FIN) ) {
      SM_YIELD();
      byte = hw_read(UART);
    }
    SM_RESET();
    return ;
  }

  /*  Signal that we're addressed
   */
  flags.bus = 1 ;

  /*  Process the message
   */
  if ( byte == (FIN | CMD_ID | R4(ADDRESS)) ) {
    /*
     *  'ID': return module identification
     */
    /* hw_write( PIN_DBG, 1 ); */
    /* ascii2buf( 0x50, "ABC" ); */
    uint8_t *p = buf ;
    *p++ = R4(ADDRESS) | CMD_ID ;
    *p++ = 'T' ;
    *p++ = '8' ;
    *p++ = '5' ;
    *p++ = 'M' ;
    *p++ = '0' ;
    *p = '0' | FIN ;
    txcnt = 7 ;
  }
  else if ( byte == (FIN | CMD_VAL | R4(ADDRESS)) ) {
    /*
     *  'VALUE': return counter value
     */
    tr_t t ;
    t.w = get_count32();
    uint8_t *p = buf ;
    *p++ = R4(ADDRESS) | CMD_VAL ;
    *p++ = t.b0 ;
    *p++ = t.b1 ;
    *p++ = t.b2 ;
    *p++ = t.b3 ;
    *p++ = t.b4 | FIN ;
    txcnt = 6 ;

    /* uint32_t t = get_count32(); */
    /* uint8_t *p = buf ; */
    /* *p++ = R4(ADDRESS) | CMD_VAL ; */
    /* *p++ = (t & 0x7F); */
    /* t >>= 7 ; */
    /* *p++ = (t & 0x7F); */
    /* t >>= 7 ; */
    /* *p++ = (t & 0x7F); */
    /* t >>= 7 ; */
    /* *p++ = (t & 0x7F); */
    /* t >>= 7 ; */
    /* *p++ = t | FIN ; */
    /* txcnt = 6 ; */
  }
  else {
    /*
     *  Can not understand the message: skip it
     */
    goto skip ;
  }

  /*  Send buffer if not empty
   */
  if ( txcnt ) {
    txptr = buf ;
    while ( txcnt ) {
      hw_write( UART, *txptr++ );
      SM_YIELD();
      txcnt-- ;
    }
    hw_clear( UART );
  }

  SM_RESET();
}
