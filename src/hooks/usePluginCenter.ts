import PluginCenter from "@/class/PluginCenter";
import { alertTipType } from "@/types/type";
import { reactive } from "vue";

let pluginCenter: PluginCenter

export const initPluginCenter = (globalAlertTip: alertTipType) => {
    if(!pluginCenter) {
        pluginCenter = reactive(new PluginCenter(globalAlertTip))
    }
}

export default function usePluginCenter(){
    return pluginCenter
}