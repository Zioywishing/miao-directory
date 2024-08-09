export type stats = {
	atimeMs: number; // 上次访问时间（毫秒）
	birthtimeMs: number; // 创建时间（毫秒）
	ctimeMs: number; // 状态更改时间（毫秒）
	mtimeMs: number; // 上次修改时间（毫秒）
};

export type file = {
	name: string;
	size: number;
	type?: "file";
	stats: stats;
};

export type directory = {
	name: string;
	// 考虑到可能还没请求过来
	content?: (file | directory)[];
	type?: "directory";
	stats: stats;
	parent?: directory;
};
