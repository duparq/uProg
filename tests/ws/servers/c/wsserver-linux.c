
#include <time.h>		/* --std=gnu11 required for clock_gettime() */

static uint16_t hrtime ( char *dst )
{
  struct timespec t ;
  clock_gettime( CLOCK_REALTIME, &t );
  return sprintf( dst, "HRTIME:%lu%06lu", (t.tv_sec % 1000), t.tv_nsec / 1000 );
}
