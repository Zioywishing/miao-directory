import usePluginCenter, { initPluginCenter } from "@/hooks/usePluginCenter";
import { Plugin, registerComponentOption } from "@/class/PluginCenter";
import { alertTipType, PluginExportType } from "@/types/type";

const initPlugin = async (globalAlertTip: alertTipType) => {
	initPluginCenter(globalAlertTip);
	const modulesFiles = import.meta.glob("@/plugins/**/export.ts", { eager: true });
	const pluginCenter = usePluginCenter();
	const promiseArray = [];
	for (let pluginConfig of Object.values(modulesFiles)) {
		promiseArray.push(
			new Promise(async resolve => {
				const _config = pluginConfig as {
					default: registerComponentOption | Plugin;
					type: PluginExportType;
					key?: string;
				};
				const { type, key } = _config;
				if (type === PluginExportType.component) {
					resolve(pluginCenter.registerComponent(_config.default as registerComponentOption));
				} else if (type === PluginExportType.default) {
					resolve(pluginCenter.register(key as string, _config.default as Plugin));
				}
			})
		);
	}
	await Promise.all(promiseArray);
};

export default initPlugin;
