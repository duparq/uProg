
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


/*  Create a SVG element containing a n pins DIL package
 */
function svgDilPackage ( n )
{
  App.log("svgDilPackage("+n+")");

  var xmlns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(xmlns,'svg');
  svg.setAttribute('class', 'device');

  if ( n == 0 )
    return svg ;

  //  Package dimensions
  //
  var E0 = 100;					// Distance between pins
  var B2 = 60 ;					// Pin width
  var E1 = n <= 28 ? 3*E0-B2/6 : 6*E0-B2/6 ;	// Package width
  var D = E0*(n/2-1)+2*B2 ;			// Package height
  var SW = E0/100 ;				// Stroke width

  //  SVG element
  //
  var viewBox = {
    left:   -B2/2,
    top:    -SW,
    width:  E1+B2,
    height: D+2*SW,
  };

  svg.setAttribute("viewBox", ""
		     + viewBox.left + " " + viewBox.top + " "
		     + viewBox.width + " " + viewBox.height );

  //  Package background
  //
  var e = document.createElementNS(xmlns,'rect');
  e.setAttribute('class', 'package');
  e.setAttribute('stroke-width', SW);
  e.setAttribute('x', 0);
  e.setAttribute('y', 0);
  e.setAttribute('width',  E1);
  e.setAttribute('height', D);
  e.setAttribute('rx', E0/4);
  e.setAttribute('ry', E0/4);
  svg.appendChild(e);

  e = document.createElementNS(xmlns,'circle');
  e.setAttribute('class', 'notch');
  e.setAttribute('cx', B2/3);
  e.setAttribute('cy', B2/3);
  e.setAttribute('r', B2/6);
  svg.appendChild(e);

  //  Device name
  //
  e = document.createElementNS(xmlns,'text');
  e.setAttribute('class', 'name');
  e.setAttribute('x', E1/2);
  e.setAttribute('y', D/2);
  e.setAttribute('text-anchor', 'middle');
  e.setAttribute('dominant-baseline', 'central');
  e.setAttribute('transform', 'rotate(90 '+E1/2+' '+D/2+')');
  svg.appendChild(e);
  

  //  Pins
  //
  for ( var i=0 ; i<n ; i++ ) {
    var g = document.createElementNS(xmlns,'g');
    g.setAttribute('class', 'pin');
    {
      // Pin area
      //
      e = document.createElementNS(xmlns,'rect');
      e.setAttribute('class', 'area');
      e.setAttribute('width',  2*B2);
      e.setAttribute('height', 8*B2/6);
      if ( i < n/2 ) {
      	e.setAttribute('x', -B2/2);
	e.setAttribute('y', B2/2+E0*i-B2/6);
      }
      else {
      	e.setAttribute('x', E1-3*B2/2);
	e.setAttribute('y', B2/2+E0*(n-i-1)-B2/6);
      }
      g.appendChild(e);

      // Pin pad
      //
      e = document.createElementNS(xmlns,'rect');
      e.setAttribute('class', 'pad');
      e.setAttribute('width',  B2/3);
      e.setAttribute('height', B2);
      if ( i < n/2 ) {
	e.setAttribute('x', -B2/3);
	e.setAttribute('y', B2/2+E0*i);
      }
      else {
	e.setAttribute('x', E1);
	e.setAttribute('y', B2/2+E0*(n-i-1));
      }
      g.appendChild(e);

      // Pin name
      //
      e = document.createElementNS(xmlns,'text');
      e.setAttribute('class', 'name');
      e.setAttribute('dominant-baseline', 'central');
      if ( i < n/2 ) {
	e.setAttribute('text-anchor', 'start');
	e.setAttribute('x', B2/6);
	e.setAttribute('y', B2+E0*i);
      }
      else {
	e.setAttribute('text-anchor', 'end');
	e.setAttribute('x', E1-B2/6);
	e.setAttribute('y', B2+E0*(n-1-i));
      }
      e.textContent=""+(i+1);
      g.appendChild(e);
    }
    svg.appendChild(g);
  }
  return svg ;
}
