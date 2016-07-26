
LANG	= C

export LANG


win32-serial-thread.exe: *.c
	i686-w64-mingw32-gcc --std=gnu11 -D_ISOC99_SOURCE 	\
		-Wall -pedantic -Wno-unused-function -Os -s	\
		-o $@		 				\
		win32-serial-thread.c				\
		-lws2_32 -lhid -lsetupapi


all: wsserver.exe wsserver


wsserver.exe: *.c
	i686-w64-mingw32-gcc --std=gnu11 -D_ISOC99_SOURCE 	\
		-Wall -pedantic -Wno-unused-function -Os -s	\
		-o $@		 				\
		wsserver.c					\
		-lws2_32 -lhid -lsetupapi

wsserver: *.c
	gcc --std=c11 -Wall -Wno-unused-function -Os -s wsserver.c -o wsserver
