import usePluginCenter, { initPluginCenter } from "@/hooks/usePluginCenter";
import { registerComponentOption } from "@/class/PluginCenter";
import { alertTipType } from "@/types/type";

const initPlugin = async (globalAlertTip: alertTipType) => {
	initPluginCenter(globalAlertTip)
	const modulesFiles = import.meta.glob("@/plugins/**/export.ts");
	const pluginCenter = usePluginCenter();
	const promiseArray = [];
	for (let pluginConfig of Object.values(modulesFiles)) {
		promiseArray.push(
			new Promise(async resolve => {
				const _config = pluginConfig as () => Promise<{
					default: registerComponentOption;
				}>;
				resolve(pluginCenter.registerComponent((await _config()).default));
			})
		);
	}
	await Promise.all(promiseArray);
};

export default initPlugin;
