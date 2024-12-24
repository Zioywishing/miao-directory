import { Plugin, PluginGroup } from "@/class/PluginCenter";
import { PluginExportType } from "@/types/type";
import { watch } from "vue";

const pluginConfig: Plugin = {
	name: "初始化完成之后打开miaoDirectory",
	filter: () => {
		return false;
	},
	disable: false,
	group: [PluginGroup.immediately],
	func: (_, __, hooks) => {
		const { getPluginCenter, getRootVDirectory, getViews } = hooks
		const views = getViews();
		const pc = getPluginCenter();
		const root = getRootVDirectory();
		setTimeout(() => {
			if (views.length === 0) {
				pc.usePlugin('miaoDirectory', [root])
			}
			watch(() => views.length, () => {
				if(views.length === 0) {
					pc.usePlugin('miaoDirectory', [root])
				}
			})
			
			pc.deregister('miaoDirectory_onInit')
		})
	},
	priority: -1
};

export default pluginConfig;

export const type = PluginExportType.default;

export const key = "miaoDirectory_onInit";
