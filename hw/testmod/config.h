#ifndef CONFIG_H
#define CONFIG_H

#include "config_uart.h"
#include "config_counter.h"

/*  Reverse the order of 4 lowest bits so that the lowest is the
 *  address the highest is the priority on the bus
 */
#define R4(x)	((((x)&1)<<3)|(((x)&2)<<1)|(((x)&4)>>1)|(((x)&8)>>3))


#define ADDRESS				1
#define PIN_DBG				hw_pin_6


typedef struct
{
  unsigned int	bus	: 1 ;
  unsigned int	blink	: 1 ;
} flags_t ;

#define flags	(*(volatile flags_t*)hw_ra(hw_shared, gpior2))


/*  Include board definition (includes HWA)
 */
#include BOARD_H

#if !defined __ASSEMBLER__

extern uint16_t				get_countx();
extern uint32_t				get_count32();
extern uint32_t				get_count32i();

#endif
#endif
