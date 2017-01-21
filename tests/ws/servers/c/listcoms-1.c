
/*
 *  LANG=C i686-w64-mingw32-gcc-win32 -Wall --std=c11 -Os -s listcoms.c -lws2_32 -o listcoms.exe
 */
#define _WIN32_WINNT 0x0501

#include <windows.h>
//#include <ntddstor.h>
//#include <ddk/hidsdi.h>
#include <setupapi.h>
#include <initguid.h> /* before ntddser.h */
//#include <ddk/ntddser.h>

#include <stdio.h>


/* _Return_type_success_(return != 0) */
BOOL QueryUsingSetupAPI(const GUID *guid, /* _In_ */ DWORD dwFlags )
/*, _Out_ CPortsArray& ports, _Out_ CNamesArray& friendlyNames */
{
  //Create a "device information set" for the specified GUID
  HDEVINFO hDevInfoSet = SetupDiGetClassDevs(guid, NULL, NULL, dwFlags);
  if (hDevInfoSet == INVALID_HANDLE_VALUE)
    return FALSE;

  //Finally do the enumeration
  BOOL bMoreItems = TRUE;
  int nIndex = 0;
  SP_DEVINFO_DATA devInfo;
  while (bMoreItems)
    {
      printf("ONE\n");
      //Enumerate the current device
      devInfo.cbSize = sizeof(SP_DEVINFO_DATA);
      bMoreItems = SetupDiEnumDeviceInfo(hDevInfoSet, nIndex, &devInfo);
      if (bMoreItems)
	{
	  //Did we find a serial port for this device
	  BOOL bAdded = FALSE;

	  //Get the registry key which stores the ports settings
	  /* ATL::CRegKey deviceKey; */
	  /* deviceKey.Attach(SetupDiOpenDevRegKey(hDevInfoSet, &devInfo, DICS_FLAG_GLOBAL, 0, DIREG_DEV, KEY_QUERY_VALUE)); */
	  /* if (deviceKey != INVALID_HANDLE_VALUE) */
	  /* { */
	  /*   int nPort = 0; */
	  /*   if (QueryRegistryPortName(deviceKey, nPort)) */
	  /*   { */
	  /*   #ifdef CENUMERATESERIAL_USE_STL */
	  /*     ports.push_back(nPort); */
	  /*   #else */
	  /*     ports.Add(nPort); */
	  /*   #endif //#ifdef CENUMERATESERIAL_USE_STL */
	  /*     bAdded = TRUE; */
	  /*   } */
	  /* } */

	  /* //If the port was a serial port, then also try to get its friendly name */
	  /* if (bAdded) */
	  /* { */
	  /*   ATL::CHeapPtr<BYTE> byFriendlyName; */
	  /*   if (QueryDeviceDescription(hDevInfoSet, devInfo, byFriendlyName)) */
	  /*   { */
	  /*   #ifdef CENUMERATESERIAL_USE_STL */
	  /*     friendlyNames.push_back(reinterpret_cast<LPCTSTR>(byFriendlyName.m_pData)); */
	  /*   #else */
	  /*     friendlyNames.Add(reinterpret_cast<LPCTSTR>(byFriendlyName.m_pData)); */
	  /*   #endif //#ifdef CENUMERATESERIAL_USE_STL */
	  /*   } */
	  /*   else */
	  /*   { */
	  /*   #ifdef CENUMERATESERIAL_USE_STL */
	  /*     friendlyNames.push_back(_T("")); */
	  /*   #else */
	  /*     friendlyNames.Add(_T("")); */
	  /*   #endif //#ifdef CENUMERATESERIAL_USE_STL */
	  /*   } */
	  /* } */
	}

      ++nIndex;
    }

  //Free up the "device information set" now that we are finished with it
  SetupDiDestroyDeviceInfoList(hDevInfoSet);

  //Return the success indicator
  return TRUE;
}


int main ( int ac, char **av )
{
  QueryUsingSetupAPI( NULL, 0 );

  /* HDEVINFO devInfoSet = SetupDiGetClassDevs( &GUID_DEVINTERFACE_COMPORT, */
  /* 					     NULL, NULL, */
  /* 					     DIGCF_PRESENT ); */
  HDEVINFO devInfoSet = SetupDiGetClassDevs( NULL,
					     "USB", NULL,
					     0 );
  if ( devInfoSet == INVALID_HANDLE_VALUE )
    return FALSE;

  int index = 0 ;
  SP_DEVINFO_DATA devInfo ;
  
  for(;;) {
    printf("HERE\n");
    devInfo.cbSize = sizeof(SP_DEVINFO_DATA);
    if ( SetupDiEnumDeviceInfo( devInfoSet, index, &devInfo ) ) {
      printf("HERE\n");
    }
    else
      break ;
  }

  /*  Free memory
   */
  SetupDiDestroyDeviceInfoList( devInfoSet );
  return 0 ;
}
