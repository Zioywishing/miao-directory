import config from "@/config";
import generateId from "@/hooks/generateId";
import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import type { stats, file, directory } from "@/types/type.ts";

const miaoFetchApi = useMiaoFetchApi();

const vItemMap = new Map();

export interface Tree {
	name: string;
	type: "directory";
	path: string;
	stats: stats;
	files?: {
		name: string;
		type: "file";
		size: number;
		stats: stats;
		url: string;
	}[];
	directories?: Tree[];
}

export class VirtualFile {
	constructor(info: file, parent: VirtualDirectory) {
		this.name = info.name;
		this.size = info.size;
		this.stats = info.stats;
		this.parent = parent;
		this.type = "file";
		this.id = generateId();
		vItemMap.set(this.path, this);
	}
	name: string;
	type: "file";
	size: number;
	stats: stats;
	parent: VirtualDirectory;
	id: number;
	storage: { [key: string]: any } = {};
	get path() {
		return `${this.parent.path}${this.name}`;
	}

	get url() {
		return `${config.api.get}${this.parent.path}${this.name}`;
	}
}

class VirtualDirectory {
	/**
	 * 除非为根节点，否则必须设置parent
	 */
	constructor(info: directory, parent?: VirtualDirectory) {
		this.name = info.name;
		this.stats = info.stats;
		this.parent = parent ?? undefined;
		this.id = generateId();
		vItemMap.set(this.path, this);
	}
	// 文件夹名
	name: string;
	// 子文件
	files?: VirtualFile[];
	// 子目录
	directories?: VirtualDirectory[];
	// 没啥意义，标注一下就是了
	type: "directory" = "directory";
	// 文件夹创建时间等杂项属性
	stats: stats;
	// 父文件夹
	parent?: VirtualDirectory;

	_isUpdated: boolean = false;

	id: number;

	// 用来存储一些标记信息啥的
	storage: { [key: string]: any } = {};

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
	get getParents(): VirtualDirectory[] {
		if (!this.parent) {
			return [this];
		}
		return [...this.parent.getParents, this];
	}

	/**
	 * 获取当前文件夹是否已经请求过至少一次数据
	 */
	get isUpdated() {
		return this._isUpdated;
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

	get tree(): Tree {
		return {
			name: this.name,
			type: this.type,
			path: this.path,
			stats: this.stats,
			files:
				this.files?.map(v => ({
					name: v.name,
					type: v.type,
					size: v.size,
					stats: v.stats,
					url: v.url
				})) ?? [],
			directories: this.directories?.map(v => v.tree) ?? []
		};
	}

	// todo: 重构这个函数
	updateContent(content: (file | directory)[]) {
		this._isUpdated = true;

		this.files = this.files ?? [];
		this.directories = this.directories ?? [];
		const fileNames: string[] = this.files.map(v => v.name);
		const dirNames: string[] = this.directories.map(v => v.name);
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
		_delete(this.directories);
		// 加入新的文件与文件夹
		for (let item of content) {
			if (item.type === "file") {
				if (!fileNames.includes(item.name)) {
					this.files.push(new VirtualFile(item, this));
				}
			} else if (item.type === "directory") {
				if (!dirNames.includes(item.name)) {
					this.directories.push(new VirtualDirectory(item, this));
				}
			}
		}
	}

	hasChild(item: VirtualDirectory | VirtualFile): boolean {
		if (item.type === "directory") {
			return this.directories?.includes(item) ?? false;
		} else {
			return this.files?.includes(item) ?? false;
		}
	}

	/**
	 * 调用后重新向远端拉取文件夹信息并进行更新
	 * @returns {void}
	 */
	async update(): Promise<void> {
		const data: (file | directory)[] = await miaoFetchApi.get(this);
		this.updateContent(data);
	}
}
export default VirtualDirectory;
