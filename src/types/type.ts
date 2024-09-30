import PluginCenter from "@/class/PluginCenter";
import { VirtualPages } from "@/class/VirtualPage";

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

export type alertTipType = (content: string, options?: AlertTipMessageOptions) => (newContent: string, newOptions?: AlertTipMessageOptions) => void;

export interface AlertTipMessageOptions {
	type?: "info" | "success" | "error";
	timeout?: number;
	id?: number;
}

export enum PluginExportType {
	default = "default",
	component = "component"
}

export interface usePluginHooksType {
	globalAlertTip: alertTipType;
	getViews: () => VirtualPages;
	getPluginCenter: () => PluginCenter;
}

export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
