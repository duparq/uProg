#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os.path
sys.path.insert(1,os.path.normpath(sys.path[0]+"/hwa/python"))
sys.path.insert(2,os.path.normpath(sys.path[1]+"/pyserial-3.0"))

import __builtin__
import premain
from utils import s2hex
import time

import link
import struct

#  Command line arguments
#
import argparse
parser = argparse.ArgumentParser()

#  Add arguments about serial port
#
link.add_arguments(parser)

args = parser.parse_args()

#  Open serial interface
#
serial = link.get( args )

#  Release the RESET signal and detect how many wires are used (this will make
#  Diabolo start the application as soon as it has computed the CRC).
#
serial.set_RESET(1)
#serial.wires = 1
serial.detect_wires('?')
cout("Wires: %d\n" % serial.wires)
time.sleep(0.13)
#serial.serial.timeout = 0.001


#  Enumerate modules
#    Send sync sequence
#    Wait for module address
#
raddr = 0
address = 0
modules = []
cout("Enumeration: ")
for i in range(1,15):
    serial.tx(chr(0x00)+chr(0xFF))	# Synchronization sequence (9+1)
    r = serial.rx(1)
    if len(r)==1:
        raddr = ord(r) & 0x0F
        address = ((raddr&1)<<3) | ((raddr&2)<<1) | ((raddr&4)>>1) | ((raddr&8)>>3)
        cout("%02d " % address)
        modules.append(raddr)
    else:
        cout(".. ")
        flushout()
cout('\n')

if not modules:
    sys.exit(0)

sys.exit(0)

t0 = 0
tick=time.time()
n = 0
while True:

    #  Command byte
    #
    serial.tx(chr(raddr | 0x60))

    r = serial.rx(1)
    if len(r)==0:
        cout("ERROR: no reply\n")
    else:
        cout("REPLY: %s\n" % s2hex(r))

    #break
    tick += 0.05
    if tick > time.time():
        time.sleep( tick - time.time() )

serial.close()
