
#include "config.h"


extern void		bus_sm();

uint32_t test ( )
{
  static uint32_t val ;

  return val++ ;
}


void fail ( uint8_t n )
{
  hw_disable_interrupts();
  hw_write( PIN_DBG, 1 );
  for( uint8_t i=0 ; i<n ; i++ )
    hw_waste_cycles(100e-6 * 8e6);
  hw_toggle( PIN_DBG );
  hw_sleep();
}


int
main ( )
{
  hwa_begin_from_reset();
  hwa_config( UART );
  hwa_config( PIN_LED, direction, output );
  hwa_config( PIN_DBG, direction, output );
  hwa_config( hw_core0,
              sleep,      enabled,
              sleep_mode, idle );

  /*  We can change the system clock frequency if
   *  we do not use a crystal oscillator.
   */
#if !defined HW_DEVICE_CLK_SRC_HZ
  hwa_write_reg( hw_core0, osccal, 0xFF );
#  define SYSHZ		13.6e6
#else
#  define SYSHZ		hw_syshz
#endif

  hwa_commit();

  hw_enable_interrupts();
    
  /*  Wait for bus synchronization
   */
  while( !hw_stat(UART).sync )
    hw_sleep();

  /* hw_write( UART, hw_read_reg(UART, dtn) ); */

  /*  Signal the synchronization
   */
  hw_write( PIN_LED, 1 );

  /*  Counter
   */
#if hw_id(COUNTER) != hw_id(hw_rel(hw_rel(UART,_compare),counter))
  hwa_config( COUNTER,
  	      clock,	 prescaler_output(8),
  	      countmode, up_loop );
#endif
  hwa_turn_irq( COUNTER, overflow, on );
  hwa_commit();

  /*  Main loop: process UART byte events or sleep
   */
  uint16_t blink = 0 ;
  for(;;) {
    hw_stat_t(UART) st = hw_stat(UART);
    if ( st.rxc || st.txc )
      bus_sm();

    if ( flags.bus ) {
      flags.bus = 0 ;
      /*
       *  Trigger a blinking
       */
      if ( ! flags.blink ) {
	flags.blink = 1 ;
	blink = get_countx()+BLINK ;
	hw_write( PIN_LED, 0 );
      }
    }

    if ( flags.blink ) {
      /*
       *  Process blinking
       */
      if ( get_countx() >= blink ) {
	if ( !hw_read( PIN_LED ) ) {
	  hw_write( PIN_LED, 1 );
	  blink += BLINK ;
	}
	else
	  flags.blink = 0 ;
      }
    }
  }
}
