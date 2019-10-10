export class sobelKernelX {
    constructor() {
        this.w = 3
        this.h = 3

        this.kern = new Float32Array([-1, 0, 1, -2, 0, 2, -1, 0, 1])
        this.cx = 1
        this.cy = 1
    }

    whats(x, y) {
        return this.kern[(y + this.cy) * this.w + x + this.cx]
    }
}

export class sobelKernelY extends sobelKernelX {
    constructor() {
        super()
        this.kern = new Float32Array([-1, -2, -1, 0, 0, 0, 1, 2, 1])
    }
}
