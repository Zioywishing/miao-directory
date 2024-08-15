import { shallowRef } from "vue";
import VirtualDirectory, { VirtualFile } from "./VirtualDirectory";
import generateId from "@/hooks/generateId";

const getRandomWebSafeColor = (() => {
	const webSafeColors = ["#009900", "#999900", "#009999", "#990099", "#0000ee"];
	let counter = 0;
	return () => {
		const color = webSafeColors[counter % webSafeColors.length];
		counter += 1;
		return color;
	};
})();

export default class VirtualPage {
	constructor(component: any, initObjects?:{ directorys?: VirtualDirectory[], files?: VirtualFile[]}) {
		this.component = shallowRef(component);
		this.currentDirectorys = initObjects?.directorys ?? [];
		this.currentFiles = initObjects?.files ?? [];
		this.visible = true;
		this.uid = generateId();
		this.refreshKey = Math.random();
		this.color = getRandomWebSafeColor();
	}
	// 页面使用的组件
	component: any;
	// 是否可见
	visible: boolean;
	// 当前正在使用的文件夹
	currentDirectorys: VirtualDirectory[];
	// 当前正在使用的文件
	currentFiles: VirtualFile[];
	// 区分每一个页面的唯一id
	uid: number;
	// 当refreshKey改变时需要刷新页面，目前还没接入刷新
	refreshKey: number;
	// 为了区分，每个虚拟页面都会分配一个color，这个color会体现在tab上
	color: string;
	// 用于展示的title
	_title?: string;

	get title() {
		if (this._title) {
			return this._title;
		}
		return this.currentDirectorys[0].name;
	}

	setTitle(title: string) {
		this._title = title;
	}

	// 切换显示状态
	switchShow() {
		this.visible = !this.visible;
	}

	// 刷新，不过好像没有用得到的时候吧
	// 事实上也不应该用得到，因为更新应该是响应式的
	refresh() {
		this.refreshKey = Math.random();
	}
}
