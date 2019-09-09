import { convertToImageData, copyImageData } from './imageDataRoutines.js'

export function Binarize(img, threshold = 128) {
    var start = new Date().getTime()
    var data = convertToImageData(img)
    var dataOut = copyImageData(data)

    for (var i = 0; i < data.data.length; i += 4) {
        var intens =
            0.2126 * data.data[i] +
            0.7152 * data.data[i + 1] +
            0.0722 * data.data[i + 2]
        intens = (intens > threshold) * 255
        dataOut.data[i] = dataOut.data[i + 1] = dataOut.data[i + 2] = intens
        dataOut.data[i + 3] = 255
    }
    console.log('Binarize took', new Date().getTime() - start, 'ms')
    return dataOut
}

//just exports 1 and 0 array
export function Binarize2(img, threshold = 128) {
    var start = new Date().getTime()
    var data = convertToImageData(img)
    var dataOut = [] //new Uint8Array(data.width * data.height)
    var indxout = 0
    for (var i = 0; i < data.data.length; i += 4) {
        indxout++
        var intens =
            0.2126 * data.data[i] +
            0.7152 * data.data[i + 1] +
            0.0722 * data.data[i + 2]
        intens = (intens > threshold) * 1
        dataOut[indxout] = intens
    }
    console.log('Binarize2 took', new Date().getTime() - start, 'ms')
    return dataOut
}
