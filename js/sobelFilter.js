import { sobelKernelX, sobelKernelY } from './sobelKernel.js'
import { copyImageData, convertToImageData } from './imageDataRoutines.js'

export class sobelFilter {
    constructor() {
        this.kernel = null
    }

    run(img) {
        this.kernX = new sobelKernelX()
        this.kernY = new sobelKernelY()

        var start = new Date().getTime()
        console.log('started')
        var data = convertToImageData(img)
        var dataOut = copyImageData(data)

        for (var y = 0; y < data.height; y++) {
            for (var x = 0; x < data.width; x++) {
                var i = y * data.width + x
                var rgb = [0.00000001, 0.0000001]

                for (var y2 = -this.kernX.cy; y2 <= this.kernX.cy; y2++) {
                    for (var x2 = -this.kernX.cx; x2 <= this.kernX.cx; x2++) {
                        if (
                            y + y2 >= 0 &&
                            x + x2 >= 0 &&
                            y + y2 < data.height &&
                            x + x2 < data.width
                        ) {
                            var i2 = (y + y2) * data.width + (x + x2)
                            rgb[0] +=
                                this.kernX.whats(x2, y2) * data.data[4 * i2]
                            rgb[1] +=
                                this.kernY.whats(x2, y2) * data.data[4 * i2 + 1]
                        }
                    }
                }

                var i4 = 4 * i
                dataOut.data[i4] = rgb[0] + 127
                dataOut.data[i4 + 1] = rgb[1] + 127
                dataOut.data[i4 + 2] = Math.sqrt(
                    Math.pow(rgb[0], 2) + Math.pow(rgb[1], 2)
                )
            }
        }

        console.log('Sobel Filter done', new Date().getTime() - start, 'ms')
        return dataOut
    }
}
