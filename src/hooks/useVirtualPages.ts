import { VirtualPages } from "@/class/VirtualPage"
import { Reactive, reactive } from "vue"

let views: Reactive<VirtualPages>

export default function useViretualPages(){
    if(views === undefined) {
        // views = reactive<VirtualPage[]>([])
        views = reactive(new VirtualPages())
    }
    return views
}