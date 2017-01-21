
#ifndef CONFIG_COUNTER_H
#define CONFIG_COUNTER_H

/*  Counter
 */
#define COUNTER			hw_counter0
#define COUNTER_PSC		8

#define BLINK			0.025 * SYSHZ / COUNTER_PSC / 256

#endif
