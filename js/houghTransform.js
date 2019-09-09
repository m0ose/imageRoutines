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

// import {getIntensities,getImageCanvas, copyImageData, convertToImageData} from "./imageDataRoutines"
import { sobelFilter } from './sobelFilter.js'
import '../lib/connected-component-labeling.js'
//import {BlobExtraction} from "../lib/connected-component-labeling"

export class HoughTransform {
    constructor(img, numCells = 400, blobThreshold = 90) {
        //
        //
        this.numAngleCells = Math.floor(numCells / 2) * 2
        this.imWid = img.width
        this.imHei = img.height
        this.rhoMax =
            1 * Math.sqrt(this.imWid * this.imWid + this.imHei * this.imHei)
        this.sobelTreshold = 250
        this.accumulator = new Uint32Array(this.numAngleCells * this.rhoMax)
        this.accWid = this.numAngleCells
        this.accHei = this.rhoMax
        this.labels = null
        this.blobs = null
        this.blobThreshold = blobThreshold
        //
        // Run the algorithm now
        //
        this.runHough(img)
        this.findBlobs()
    }

    //
    // Basically the main function
    //
    runHough(img) {
        var start = new Date().getTime()
        console.log('hough started')
        //init accumulator
        for (var i = 0; i < this.accumulator.length; i++) {
            this.accumulator[i] = 0
        }

        var bf = new sobelFilter() // 8 is the kernel size
        var edges = bf.run(img)

        for (var y = 2; y < this.imHei - 2; y++) {
            //ignore edges.
            for (var x = 2; x < this.imWid - 2; x++) {
                var indx = 4 * (y * this.imWid + x)
                var r = edges.data[indx + 0] - 127 //just x edge
                var g = edges.data[indx + 1] - 127 //just y edge
                var angle = Math.atan2(g, r)
                var b = edges.data[indx + 2] // blue channel holds both x and y
                if (b > this.sobelTreshold) {
                    this.houghAccClassical2(x, y, angle, 0.4)
                }
            }
        }

        console.log('Hough transform done', new Date().getTime() - start, 'ms')
    }

    //
    // hough transform function. Translates edges in the image into sinusoids in the accumulator
    //
    houghAccClassical(x, y) {
        for (
            var thetaIndex = 0;
            thetaIndex < this.numAngleCells;
            thetaIndex++
        ) {
            var theta = thetaIndex * ((2 * Math.PI) / this.numAngleCells)
            var rho = Math.floor(x * Math.cos(theta) + y * Math.sin(theta))
            var indx = Math.floor(rho * this.numAngleCells) + thetaIndex
            this.accumulator[indx]++
        }
    }

    houghAccClassical2(x, y, angle = Math.PI, range = Math.PI) {
        var twopi = 2 * Math.PI
        angle = (angle + twopi) % twopi
        var start = (this.numAngleCells / twopi) * Math.max(0, angle - range)
        var end = (this.numAngleCells / twopi) * Math.min(twopi, angle + range)
        start = Math.floor(start)
        end = Math.floor(end)
        for (var thetaIndex = start; thetaIndex < end; thetaIndex++) {
            var theta = thetaIndex * (twopi / this.numAngleCells)
            var rho = Math.floor(x * Math.cos(theta) + y * Math.sin(theta))
            var indx = Math.floor(rho * this.numAngleCells) + thetaIndex
            this.accumulator[indx]++
        }
    }

    //
    // Find the blobs that represent lines in the accumulator
    //  Threshold. Lower result in more blobs generally
    //
    findBlobs() {
        var bina = this.binarizeAccumulator(this.blobThreshold)
        this.labels = BlobExtraction(bina, this.accWid, this.accHei)
        this.blobs = BlobBounds(this.labels, this.accWid, this.accHei)
        console.log(this.blobs)
    }

    //
    // Turn accumulator into something the blob detector can deal with
    //  Threshold. Lower result in more blobs generally
    //
    binarizeAccumulator(threshold = 70) {
        var result = [] //new Uint8Array( this.accumulator.length)
        for (var i = 0; i < this.accumulator.length; i++) {
            result[i] = (this.accumulator[i] > threshold) * 1
        }
        return result
    }

    //
    // Drawing routines
    //    These are public functions
    //___________________________________________________________

    //
    // Show accumulator as a canvas
    //
    getAccumulatorInCanvas() {
        var can = document.createElement('canvas')
        can.height = this.rhoMax
        can.width = this.numAngleCells
        var ctx = can.getContext('2d')
        var imgd = ctx.getImageData(0, 0, can.width, can.height)
        for (var i = 0; i < this.accumulator.length; i++) {
            imgd.data[4 * i] = this.accumulator[i]
            imgd.data[4 * i + 1] = this.accumulator[i]
            imgd.data[4 * i + 2] = this.accumulator[i]
            imgd.data[4 * i + 3] = 255 //this.accumulator[i]
        }
        ctx.putImageData(imgd, 0, 0)
        return { canvas: ctx.canvas, imagedata: imgd }
    }

    //
    // Draw a single line onto the context2d
    //
    drawLine(context2d, rho, theta) {
        var ctx = context2d
        var w = ctx.canvas.width
        var h = ctx.canvas.height
        ctx.beginPath()
        function yAt(r, t, x) {
            var y = -(Math.cos(t) / Math.sin(t)) * x + r / Math.sin(t)
            return y
        }
        function xAt(r, t, y) {
            var x = -Math.tan(t) * (y - r / Math.sin(t))
            return x
        }
        //get point 1
        var p1 = [xAt(rho, theta, 0), 0]
        if (p1[0] < 0) {
            p1 = [0, yAt(rho, theta, 0)]
        }
        //get point2
        var p2 = [xAt(rho, theta, h), h]
        if (p2[0] > w) {
            p2 = [w, yAt(rho, theta, w)]
        }

        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.stroke()
        ctx.closePath()
        return { p1: p1, p2: p2 }
    }
} //end HoughTransform
