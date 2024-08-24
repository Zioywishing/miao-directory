import MiaoDirectory from "@/views/miaoDirectory.vue";
import usePluginCenter from "./usePluginCenter";
import MiaoVideoPlayer from "@/views/miaoVideoPlayer.vue";

export default function init() {
	const pluginCenter = usePluginCenter();
	pluginCenter.registerComponent("miaoDirectory", "文件夹", MiaoDirectory, (vDirs, vFiles) => {
		if (vFiles.length) {
			return false;
		}
		return vDirs.length === 1;
	});
	pluginCenter.registerComponent("miaoVideoPlayer", "视频", MiaoVideoPlayer, (vDirs, vFiles) => {
		if (vDirs.length !== 0) {
			return false;
		}
		if (vFiles.length === 0) {
			return false;
		}
		return vFiles.length === 1 && vFiles[0].name.endsWith("mp4");
	});
}
