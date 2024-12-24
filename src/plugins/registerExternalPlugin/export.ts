import { Plugin, PluginGroup } from "@/class/PluginCenter";
import { LogoGithub } from "@vicons/ionicons5";
import { PluginExportType } from "@/types/type";
import { shallowRef } from "vue";
import registerExternalPlugin from "./registerExternalPlugin";

const pluginConfig: Plugin = {
	name: "导入插件",
	icon: shallowRef(LogoGithub),
	filter: (vDirs, vFiles) => {
		if (vDirs.length !== 0) {
			return false;
		}
		if (vFiles.length !== 1) {
			return false;
		}
        return vFiles[0].name.endsWith('js')
	},
	disable: false,
	group: [PluginGroup.default],
	func: registerExternalPlugin,
	priority: -1
};

export default pluginConfig;

export const type = PluginExportType.default;

export const key = 'registerExternalPlugin';
