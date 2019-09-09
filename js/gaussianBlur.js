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

import { copyImageData, convertToImageData } from './imageDataRoutines.js'
import { gaussianKernel } from './gaussianKernel.js'

//
// peice wise gaussian blur
//   this is like 3x as fast as the other method
//
export class gaussianBlur {
    constructor(kernelsize = 6) {
        this.sigma = kernelsize / 2
        this.kernelsize = kernelsize
        this.kernel = null
    }

    run(img) {
        this.kernel = new gaussianKernel(this.sigma, this.kernelsize, 1)
        console.log(this.kernel)
        var start = new Date().getTime()
        console.log('started')
        //var tmp = getImageData(img)
        var data = convertToImageData(img)
        var dataOut = copyImageData(data)

        var i, normFactor, rgb, i2, i4, weight, i5
        // blur in x direction
        //
        for (var y = 0; y < data.height; y++) {
            for (var x = 0; x < data.width; x++) {
                i = y * data.width + x
                normFactor = 0
                rgb = [0.00000001, 0.0000001, 0.000000001]

                for (var x2 = -this.kernel.cx + 1; x2 < this.kernel.cx; x2++) {
                    if (x + x2 > 0 && x + x2 < data.width) {
                        i2 = y * data.width + (x + x2)
                        weight = this.kernel.whats(x2, 0)
                        normFactor += weight
                        rgb[0] += weight * data.data[4 * i2]
                        rgb[1] += weight * data.data[4 * i2 + 1]
                        rgb[2] += weight * data.data[4 * i2 + 2]
                    }
                }

                normFactor = Math.max(0.00001, Math.abs(normFactor))
                i4 = 4 * i

                dataOut.data[i4] = rgb[0] / normFactor
                dataOut.data[i4 + 1] = rgb[1] / normFactor
                dataOut.data[i4 + 2] = rgb[2] / normFactor
                //dataOut.data[i4]= dataOut.data[i4+1] = dataOut.data[i4+2] = wout
            }
        }

        /// blur in y direction
        //
        for (y = 0; y < data.height; y++) {
            for (x = 0; x < data.width; x++) {
                i = y * data.width + x
                normFactor = 0
                rgb = [0.00000001, 0.0000001, 0.000000001]

                for (var y2 = -this.kernel.cx + 1; y2 < this.kernel.cx; y2++) {
                    if (y + y2 > 0 && y + y2 < data.height) {
                        i5 = (y + y2) * data.width + x
                        weight = this.kernel.whats(y2, 0)
                        normFactor += weight
                        rgb[0] += weight * dataOut.data[4 * i5]
                        rgb[1] += weight * dataOut.data[4 * i5 + 1]
                        rgb[2] += weight * dataOut.data[4 * i5 + 2]
                    }
                }

                normFactor = Math.max(0.00001, Math.abs(normFactor))
                var i6 = 4 * i

                dataOut.data[i6] = rgb[0] / normFactor
                dataOut.data[i6 + 1] = rgb[1] / normFactor
                dataOut.data[i6 + 2] = rgb[2] / normFactor
                //dataOut.data[i4]= dataOut.data[i4+1] = dataOut.data[i4+2] = wout
            }
        }

        console.log('gaussian blur done', new Date().getTime() - start, 'ms')
        return dataOut
    }
}

//
// This version is too slow
//
/* 
export class gaussianBlur{

  constructor( kernelsize=6 ){
    this.sigma=kernelsize/4
    this.kernelsize = kernelsize
    this.kernel = new gaussianKernel(this.sigma, this.kernelsize)
  }

  run(img){
    this.kernel = new gaussianKernel(this.sigma, this.kernelsize)
    var start = new Date().getTime()
    console.log('started')
    //var tmp = getImageData(img)
    var data = convertToImageData( img)
    var dataOut = copyImageData(data)

    for( var y=0; y<data.height  ; y++){
      for( var x=0; x<data.width ; x++){
        var i = y*data.width + x
        var normFactor = 0
        var rgb = [0.00000001,0.0000001,0.000000001]

        for( var y2=-this.kernel.cy+1; y2<this.kernel.cy ; y2++){
          for( var x2=-this.kernel.cx+1; x2<this.kernel.cx ; x2++){
            if( y+y2>0 && x+x2>0 && y+y2 < data.height && x+x2 < data.width){
              var i2 = (y+y2)*data.width + (x+x2)
              var weight = this.kernel.whats( x2,y2) 
              normFactor += weight
              rgb[0] += weight * data.data[4*i2]
              rgb[1] += weight * data.data[4*i2+1]
              rgb[2] += weight * data.data[4*i2+2]
            }
          }
        }

        normFactor = Math.max(0.00001, Math.abs(normFactor))
        var i4 = 4*i

        dataOut.data[i4] = rgb[0]/normFactor
        dataOut.data[i4+1] = rgb[1]/normFactor
        dataOut.data[i4+2] = rgb[2]/normFactor

        //dataOut.data[i4]= dataOut.data[i4+1] = dataOut.data[i4+2] = wout
      }
    }

    console.log('gaussian blur done', new Date().getTime() - start, 'ms')
    return dataOut
  }
}
*/
