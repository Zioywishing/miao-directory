import usePluginCenter, { initPluginCenter } from "@/hooks/usePluginCenter";
import { Plugin, registerComponentOption } from "@/class/PluginCenter";
import { alertTipType, PluginExportType } from "@/types/type";

const initPlugin = async (globalAlertTip: alertTipType) => {
	initPluginCenter(globalAlertTip)
	const modulesFiles = import.meta.glob("@/plugins/**/export.ts");
	const pluginCenter = usePluginCenter();
	const promiseArray = [];
	for (let pluginConfig of Object.values(modulesFiles)) {
		promiseArray.push(
			new Promise(async resolve => {
				const _config = pluginConfig as () => Promise<{
					default: registerComponentOption | Plugin;
					type: PluginExportType
					key?: string
				}>;
				const {type, key} = await _config()
				if(type === PluginExportType.component) {
					// @ts-ignore
					resolve(pluginCenter.registerComponent((await _config()).default));
				} else if (type === PluginExportType.default) {
					// @ts-ignore
					resolve(pluginCenter.register(key as string, (await _config()).default));
				}
			})
		);
	}
	await Promise.all(promiseArray);
};

export default initPlugin;
