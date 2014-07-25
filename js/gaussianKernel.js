export class gaussianKernel{
  constructor( sigma=1, w=13, h )
  {
    this.w = w
    this.h = h || w
    console.log('making kernel',sigma, this.w,'x',this.h)

    this.kern = new Float32Array( this.w*this.h)
    this.cx = Math.floor(this.w / 2);
    this.cy = Math.floor(this.h / 2);
    this.sigma = sigma

    var sigma2Sqr = 2.0 * sigma * sigma;
 
    for( var y = 0; y < this.h; y++ ) {
        for( var x = 0; x < this.w; x++ ) {
            var rx = (x - this.cx);
            var ry = (y - this.cy);
            var d2 = rx*rx + ry*ry;
            this.kern[y*this.w + x] = this.gausVal(d2) //Math.exp( -d2 / sigma2Sqr );
        }
    }
  }

  gausVal( d ){
    return Math.exp( -d/(2*this.sigma*this.sigma)   )
  }

  whats(x,y){
    return this.kern[(y+this.cy)*this.w + x+this.cx]
  }

}
