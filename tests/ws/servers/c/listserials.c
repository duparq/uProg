/*
 *  LANG=C i686-w64-mingw32-gcc -Wall --std=c11 -Os -s -o listserials.exe listserials.c -lhid -lsetupapi
 */

#include <windows.h>
#include <setupapi.h>

#include <ntdef.h>
#include <initguid.h> /* before ntddser.h */
#include <ntddser.h>
#include <cfgmgr32.h>

#include <stdio.h>

#define DEBUG(x)		printf(x)
#define DEBUG_FMT(...)		printf(__VA_ARGS__)
#define SET_FAIL(x,y)		printf(y)
#define SET_ERROR(x,y,z)	printf(z)


void details ( const char *portname )
{
  /*
   * Description limited to 127 char, anything longer
   * would not be user friendly anyway.
   */
  char description[128];
  SP_DEVINFO_DATA device_info_data = { .cbSize = sizeof(device_info_data) };
  HDEVINFO device_info;
  int i;

  device_info = SetupDiGetClassDevs(NULL, 0, 0,
				    DIGCF_PRESENT | DIGCF_ALLCLASSES);
  if (device_info == INVALID_HANDLE_VALUE)
    //RETURN_FAIL("SetupDiGetClassDevs() failed");
    return ;

  for (i = 0; SetupDiEnumDeviceInfo(device_info, i, &device_info_data); i++) {
    HKEY device_key;
    DEVINST dev_inst;
    char value[8], class[16];
    DWORD size, type;
    CONFIGRET cr;

    /* Check if this is the device we are looking for. */
    device_key = SetupDiOpenDevRegKey(device_info, &device_info_data,
				      DICS_FLAG_GLOBAL, 0,
				      DIREG_DEV, KEY_QUERY_VALUE);
    if (device_key == INVALID_HANDLE_VALUE)
      continue;
    size = sizeof(value);
    if (RegQueryValueExA(device_key, "PortName", NULL, &type, (LPBYTE)value,
			 &size) != ERROR_SUCCESS || type != REG_SZ) {
      RegCloseKey(device_key);
      continue;
    }
    RegCloseKey(device_key);
    value[sizeof(value)-1] = 0;
    if (strcmp(value, portname))
      continue;

    /* Check port transport type. */
    dev_inst = device_info_data.DevInst;
    size = sizeof(class);
    cr = CR_FAILURE;
    while (CM_Get_Parent(&dev_inst, dev_inst, 0) == CR_SUCCESS &&
	   (cr = CM_Get_DevNode_Registry_PropertyA(dev_inst,
						   CM_DRP_CLASS, 0, class, &size, 0)) != CR_SUCCESS) { }
    if (cr == CR_SUCCESS) {
      if (!strcmp(class, "USB"))
	//	port->transport = SP_TRANSPORT_USB;
	printf("  Transport: USB\n");
    }

    /* Get port description (friendly name). */
    dev_inst = device_info_data.DevInst;
    size = sizeof(description);
    while ((cr = CM_Get_DevNode_Registry_PropertyA(dev_inst,
						   CM_DRP_FRIENDLYNAME, 0, description, &size, 0)) != CR_SUCCESS
	   && CM_Get_Parent(&dev_inst, dev_inst, 0) == CR_SUCCESS) { }
    if (cr == CR_SUCCESS)
      //      port->description = strdup(description);
      printf("  Description: %s\n", description);

    break;
  }

  SetupDiDestroyDeviceInfoList(device_info);

  //RETURN_OK();
}


int main ( int ac, char **av )
{
  HKEY key;
  TCHAR *value, *data;
  DWORD max_value_len, max_data_size, max_data_len;
  DWORD value_len, data_size, data_len;
  DWORD type, index = 0;

  DEBUG("Opening registry key\n");
  if (RegOpenKeyEx(HKEY_LOCAL_MACHINE, _T("HARDWARE\\DEVICEMAP\\SERIALCOMM"),
		   0, KEY_QUERY_VALUE, &key) != ERROR_SUCCESS) {
    SET_FAIL(ret, "RegOpenKeyEx() failed\n");
    goto out_done;
  }

  DEBUG("Querying registry key value and data sizes\n");
  if (RegQueryInfoKey(key, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
		      &max_value_len, &max_data_size, NULL, NULL) != ERROR_SUCCESS) {
    SET_FAIL(ret, "RegQueryInfoKey() failed\n");
    goto out_close;
  }

  max_data_len = max_data_size / sizeof(TCHAR);
  if (!(value = malloc((max_value_len + 1) * sizeof(TCHAR)))) {
    SET_ERROR(ret, SP_ERR_MEM, "Registry value malloc failed\n");
    goto out_close;
  }

  if (!(data = malloc((max_data_len + 1) * sizeof(TCHAR)))) {
    SET_ERROR(ret, SP_ERR_MEM, "Registry data malloc failed\n");
    goto out_free_value;
  }

  DEBUG("Iterating over values\n");
  while (
	 value_len = max_value_len + 1,
	 data_size = max_data_size,
	 RegEnumValue(key, index, value, &value_len,
		      NULL, &type, (LPBYTE)data, &data_size) == ERROR_SUCCESS)
    {
      if (type == REG_SZ) {
	data_len = data_size / sizeof(TCHAR);
	data[data_len] = '\0';
	DEBUG_FMT("Found port %s", data);
	details( data );
      }
      index++;
    }

  free(data);
 out_free_value:
  free(value);
 out_close:
  RegCloseKey(key);
 out_done:

  //  return ret ;
  return 0 ;
}
