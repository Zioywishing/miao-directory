import UploadQueue from "@/class/UploadQueue";
import { reactive } from "vue";

let uploadQueue: UploadQueue

export default () => {
    if(uploadQueue === undefined){
        uploadQueue = reactive(new UploadQueue())
    }
    return uploadQueue
}