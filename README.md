Common image routines for javascript

They are written in ecmascript 6 and use the traceur compiler.



Api:
========
Bilateral Filter:
![Alt text](/imgs/bilateralExample.png?raw=true "Optional Title")
```javascript
  import {bilateralFilter, gaussianKernel} from "../js/bilateralFilter"

  var img = new Image()
  var bf = new bilateralFilter()
  bf.sigma = 4
  bf.kernelsize = 4*bf.sigma //95% of the data should fit into 4 sigma

  img.onload = function(){

  var cda = bf.run(img)
  var can = document.getElementById('can')
  can.width = img.width
  can.height = img.height
  var ctx = can.getContext('2d')
  ctx.putImageData(cda,0,0)

  }
  img.src="../imgs/turkey.png"
  document.getElementById('pic').appendChild(img)

```
