//   Based On
//   "Constant Time O(1) Bilateral Filtering". Porikli,Fatih. 2008
//     "http://www.merl.com/publications/docs/TR2008-030.pdf"
//
//   Note this is not nearly as fast as i hoped, nor as accurate.
//
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

import {
    getIntensities,
    getImageCanvas,
    copyImageData,
    convertToImageData,
} from './imageDataRoutines.js'
import { gaussianKernel } from './gaussianKernel.js'

export class integralHistogram {
    constructor(img, bins = 16) {
        this.kernel = new gaussianKernel(this.sigma, this.kernelsize)
        this.binCount = bins
        this.bins = new Array(bins)
        this.binwidth = 0
        var start = new Date().getTime()
        console.log('started integral histogram')
        var data = convertToImageData(img)
        this.intens = getIntensities(data) //convert to greyscale intensity values

        this.bins = new Uint32Array(bins * this.intens.length)

        this.width = data.width
        this.height = data.height

        this.binwidth = 255 / this.binCount

        //
        // This code is cleaner and just as fast as the other seperated one
        //
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var indx = y * this.width + x
                var meI = this.intens[indx]
                var mybin = Math.round(meI / this.binwidth)
                for (var j = 0; j < this.binCount; j++) {
                    var left = this.whatsAt(x - 1, y, j)
                    var up = this.whatsAt(x, y - 1, j)
                    var ul = this.whatsAt(x - 1, y - 1, j)
                    var indxb = indx * this.binCount + j
                    //var me = 1* ( meI > j*binwidth && meI < (j+1)*binwidth )
                    this.bins[indxb] = left + up - ul
                }
                this.bins[indx * this.binCount + mybin] += 1
            }
        }

        //
        //  I thought this would speed it up but it didn't at all
        //
        /*    for( var y=0; y<this.height; y++){
      for( var x=1; x<this.width; x++){
        var indx = y*this.width + x
        var meI = this.intens[indx]
        var mybin = Math.round( meI/this.binwidth) 
        this.bins[indx*this.binCount + mybin]+=1
        for( var j=0; j<this.binCount;j++){
          var indxb = indx * this.binCount + j
          var indxL = (indx-1) * this.binCount + j
          this.bins[indxb] += this.bins[indxL]
        }
      }
    }

     for( var y=1; y<this.height; y++){
      for( var x=0; x<this.width; x++){
        var indx = y*this.width + x
        var indxUtmp = (y-1)*(this.width) + x
        for( var j=0; j<this.binCount;j++){
          var indxb = indx * this.binCount + j
          var indxU = (indxUtmp) * this.binCount + j
          this.bins[indxb] += this.bins[indxU]
        }
      }
    }
    */
        //
        // end failed speed up attempt
        //

        console.log('integral histogram done in ', new Date().getTime() - start)
    }

    whatsAt(x, y, bin) {
        if (x < 0 || y < 0) {
            return 0
        }
        var x2 = Math.min(this.width - 1, x)
        var y2 = Math.min(this.height - 1, y)
        //var b2 =  Math.max( 0, Math.min(bin, this.bins.length-1))
        var indx = y2 * this.width + x2
        return this.bins[indx * this.binCount + bin]
    }

    getblock(x, y, x2, y2, bin) {
        var lr = this.whatsAt(x2, y2, bin)
        var ul = this.whatsAt(x, y, bin)
        var ll = this.whatsAt(x, y2, bin)
        var ur = this.whatsAt(x2, y, bin)
        var result = lr - ur - ll + ul
        return result
    }
}

export class bilateralFilterFast {
    constructor(bins = 32) {
        this.bins = bins
        this.kernelsize = 32
        this.kernel = null //new gaussianKernel(this.sigma, this.kernelsize)
        this.hist = null
        this.sigma = 4
    }

    run(img) {
        var start = new Date().getTime()
        console.log('started bilateral filter')
        this.kernel = new gaussianKernel(this.sigma, 2 * this.bins, 1)
        var data = convertToImageData(img)
        var dataOut = copyImageData(data)
        this.hist = new integralHistogram(data, this.bins)

        var wid = data.width
        var hei = data.height
        for (var y = 0; y < hei; y++) {
            for (var x = 0; x < wid; x++) {
                var indx = y * wid + x
                var myIntens = this.hist.intens[indx]
                var mybin = Math.round(myIntens / (this.hist.binwidth + 0.5))
                var kappa = 0
                var result = 0
                for (var j = 0; j < this.bins; j++) {
                    var diff = j - mybin
                    var gauW = this.kernel.whats(diff, 0)
                    var histVal = this.hist.getblock(
                        x - this.kernelsize,
                        y - this.kernelsize,
                        x + this.kernelsize,
                        y + this.kernelsize,
                        j
                    )
                    kappa += histVal * gauW
                    var colorval = j / this.bins
                    result += histVal * gauW * colorval
                }
                result = result / kappa
                var indx4 = indx * 4
                dataOut.data[indx4] = result * 256 //* data.data[indx4]
                dataOut.data[indx4 + 1] = result * 256 //* data.data[indx4+1]
                dataOut.data[indx4 + 2] = result * 256 //* data.data[indx4+2]
            }
        }
        console.log('bilateral filter done in ', new Date().getTime() - start)
        return dataOut
    }
}
