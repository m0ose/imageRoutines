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
  export function getIntensities( imgdata){
    var result = new Float32Array( imgdata.width * imgdata.height)
    for( var i=0; i < result.length; i++){
      var indx = i*4
      // 0.2126 * R + 0.7152 * G + 0.0722 * B 
      result[i] = 0.2126 * imgdata.data[indx] + 0.7152 *imgdata.data[indx+1] + 0.0722 * imgdata.data[indx+2]
    }
    return result
  }

  export function getImageCanvas(img){
     var can = document.createElement('canvas');
      can.width = img.width;
      can.height = img.height;
      var ctx = can.getContext('2d');
      ctx.drawImage(img,0,0);
      return ctx
  }

  export function getImageData(img) {
      if( img.data && img.data instanceof Uint8ClampedArray){
        return copyImageData(img)
      }
      var ctx = getImageCanvas(img)
      var imgData = ctx.getImageData(0,0, ctx.canvas.width, ctx.canvas.height);
      return imgData;
  }

  export function imageData2Canvas( imgd){
    var can = document.createElement('canvas')
    can.width = imgd.width
    can.height = imgd.height
    var ctx = can.getContext('2d')
    ctx.putImageData(imgd,0,0)
    return can
  }

  export function copyImageData(){
    function ImageData() {
    var i = 0;
    if(arguments[0] instanceof Uint8ClampedArray) {
        var data = arguments[i++];
    }
    var width = arguments[i++];
    var height = arguments[i];      

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    if(data) imageData.data.set(data);
    return imageData;
}

  }