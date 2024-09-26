import { Plugin, PluginGroup } from "@/class/PluginCenter";
import Copy from "./copy";
import { CopyOutline } from "@vicons/ionicons5";
import { PluginExportType } from "@/types/type";
import { shallowRef } from "vue";

const pluginConfig: Plugin = {
	name: "复制链接",
	icon: shallowRef(CopyOutline),
	filter: (vDirs, vFiles) => {
		if (vDirs.length !== 0) {
			return false;
		}
		if (vFiles.length !== 1) {
			return false;
		}
		return true;
	},
	disable: false,
	group: [PluginGroup.default],
	func: Copy
};

export default pluginConfig;

export const type = PluginExportType.default;
