import VirtualDirectory from "./virtualDirectory";
import generateId from "@/hooks/generateId";

const getRandomWebSafeColor = (() => {
	const webSafeColors = ["#009900", "#999900", "#009999", "#990099", "#0000ee"];
	let counter = 0
	return () => {
		const color = webSafeColors[counter % webSafeColors.length]
		counter += 1
		return color;
	};
})();

export default class VirtualPage {
	constructor(initDirectory: VirtualDirectory) {
		this.visible = true;
		this.uid = generateId();
		this.currentDirectory = initDirectory;
		this.refreshKey = Math.random();
		this.color = getRandomWebSafeColor();
	}
	visible: boolean;
	currentDirectory: VirtualDirectory;
	// 区分每一个页面的唯一id
	uid: number;
	// 当refreshKey改变时需要刷新页面，目前还没接入刷新
	refreshKey: number;

	color: string;

	get title() {
		return this.currentDirectory.name;
	}

	// 切换显示状态
	switchShow() {
		this.visible = !this.visible;
	}

	// 设置（同步）正在展示的文件夹
	setCurrrentDirectory(currDir: VirtualDirectory) {
		this.currentDirectory = currDir;
	}

	refresh() {
		this.refreshKey = Math.random();
	}
}
