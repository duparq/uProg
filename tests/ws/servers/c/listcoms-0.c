
/*
 *  LANG=C i686-w64-mingw32-gcc-win32 -Wall --std=c11 -Os -s listcoms.c -lws2_32 -o listcoms.exe
 */

#define _WIN32_WINNT 0x0501

#include <windows.h>
#include <ddk/hidsdi.h>
#include <setupapi.h>

/* using namespace std; */

int main(int argc, char * argv[])
{
  GUID guidHID;
  HidD_GetHidGuid(&guidHID);
  HDEVINFO hdiSet = SetupDiGetClassDevs(&guidHID, "USB", NULL, DIGCF_PRESENT);/*Create and populate device info list*/
  SetupDiDestroyDeviceInfoList(hdiSet);//Called to free the memory occupied by the deviceinfolist
  return 0;
}
