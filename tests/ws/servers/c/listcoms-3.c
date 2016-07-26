
/*
 *  LANG=C i686-w64-mingw32-gcc -Wall --std=c11 -Os -s -o out.exe listcoms-3.c libserialport/build/lib/libserialport.a -lhid -lsetupapi
 */

#include "libserialport/libserialport.h"

#include <stdio.h>

/**/

int main ( int ac, char **av )
{
  struct sp_port 	**ports ;

  if ( sp_list_ports( &ports ) == SP_OK ) {
    printf("OK\n");

    for( struct sp_port **p = ports ; *p ; p++ ) {
      printf("Port: %s, %s\n", sp_get_port_name(*p), sp_get_port_description( *p ));

      enum sp_transport pt = sp_get_port_transport( *p );
      if ( pt == SP_TRANSPORT_NATIVE )
	printf("  Native\n");
      else if ( pt == SP_TRANSPORT_USB ) {
	printf("  USB\n");
	printf("    Serial: %s\n", sp_get_port_usb_serial( *p ));
	printf("    Product: %s\n", sp_get_port_usb_product( *p ));
	printf("    Manufacturer: %s\n", sp_get_port_usb_manufacturer( *p ));
      }
      else if ( pt == SP_TRANSPORT_BLUETOOTH )
	printf("  Bluetooth\n");
    }

    sp_free_port_list( ports );
  }
  else
    printf("sp_list_ports() failed.\n");

  return 0 ;
}
