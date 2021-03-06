
#ifndef CONFIG_SWUART_H
#define CONFIG_SWUART_H

/*  The configuration of the software UART must be defined before including the
 *  HWA header
 */
#define UART				hw_swuart0

#define hw_swuart0_starter		hw_rel(DIABOLO_PIN_RX,pcic)
//#define hw_swuart0_starter		hw_acmp0
#define hw_swuart0_pin_txd              DIABOLO_PIN_TX
#define hw_swuart0_pin_rxd              DIABOLO_PIN_RX
#define hw_swuart0_compare		hw_counter1compare0
#define hw_swuart0_clk_div		1
#define hw_swuart0_autosync             9_1
#define hw_swuart0_pin_dbg              hw_pin_6
//#define hw_swuart0_sampling_shift	-6
#define hw_swuart0_check_tx		1

#include BOARD_H

#endif
