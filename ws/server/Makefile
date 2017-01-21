
#	Source files
#
SOURCES		=	wsserver.c


#  MFD contains the directory name of this Makefile whatever has been included
#
MFD		:=	$(dir $(lastword $(MAKEFILE_LIST)))


#  Output directory and files basename
#
OUTDIR		?= build/$(TARGET)


#  Messages in english
#
LANG		:= C
export LANG


################################################################################
#									       #
#			General rules					       #
#									       #
################################################################################

.PHONY: all linux win32

ifeq (,$(TARGET))
all:
	$(MAKE) TARGET=linux
	$(MAKE) TARGET=win32

linux:
	$(MAKE) TARGET=linux

win32:
	$(MAKE) TARGET=win32
endif

ifeq (linux,$(TARGET))
  ARCH		:=
  OUT		:= $(OUTDIR)/wsserver
all: $(OUT)
endif

ifeq (win32,$(TARGET))
  ARCH		:= i686-w64-mingw32-
  OUT		:= $(OUTDIR)/wsserver.exe
all: $(OUT)
endif


################################################################################
#									       #
#			Toolchain commands				       #
#									       #
################################################################################

CPP		:= $(ARCH)cpp
CC		:= $(ARCH)gcc
AS		:= $(ARCH)as
OBJCOPY		:= $(ARCH)objcopy
ODUMP		:= $(ARCH)objdump
GDB		:= $(ARCH)gdb
SIZE		:= $(ARCH)size


################################################################################
#									       #
#			Dependencies					       #
#									       #
################################################################################

.PHONY: deps
deps:	$(DEPS)

#  List of dependency files
#  One dependency file is generated for each .c or .sx source file
#
DEPS	 = $(SOURCES:.c=.d)
DEPS	:= $(DEPS:.sx=.d)
DEPS	:= $(addprefix $(OUTDIR)/,$(DEPS))

#  Include dependencies
#
-include $(DEPS)

#	Dependencies of .c files
#
$(OUTDIR)/%.d: %.c
#	@echo "RULE: $@: $^"
	@mkdir -p $(OUTDIR)
	@set -e ; rm -f $@ ; $(CPP) -MM $(INCLUDES) $(DEFINES) $< >$@.tmp	;\
	sed 's,\($*\)\.o[ :]*,$(OUTDIR)/\1.o $@ : ,g' < $@.tmp > $@		\
	  && rm $@.tmp


################################################################################
#									       #
#			Compiling					       #
#									       #
################################################################################

#CFLAGS		+= --std=c11
CFLAGS		+= --std=gnu11 # required for clock_gettime under Linux
CFLAGS		+= -Wall
CFLAGS		+= -Wno-unused-function
CFLAGS		+= -Os


$(OUTDIR)/%.o: %.c
#	@echo "RULE: $@ : $^"
	@mkdir -p $(OUTDIR)
	$(CC) $(CFLAGS) -c $< -o $@


################################################################################
#									       #
#			Linking						       #
#									       #
################################################################################

#  Object files list (from source files list)
#
OBJECTS		 = $(SOURCES:.c=.o)
OBJECTS		:= $(OBJECTS:.sx=.o)
OBJECTS		:= $(addprefix $(OUTDIR)/,$(OBJECTS))

LDFLAGS		+= -s

ifeq (win32,$(TARGET))
  LDLIBS	+= -lws2_32 -lhid -lsetupapi
endif

$(OUT): $(OBJECTS) $(LDSCRIPT)
#	@echo "RULE: $@ : $^"
	@$(CC) $(LDFLAGS) -o $@ $(OBJECTS) $(LDLIBS)

#$(OUT).exe: $(OBJECTS) $(LDSCRIPT)
#	@echo "RULE: $@ : $^"
#	@$(CC) $(LDFLAGS) -o $@ $(OBJECTS) $(LDLIBS)


# win32-serial-thread.exe: *.c
# 	i686-w64-mingw32-gcc --std=gnu11 -D_ISOC99_SOURCE 	\
# 		-Wall -pedantic -Wno-unused-function -Os -s	\
# 		-o $@		 				\
# 		win32-serial-thread.c				\
# 		-lws2_32 -lhid -lsetupapi


# wsserver.exe: *.c
# 	i686-w64-mingw32-gcc --std=gnu11 -D_ISOC99_SOURCE 	\
# 		-Wall -pedantic -Wno-unused-function -Os -s	\
# 		-o $@		 				\
# 		wsserver.c					\
# 		-lws2_32 -lhid -lsetupapi

# wsserver:
# 	gcc $(CFLAGS) $(LFLAGS) wsserver.c -o wsserver


################################################################################
#									       #
#			Cleaning					       #
#									       #
################################################################################

#  Remove built files under the working directory
#
.PHONY: clean
clean:
	@echo Cleaning $(abspath $(PWD)/build)		;\
	find . -name 'build' -prune -exec rm -rf {} ';'	;\
	find . '(' 					\
		-name '*~' 				\
		-o -name '*.cp.*'			\
		-o -name '*.hwa.c'			\
		-o -name '*.pyc'			\
		')' -exec rm {} ';'
