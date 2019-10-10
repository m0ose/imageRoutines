export class BoxBlurKernel {
    constructor(w = 3) {
        const size = w * w
        this.w = w
        this.kern = new Float32Array(size)
        for (var i = 0; i < size; i++) {
            this.kern[i] = 1 / size
        }
        this.cx = Math.floor(w / 2)
        this.cy = Math.floor(w / 2)
    }

    whats(x, y) {
        return this.kern[(y + this.cy) * this.w + x + this.cx]
    }
}
