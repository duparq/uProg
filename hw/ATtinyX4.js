
/* Copyright (c) 2016 Christophe Duparquet.
 * http://github.com/duparq/uprog
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

var pins = [ [{name:'VCC', mode:''}],
	     [{name:'UART', mode:''}],
	     [{name:'PB1', mode:'io'}],
	     [{name:'RESET', mode:''}],
	     [{name:'PB2', mode:'io'}],
	     [{name:'PA7', mode:'io'}],
	     [{name:'PA6', mode:'io'}],
	     [{name:'PA5', mode:'io'}],
	     [{name:'PA4', mode:'io'}],
	     [{name:'PA3', mode:'io'}],
	     [{name:'PA2', mode:'io'}],
	     [{name:'PA1', mode:'io'}],
	     [{name:'PA0', mode:'io'}],
	     [{name:'GND', mode:''}] ];

hw.targets['ATtiny44']={ name:'ATtiny44', pins:pins };
hw.targets['ATtiny84']={ name:'ATtiny84', pins:pins };
hw.targets['ATtinyX4']=hw.targets['ATtiny44'];
