
static LARGE_INTEGER		us_f ;
static LARGE_INTEGER		us_t0 ;
static LARGE_INTEGER		us_t1 ;


static void us_init ( )
{
  if ( QueryPerformanceFrequency( &us_f ))
    prn( 0, "us_frequency: %lu\n", us_f );

  if ( QueryPerformanceCounter( &us_t0 ))
    prn( 0, "us_count: %lu\n", us_t0.QuadPart );
}


static uint64_t us_count ( )
{
  if ( QueryPerformanceFrequency( &us_f ) &&
       QueryPerformanceCounter( &us_t1 )) {
    uint64_t dt = (us_t1.QuadPart-us_t0.QuadPart)*1000000/us_f.QuadPart ;
    us_t0 = us_t1 ;
    return dt ;
  }
  return 0 ;
}
