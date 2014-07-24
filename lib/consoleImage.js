/*

Console image 
put an image in the chrome console

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

console.localImage = function(img, memo, scale){
    var can = document.createElement('canvas')
    can.width = img.width;
    can.height = img.height;
    var ctx = can.getContext('2d')
    ctx.drawImage(img, 0,0)
    var dat = can.toDataURL()
    console.image(dat, memo, scale)
}

console.image = function(url, memo, scale) {
    function getBox(width, height) {
        return {
            string: "+",
            style: "font-size: 1px; padding: " + Math.floor(height/2) + "px " + Math.floor(width/2) + "px; line-height: " + height + "px;"
        }
    }

    scale = scale || 1;
    var img = new Image();
    console.log(memo)

    img.onload = function() {
        var dim = getBox(this.width * scale, this.height * scale);
        console.log("%c" + dim.string, dim.style + "background: url(" + url + "); background-size: " + (this.width * scale) + "px " + (this.height * scale) + "px; color: transparent;");
    };

    img.src = url;
};