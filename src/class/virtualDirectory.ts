import type { stats, file, directory } from "@/types/type.ts";

class VirtualFile {
	constructor(info: file, parent: VirtualDirectory) {
		this.name = info.name;
		this.size = info.size;
		this.stats = info.stats;
		this.parent = parent;
		this.type = "file";
	}
	name: string;
	type: "file";
	size: number;
	stats: stats;
	parent: VirtualDirectory;
	get path() {
		return `${this.parent.path}${this.name}`;
	}
}

class VirtualDirectory {
	constructor(info: directory, parent?: VirtualDirectory) {
		this.name = info.name;
		this.type = "directory";
		this.stats = info.stats;
		this.parent = parent ?? undefined;
		// 这里要改
	}
	// 文件夹名
	name: string;
	// 子文件
	files?: VirtualFile[];
	// 子目录
	directorys?: VirtualDirectory[];
	// 没啥意义，标注一下就是了
	type: "directory";
	// 文件夹创建时间等杂项属性
	stats: stats;
	// 父文件夹
	parent?: VirtualDirectory;

	/**
	 * 获取相对于根目录的路径的层数
	 * 用于目录下文件定位
	 * @returns {string}
	 */
	get layer(): number {
		return this.parent ? this.parent.layer + 1 : 0;
	}
	/**
	 * 相对于根目录的路径， 如: "/",  "/123/321/"
	 * 用于目录下文件定位
	 * @returns {string}
	 */
	get path(): string {
		if (!this.parent) {
			return "/";
		}
		return `${this.parent.path}${this.name}/`;
	}

	/**
	 * 获取从根目录开始的按顺序的文件夹
	 * @returns {VirtualDirectory[]}
	 */
	get directoryArray(): VirtualDirectory[] {
		if (!this.parent) {
			return [this];
		}
		return [...this.parent.directoryArray, this];
	}

	/**
	 * 获取 layer 级父文件夹, 如getParent(1)就返回父级
	 * @param {number} layer 需要跳转的层数
	 * @returns {VirtualDirectory}
	 */
	getParent(layer: number): VirtualDirectory {
		if (layer <= 0 || !this.parent) {
			return this;
		}
		return this.parent.getParent(layer - 1);
	}

	setContent(content: (file | directory)[]) {
		this.files = [];
		this.directorys = [];
		for (let item of content) {
			if (item.type === "file") {
				this.files.push(new VirtualFile(item, this));
			} else if (item.type === "directory") {
				this.directorys.push(new VirtualDirectory(item, this));
			}
		}
	}
}
export default VirtualDirectory;
