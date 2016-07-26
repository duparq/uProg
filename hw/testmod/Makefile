
#	Source files
#
SOURCES		=	main.c			\
			bus_sm.c		\
			counter.sx		\
			swuart.sx

CONFIG		=	HW_DEVICE			\
			hw_syshz			\
			hw_swuart0_pin_rxd		\
			hw_swuart0_pin_txd		\
			hw_swuart0_autosync		\
			hw_swuart0_compare		\
			hw_swuart0_clk_div		\
			PIN_LED				\
			UART				\
			OSCCAL

BOARD		?=	attiny85-3v3


HWA	= $(HOME)/dev/hwa

include $(HWA)/atmel/avr/examples/Makefile
