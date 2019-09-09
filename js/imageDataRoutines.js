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

var _Canvas = undefined
function createCanvas(w, h) {
    if (typeof document !== 'undefined') {
        // nodejs
        let can = document.createElement('canvas')
        can.width = w
        can.height = h
        return can
    } else {
        if (typeof Canvas == 'undefined') {
            _Canvas = require('canvas')
        }
        return new _Canvas.Canvas(w, h)
    }
}

export function getIntensities(imgdata) {
    var result = new Float32Array(imgdata.width * imgdata.height)
    for (var i = 0; i < result.length; i++) {
        var indx = i * 4
        // 0.2126 * R + 0.7152 * G + 0.0722 * B
        result[i] =
            0.2126 * imgdata.data[indx] +
            0.7152 * imgdata.data[indx + 1] +
            0.0722 * imgdata.data[indx + 2]
    }
    return result
}

export function getImageCanvas(img) {
    var can = createCanvas(img.width, img.height)
    var ctx = can.getContext('2d')
    ctx.drawImage(img, 0, 0)
    return ctx
}

export function convertToImageData(img) {
    if (ArrayBuffer.isView(img)) {
        // it is already some kind of typed array
        return img
    } else if (img.data && img.data instanceof Uint8ClampedArray) {
        // its an image data
        return img
    } else if (img.src) {
        // its an image
        return getImageData(img)
    } else {
        // assume its a canvas
        var ctx = img.getContext('2d')
        var imgData = ctx.getImageData(0, 0, img.width, img.height)
        return imgData
    }
}

export function getImageData(img) {
    if (img.data && img.data instanceof Uint8ClampedArray) {
        return copyImageData(img)
    }
    var ctx = getImageCanvas(img)
    var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
    return imgData
}

export function imageData2Canvas(imgd) {
    var can = createCanvas(imgd.width, imgd.height)
    var ctx = can.getContext('2d')
    ctx.putImageData(imgd, 0, 0)
    return can
}

export function copyImageData(data) {
    var canvas = createCanvas(data.width, data.height)
    var ctx = canvas.getContext('2d')
    ctx.putImageData(data, 0, 0)
    var imageData = ctx.getImageData(0, 0, data.width, data.height)
    return imageData
}

export function createImageData(w, h) {
    var can = createCanvas(w, h)
    return convertToImageData(can)
}
