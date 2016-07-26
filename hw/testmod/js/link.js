#!/usr/bin/env node

"use strict";

var log = require('./log');
var serial = require('serialport');
var fibers = require('fibers');
var args = require('commander');

var fiber ;


function die ( s )
{
  log.log(s);
  process.exit(1);
}


function sleep ( seconds )
{
  setTimeout( function(){ fiber.run(); }, 1000*seconds );
  fibers.yield();
}


var link = {};
link.port = undefined ;		//  Used port


link.listPorts = function ( )
{
  link.ports = [];

  var list ;

  serial.list( function(error,result) {
    list = result ;
    fiber.run();
  } );
  fibers.yield();

  for ( var i=0 ; i<list.length ; i++ ) {
    var p = list[i] ;
    if ( p.pnpId != undefined || p.vendorId != undefined )
      link.ports[p.comName] = p ;
  }
  return link.ports ;
};


link.defaultPort = function ( )
{
  if ( link.ports === undefined )
    link.listPorts();

  var names = Object.keys(link.ports);
  names.sort();
  return names[ names.length-1 ];
};


link.open = function ( )
{
  var name ;
  if ( link.args.port === undefined )
    name = link.defaultPort() ;
  else
    name = args.port ;

  link.rxq = "" ;
  link.wires = 0 ;
  link.options = {};
  link.options.brk = false ;
  link.options.dtr = false ;
  link.options.rts = false ;

  link.port = new serial.SerialPort( name,
				     { baudrate: args.baud },
				     function(){ fiber.run(); }
				   );
  fibers.yield();
  link.port.on('data', link.onData);
  link.port.on('disconnect', link.onDisconnect);
};


function s2hex ( s )
{
  var h = '';
  for ( var i=0 ; i<s.length ; i++ )
    h += s.charCodeAt(i).toString(16);
  return h;
}
 

link.onData = function ( buffer )
{
  // if ( buffer.length == 0 )
  //   return ;

  var s = buffer.toString('ascii')
  log.log('onData: '+s2hex(s));
  // if ( s.length == 0 )
  //   return ;
//  log.log('onData: '+s);
  link.rxq += s ;
}


link.onDisconnect = function ( )
{
  log.log("DISCONNECTED");
  process.exit();
}


link.setOptions = function ( )
{
  link.port.set( link.options, function(error,result) { fiber.run(); } );
  fibers.yield();
}


link.drain = function ( )
{
  link.port.drain( function(error,result) { fiber.run(); } );
  fibers.yield();
  link.rxq = "";
}


link.flush = function ( )
{
  link.drain();
  link.port.flush( function(error,result) { fiber.run(); } );
  fibers.yield();
  link.rxq = "" ;
}


link.tx = function ( s )
{
  if ( ! link.interCharDelay )
    link.port.write(s);
  else
    die('not supported yet.');

  if ( link.wires == 1 ) {
    link.drain();
    sleep(0.001);
    if ( ! link.rxq.startsWith(s) ) {
      log.log("Echo mismatch: "+s2hex(s)+" / "+s2hex(link.rxq));
      return -1 ;
    }
    link.rxq = link.rxq.substr(s.length);
  }
  return 0 ;
}


link.resetDevice = function ( )
{
  if ( link.args.keepTxdLow !== 0 )
    link.options.brk = true ;

  if ( link.args.resetSignal == 'DTR' )
    link.options.dtr = true ;
  else
    link.options.rts = true ;

  link.setOptions();
  sleep( link.args.resetLength );

  if ( link.args.resetSignal == 'DTR' )
    link.options.dtr = false ;
  else
    link.options.rts = false ;

  link.setOptions();

  if ( link.args.keepTxdLow !== 0 ) {
    sleep( link.args.keepTxdLow );
    link.options.brk = false ;
    link.setOptions();
  }

  // log.log("HERE");
  // sleep(0.1);
  // link.flush();
  // log.log("HERE");
}


link.detectWires = function ( )
{
  log.log("detectWires");
  link.flush();
  if ( link.wires == 0 ) {
    link.port.write('?');
    sleep(0.01);
    if ( link.rxq[0] == '?' )
      link.wires = 1 ;
    else
      link.wires = 2 ;
  }

  //log.log("HERE");
}


link.sync_5_1 = function ( )
{
  log.log("Synchonizing with 5+1 low bits (ASCII 'A'): ")
  for ( var i=1 ; i<=4 ; i++ ) {
    link.flush();
    link.tx('A');
    //link.drain();
    sleep(0.01);
    if ( link.rxq.length > 0 ) {
      log.log(" OK after "+i+" bytes sent: '"+link.rxq+"'");
      //self.lastChar = link.rxq[0];
      return ;
    }
  }
  log.log("synchronization failed");
}


function main ( )
{
  fiber = fibers.current ;

  args
    .usage('-p <port> [options]')
    .description('Communicate with sensor bus module.')
    .option('-p, --port <port>', 'Name of serial port or "list".')
    .option('-b, --baud <baudrate>', 'Baud rate default: 115200', parseInt, 115200)
    .option('-r, --reset-signal <signal>', 'RS232 signal for MCU reset [DTR|RTS].', 'DTR')
    .option('-l, --reset-length <n>', 'Reset signal length (s).', parseFloat, 0.01)
    .option('-k, --keep-txd-low <n>', 'How long TXD must be held low (s).', parseFloat, 0.5)
    .parse(process.argv);

  if ( args.resetSignal !== 'DTR' &&
       args.resetSignal !== 'RTS')
    die('Reset signal can be DTR or RTS, but not "'+link.args.resetSignal+'".');

  if ( args.port === "list" ) {
    var ports = link.listPorts();
    log.log(ports);
    return ;
  }

  log.log('Reset: '+args.resetSignal);

  //  Open the serial port
  //
  link.args = args ;
  link.open();
  log.log("Port: "+link.port.path); // path is comName in the list of ports...

  link.resetDevice();
  link.detectWires();
  log.log("Wires: "+link.wires);

  link.sync_5_1();

  process.exit();  
};


fibers( main ).run();
