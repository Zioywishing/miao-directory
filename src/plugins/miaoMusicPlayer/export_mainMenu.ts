import { Plugin, PluginGroup } from "@/class/PluginCenter";
import { PluginExportType } from "@/types/type";
import { shallowRef } from "vue";
import Disc from "@vicons/ionicons5/es/Disc";

const pluginConfig: Plugin = {
	name: "音乐",
	icon: shallowRef(Disc),
	filter: (_, __, views) => {
		return views.find("miaoMusicPlayer").length === 0;
	},
	disable: false,
	group: [PluginGroup.mainMenu],
	func(_, __, hooks) {
		const { getPluginCenter } = hooks;
		const PluginCenter = getPluginCenter();
		PluginCenter.usePlugin("miaoMusicPlayer", [], []);
	},
	priority: -1
};

export default pluginConfig;

export const type = PluginExportType.default;

export const key = "musicPlayer-mainMenu";
