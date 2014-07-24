
import {getImageData} from "./imageDataRoutines"



export function RGB2BW(img){
    var data = getImageData( img)
    var dataOut = getImageData(img)
    
     for( var i=0; i < data.data.length; i+=4){
      dataOut.data[i] = dataOut.data[i+1] = dataOut.data[i+2] = 0.2126 * data.data[i] + 0.7152 *data.data[i+1] + 0.0722 * data.data[i+2]
    }
    return dataOut
}