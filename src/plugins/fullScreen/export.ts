import { Plugin, PluginGroup } from "@/class/PluginCenter";
import fullScreen from "./fullScreen";
import { ExpandOutline } from "@vicons/ionicons5";
import { PluginExportType } from "@/types/type";
import { shallowRef } from "vue";

const pluginConfig: Plugin = {
	name: "全屏",
	icon: shallowRef(ExpandOutline),
	filter: () => {
		return true;
	},
	disable: false,
	group: [PluginGroup.mainMenu],
	func: fullScreen,
	priority: -1
};

export default pluginConfig;

export const type = PluginExportType.default;

export const key = "fullScreen";
