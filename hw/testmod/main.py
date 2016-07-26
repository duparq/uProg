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

#  Add serial port arguments
#
link.add_arguments(parser)

args = parser.parse_args()

#  Open serial interface
#
serial = link.get( args )

#  Release the RESET signal and detect how many wires are used (this will make
#  Diabolo start the application as soon as it has computed the CRC).
#
serial.set_RESET(0)
time.sleep(0.01)
serial.set_RESET(1)
#serial.wires = 1
serial.detect_wires('?')
cout("Wires: %d\n" % serial.wires)
time.sleep(0.13)
#serial.serial.timeout = 0.001

# serial.serial.timeout = 0.01
# serial.wires = 1
# #s = chr(0xF8)
# s = chr(0x00)+chr(0xFF)
# #s = s * 10
# while True:
#     serial.set_RESET(0)
#     time.sleep(0.01)
#     serial.set_RESET(1)
#     time.sleep(0.19)
#     serial.tx(s)
#     # serial.serial.read(10)
#     # serial.serial.write(s)
#     # print "%d\n" % ord(serial.serial.read(10)[1])
#     time.sleep(0.8)
# serial.close()
# sys.exit(0)


CMD_ID = 0x70
CMD_VAL = 0x60


def R4(x):
    return ((x&1)<<3) | ((x&2)<<1) | ((x&4)>>1) | ((x&8)>>3)


class Anim:
    sanim = "|/-\\|/-\\"
    nanim = 0

    @classmethod
    def step(cls):
        cout("%c\x08" % cls.sanim[cls.nanim])
        flushout()
        cls.nanim = (cls.nanim+1) % 8


#  Enumerate modules
#    Send sync sequence
#    Send a ID command to each module
#    Wait for module reply
#
raddr = 0
address = 0
modules = {}
cout("Enumeration: ")
for i in range(4):
    serial.tx(chr(0x00)+chr(0xFF))	# Synchronization sequence (9+1)
    # serial.tx(chr(0x00))	# Synchronization sequence (9+1)
    # time.sleep(0.001)
    # serial.tx(chr(0xFF))	# Synchronization sequence (9+1)
    # time.sleep(0.001)
    # serial.tx(chr(0x00))	# Synchronization sequence (9+1)
    # time.sleep(0.001)
    # serial.tx(chr(0xFF))	# Synchronization sequence (9+1)
    # time.sleep(0.001)
    #serial.tx('AA')			# Synchronization sequence (5+1)
    for j in range(1,2):
        if not modules.has_key(j):
            serial.tx(chr(0x80 | 0x70 | R4(j)))	# Send command 'ID' to module #j
            c = serial.rx(1,10,1)
            if len(c)==0:
                #cout(".. ")
                #flushout()
                Anim.step()
            else:
                addr = R4(ord(c) & 0x0F)
                if addr != j:
                    cout("Address mismatch: %d/%d\n" % (addr/j))
                    continue
                cmd = ord(c) & 0x70
                if cmd != 0x70:
                    cout("Command mismatch: 0x%02X/0x70\n" % cmd)
                    continue
                cout("%02d " % j)
                flushout()
                r = ""
                while (ord(c) & 0x80) == 0:
                    c = serial.rx(1,10,1)
                    if len(c)==0:
                        break
                    r += c
                r = r[:-1]+chr( ord(r[-1]) & 0x7F )
                modules[addr] = r
    time.sleep(0.01)
cout('\n')

#serial.close()

if not modules:
    sys.exit(0)

cout("Modules:\n")
for m in modules:
    cout("%d: %s\n" % (m, modules[m]))

serial.close()
sys.exit(0)


addr = 1
n0 = 0
d0 = 0
to = time.time()
noreplys = 0
while True:
    t = time.time()
    if to > t:
        time.sleep(to-t)
    to += 0.01

    #serial.flush()
    while True:
        c = serial.rx(1,1,1)
        if len(c):
            cout("Unexpected character 0x%02X\n" % ord(c));
        else:
            break

    # j=1
    # serial.tx(chr(0x80 | 0x70 | R4(j)))	# Send command 'ID' to module #j
    # c = serial.rx(1,10,1)
    # if len(c)==0:
    #     noreplys += 1
    #     cout("NO REPLY #%d\n" % noreplys)
    #     if noreplys > 4:
    #         sys.exit(1)
    # else:
    #     addr = R4(ord(c) & 0x0F)
    #     if addr != j:
    #         cout("Address mismatch: %d/%d\n" % (addr/j))
    #         continue
    #     cmd = ord(c) & 0x70
    #     if cmd != 0x70:
    #         cout("Command mismatch: 0x%02X/0x70\n" % cmd)
    #         continue
    #     cout("%02d " % j)
    #     flushout()
    #     while (ord(c) & 0x80) == 0:
    #         c = serial.rx(1,10,1)
    #         if len(c)==0:
    #             break

    serial.tx(chr(0x80 | CMD_VAL | R4(addr)))	# Send command 'VAL'
    c = serial.rx(1,10,1)
    if len(c)==0:
        noreplys += 1
        cout("NO REPLY #%d\n" % noreplys)
        if noreplys > 4:
            sys.exit(1)
        continue
    else:
        if addr != R4(ord(c) & 0x0F):
            cout("Address mismatch: %d/%d\n" % (R4(ord(c) & 0x0F),addr))
            continue
        if CMD_VAL != ord(c) & 0x70:
            cout("Command mismatch: 0x%02X/0x70\n" % cmd)
            continue
        #cout(s2hex(c))
        cout("%.3f: " % t)
        flushout()
        r=""
        while (ord(c) & 0x80) == 0:
            c = serial.rx(1,10,1)
            if len(c)==0:
                cout(" DISCONNECTED?\n")
                break
            r += chr(ord(c) & 0x7F)
        cout(s2hex(r))
        n = 0
        for i in range(len(r)-1,-1,-1):
            n <<= 7
            n |= ord(r[i])
        d = n-n0
        if d>0 or d<-16000000:
            cout(" %d %+d\n" % (n,d))
        else:
            cout(" %d %+d %08X\n" % (n,d,n))
        n0 = n
        d0 = d
