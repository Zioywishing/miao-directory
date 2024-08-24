import PluginCenter from "@/class/PluginCenter";
import { reactive } from "vue";

let pluginCenter: PluginCenter

export default function usePluginCenter(){
    if(!pluginCenter) {
        pluginCenter = reactive(new PluginCenter())
    }
    return pluginCenter
}