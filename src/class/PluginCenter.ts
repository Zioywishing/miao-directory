import useVirtualPages from '@/hooks/useVirtualPages'
import VirtualDirectory, { VirtualFile } from './VirtualDirectory'
import { ShallowRef, shallowRef } from 'vue'

export enum PluginGroup {
    default = 'default',
    mainMenu = 'mainMenu'
}

export interface registerComponentOption {
    key: string
    name: string
    icon?: any
    getComponent: () => Promise<any>
    group?: PluginGroup[]
    filter: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => boolean
    disable?: boolean
    exitConfirm?: boolean
}

type Plugin = {
    // 用于显示的名字
    name: string
    // 代表插件的icon
    icon?: ShallowRef<any>
    // 是否禁用插件
    disable: boolean
    // 插件所属的group，用于区分插件使用的场合
    group: PluginGroup[]
    // 判断在未禁用时是否可以使用这个组件
    // 使用组件即调用下面的func
    filter: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => boolean
    func: (
        VDirectories: VirtualDirectory[],
        VFiles: VirtualFile[],
        ...args: any[]
    ) => void
}

export default class PluginCenter {
    constructor() {
        this.pluginsMap = {}
    }
    pluginsMap: {
        [key: string]: Plugin
    }

    register(key: string, plugin: Plugin) {
        this.pluginsMap[key] = plugin
    }

    /**
     * 便捷地注册一个组件为插件，触发时直接用新页面打开
     */
    registerComponent(option: registerComponentOption): void {
        const {
            key,
            name,
            getComponent,
            icon,
            filter,
            group = [PluginGroup.default],
            disable = false,
            exitConfirm = false
        } = option
        let _component: any
        const views = useVirtualPages()
        this.register(key, {
            name,
            filter,
            icon: shallowRef(icon),
            group,
            disable,
            func: async (
                VDirectories: VirtualDirectory[],
                VFiles: VirtualFile[]
            ) => {
                if (filter(VDirectories, VFiles) === false) {
                    return
                }
                if (_component === undefined) _component = await getComponent()
                views.push(_component, VDirectories, VFiles, {
                    VirtualPageOption: {
                        exitConfirm
                    }
                })
            }
        })
    }

    getUsablePlugin(
        VDirectories: VirtualDirectory[],
        VFiles: VirtualFile[],
        option?: {
            group?: PluginGroup[]
        }
    ) {
        const { group = [PluginGroup.default] } = option ?? {}
        const usableList = []
        for (let key of Object.keys(this.pluginsMap)) {
            const _plugin = this.pluginsMap[key]
            if (
                !_plugin.disable &&
                _plugin.group.filter((v) => group.includes(v)).length > 0 &&
                _plugin.filter(VDirectories, VFiles)
            ) {
                usableList.push(key)
            }
        }
        return usableList.map((key) => ({
            key,
            ...this.pluginsMap[key]
        }))
    }

    usePlugin(
        key: string,
        VDirectories?: VirtualDirectory[],
        VFiles?: VirtualFile[],
        ...args: any[]
    ) {
        this.pluginsMap[key].func(VDirectories ?? [], VFiles ?? [], ...args)
    }
}
