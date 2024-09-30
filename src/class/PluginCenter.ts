import useVirtualPages from "@/hooks/useVirtualPages";
import VirtualDirectory, { VirtualFile } from "./VirtualDirectory";
import { ShallowRef, shallowRef } from "vue";
import { alertTipType, usePluginHooksType } from "@/types/type";
import VirtualPage, { VirtualPages } from "./VirtualPage";

export enum PluginGroup {
	default = "default",
	mainMenu = "mainMenu"
}

export interface registerComponentOption {
	key: string;
	name: string;
	icon?: any;
	getComponent: () => Promise<any>;
	group?: PluginGroup[];
	filter: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => boolean;
	disable?: boolean;
	exitConfirm?: boolean;
	// 若为true，则只会创建一个页面，当存在已创建页面则会直接将VFile和VDir加到curr里面
	single?: boolean;
	priority?: number;
}

export type Plugin = {
	// 用于显示的名字
	name: string;
	// 代表插件的icon
	icon?: ShallowRef<any>;
	// 是否禁用插件
	disable: boolean;
	// 插件所属的group，用于区分插件使用的场合
	group: PluginGroup[];
	// 插件优先级
	priority: number;
	// 判断在未禁用时是否可以使用这个组件
	// 使用组件即调用下面的func
	filter: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[], VPages: VirtualPages) => boolean;
	func: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[], hooks: usePluginHooksType, ...args: any[]) => void;
};

export default class PluginCenter {
	constructor(globalAlertTip: alertTipType) {
		this.pluginsMap = {};
		this.globalAlertTip = globalAlertTip;
	}
	pluginsMap: {
		[key: string]: Plugin;
	};

	globalAlertTip: alertTipType;

	register(key: string, plugin: Plugin) {
		this.pluginsMap[key] = plugin;
	}

	/**
	 * 便捷地注册一个组件为插件，触发时直接用新页面打开，页面名为key
	 */
	registerComponent(option: registerComponentOption): void {
		const { key, name, getComponent, icon, filter, group = [PluginGroup.default], disable = false, exitConfirm = false, single = false, priority = 0 } = option;
		let _component: any;
		const views = useVirtualPages();
		this.register(key, {
			name,
			filter,
			icon: shallowRef(icon),
			group,
			disable,
			priority,
			func: async (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => {
				if (filter(VDirectories, VFiles) === false) {
					return;
				}

				if (_component === undefined) {
					const setAlertTip = this.globalAlertTip(`加载 ${name} 插件中`);
					_component = await getComponent();
					setAlertTip &&
						setAlertTip(`加载 ${name} 插件完成`, {
							type: "success",
							timeout: 2000
						});
				}
				const _findRes = views.find(_component) as VirtualPage[];
				if (single && _findRes.length !== 0) {
					const view = _findRes[0];
					view.currentFiles = [...view.currentFiles, ...VFiles];
					view.currentDirectories = [...view.currentDirectories, ...VDirectories];
				} else {
					views.push(_component, key, VDirectories, VFiles, {
						VirtualPageOption: {
							exitConfirm,
							allowCopy: single === false
						}
					});
				}
			}
		});
	}

	getUsablePlugin(
		VDirectories: VirtualDirectory[],
		VFiles: VirtualFile[],
		option?: {
			group?: PluginGroup[];
		}
	) {
		const { group = [PluginGroup.default] } = option ?? {};
		const usableList = [];
		const views = useVirtualPages();
		for (let key of Object.keys(this.pluginsMap)) {
			const _plugin = this.pluginsMap[key];
			if (!_plugin.disable && _plugin.group.filter(v => group.includes(v)).length > 0 && _plugin.filter(VDirectories, VFiles, views)) {
				usableList.push(key);
			}
		}
		const res = usableList.map(key => ({
			key,
			...this.pluginsMap[key]
		}));
		res.sort((a, b) => b.priority - a.priority);
		return res;
	}

	usePlugin(key: string, VDirectories?: VirtualDirectory[], VFiles?: VirtualFile[], ...args: any[]): void;
	// usePlugin(key: string, VPages: VirtualPages, ...args: any[]) : void

	usePlugin(key: string, VDirectories?: VirtualDirectory[], VFiles?: VirtualFile[], ...args: any[]) {
		this.pluginsMap[key].func(
			VDirectories ?? [],
			VFiles ?? [],
			{
				globalAlertTip: this.globalAlertTip,
				getViews: useVirtualPages,
				getPluginCenter: () => this
			},
			...args
		);
	}
}
