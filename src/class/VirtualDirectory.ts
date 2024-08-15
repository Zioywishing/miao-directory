import generateId from "@/hooks/generateId";
import type { stats, file, directory } from "@/types/type.ts";

export class VirtualFile {
	constructor(info: file, parent: VirtualDirectory) {
		this.name = info.name;
		this.size = info.size;
		this.stats = info.stats;
		this.parent = parent;
		this.type = "file";
		this.uid = generateId();
	}
	name: string;
	type: "file";
	size: number;
	stats: stats;
	parent: VirtualDirectory;
	uid: number;
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
		this.uid = generateId();
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

	uid: number;

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
	getParents(layer: number): VirtualDirectory {
		if (layer <= 0 || !this.parent) {
			return this;
		}
		return this.parent.getParents(layer - 1);
	}

	updateContent(content: (file | directory)[]) {
		this.files = this.files ?? [];
		this.directorys = this.directorys ?? [];
		const fileNames: string[] = this.files.map(v => v.name);
		const dirNames: string[] = this.directorys.map(v => v.name);
		const itemNames: string[] = content.map(v => v.name);
		// 删去远程端已不存在的文件与文件夹
		const _delete = (target: (VirtualFile | VirtualDirectory)[]) => {
			let index = 0;
			while (index < target.length) {
				if (!itemNames.includes(target[index].name)) {
					target.splice(index, 1);
				} else {
					index += 1;
				}
			}
		};
		_delete(this.files);
		_delete(this.directorys);
		// 加入新的文件与文件夹
		for (let item of content) {
			if (item.type === "file") {
				if (!fileNames.includes(item.name)) {
					this.files.push(new VirtualFile(item, this));
				}
			} else if (item.type === "directory") {
				if (!dirNames.includes(item.name)) {
					this.directorys.push(new VirtualDirectory(item, this));
				}
			}
		}
	}

	hasChild(item: VirtualDirectory | VirtualFile): boolean {
		if (item.type === "directory") {
			return this.directorys?.includes(item) ?? false;
		} else {
			return this.files?.includes(item) ?? false;
		}
	}
}
export default VirtualDirectory;
