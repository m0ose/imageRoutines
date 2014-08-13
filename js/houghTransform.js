/*

Bilateral Filter. Brute force algorithm
Cody Smith 2014

The MIT License (MIT)

Copyright (c) 2014 Redfish Group and Cody Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


import {getIntensities,getImageCanvas, copyImageData, convertToImageData} from "./imageDataRoutines"
import {sobelFilter} from "./sobelFilter"


export class HoughTransform{

  constructor( img , numCells=400){
    this.numAngleCells = Math.floor(numCells/2)*2
    this.imWid = img.width
    this.imHei = img.height
    this.rhoMax = 1*Math.sqrt(this.imWid * this.imWid + this.imHei * this.imHei);
    this.sobelTreshold = 250
    this.accum = new Uint32Array(this.numAngleCells * this.rhoMax);
    this.run(img)
  }

  run( img){
    var start = new Date().getTime()
    console.log('hough started')
    //init accumulator
    for(var i=0; i < this.accum.length; i++){
      this.accum[i] = 0
    }

    var bf = new sobelFilter() // 8 is the kernel size
    var edges = bf.run(img)

    for( var y=2; y < this.imHei-2; y++ ){
      for( var x=2; x < this.imWid-2; x++){
        var indx = 4*( y*this.imWid + x) + 2
        var val = edges.data[indx]
        if( val > this.sobelTreshold){
          this.houghAccClassical(x,y)
        }
      }
    }

    console.log('Hough transform done', new Date().getTime() - start, 'ms')
  }

  houghAccClassical(x, y) {
    for ( var thetaIndex = 0; thetaIndex < this.numAngleCells;  thetaIndex++) {
      var theta = thetaIndex*(Math.PI / this.numAngleCells)
      var rho =  Math.floor( x * Math.cos(theta) + y * Math.sin(theta))
      var indx = Math.floor(thetaIndex*this.rhoMax) + rho
      this.accum[indx]++;
    }
  }

  getInCanvas(){
    var can = document.createElement('canvas')
    can.height = this.numAngleCells
    can.width = this.rhoMax
    var ctx = can.getContext('2d')
    var imgd = ctx.getImageData(0,0, can.width, can.height)
    for(var i=0; i < this.accum.length; i++){
      imgd.data[4*i] = this.accum[i]
      imgd.data[4*i+1] = this.accum[i]
      imgd.data[4*i+2] = this.accum[i]
      imgd.data[4*i+3] = 255//this.accum[i]

    }
    ctx.putImageData(imgd,0,0)
    return ctx.canvas
  }
  
}