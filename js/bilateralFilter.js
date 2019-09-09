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

export class bilateralFilter {
    constructor() {
        this.sigma = 4
        this.kernelsize = 16
        this.kernel = new gaussianKernel(this.sigma, this.kernelsize)
    }

    run(img) {
        this.kernel = new gaussianKernel(this.sigma, this.kernelsize)
        var start = new Date().getTime()
        console.log('started')
        var data = convertToImageData(img)
        var dataOut = copyImageData(data)
        var intens = getIntensities(data)

        for (var y = 0; y < data.height; y++) {
            for (var x = 0; x < data.width; x++) {
                var i = y * data.width + x
                var w1 = intens[i]
                var normFactor = 0
                var wout = 0
                var rgb = [0.00000001, 0.0000001, 0.000000001]

                for (var y2 = -this.kernel.cy + 1; y2 < this.kernel.cy; y2++) {
                    for (
                        var x2 = -this.kernel.cx + 1;
                        x2 < this.kernel.cx;
                        x2++
                    ) {
                        if (
                            y + y2 > 0 &&
                            x + x2 > 0 &&
                            y + y2 < data.height &&
                            x + x2 < data.width
                        ) {
                            var i2 = (y + y2) * data.width + (x + x2)
                            var w2 = intens[i2]
                            var distI = Math.sqrt(Math.pow(w1 - w2, 2))
                            var dw = this.kernel.gausVal(distI)
                            var weight = this.kernel.whats(x2, y2) * dw
                            normFactor += weight
                            wout += weight * w2
                            rgb[0] += weight * data.data[4 * i2]
                            rgb[1] += weight * data.data[4 * i2 + 1]
                            rgb[2] += weight * data.data[4 * i2 + 2]
                        }
                    }
                }

                normFactor = Math.max(0.00001, Math.abs(normFactor))
                wout = wout / normFactor
                var woutF = wout / 180
                var i4 = 4 * i

                dataOut.data[i4] = rgb[0] / normFactor
                dataOut.data[i4 + 1] = rgb[1] / normFactor
                dataOut.data[i4 + 2] = rgb[2] / normFactor

                //dataOut.data[i4]= dataOut.data[i4+1] = dataOut.data[i4+2] = wout
            }
        }

        console.log(
            'bilateral filter done',
            new Date().getTime() - start,
            ' ms'
        )
        return dataOut
    }
}
