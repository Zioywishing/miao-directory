import VirtualPage from "@/class/VirtualPage"
import { Reactive, reactive } from "vue"

let views: Reactive<VirtualPage[]>

export default function useViretualPages(){
    if(views === undefined) {
        views = reactive<VirtualPage[]>([])
    }
    return views
}