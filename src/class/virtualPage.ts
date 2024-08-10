import VirtualDirectory from "./virtualDirectory";
import generateId from "@/hooks/generateId";

export default class VirtualPage {
	constructor(initDirectory: VirtualDirectory) {
		this.visible = true;
		this.uid = generateId()
		this.currentDirectory = initDirectory
		this.refreshKey = Math.random()
	}
	visible: boolean;
	currentDirectory: VirtualDirectory;
	// 区分每一个页面的唯一id
	uid: number;
	// 当refreshKey改变时需要刷新页面，目前还没接入刷新
	refreshKey:number;

	get title(){
		return this.currentDirectory.name
	}

	// 切换显示状态
	switchShow() {
		this.visible = !this.visible;
	}
	
	// 设置（同步）正在展示的文件夹
	setCurrrentDirectory(currDir: VirtualDirectory) {
		this.currentDirectory = currDir
	}

	refresh(){
		this.refreshKey = Math.random()
	}

}
