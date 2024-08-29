import useVirtualPages from '@/hooks/useVirtualPages'
import VirtualDirectory, { VirtualFile } from './VirtualDirectory'

type plugin = {
    // 用于显示的名字
    name: string
    // 判断是否可以使用这个组件
    // 使用组件即调用下面的func
    filter: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => boolean
    func: (VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) => void
}

export default class PluginCenter {
    constructor() {
        this.pluginsMap = {}
    }
    pluginsMap: {
        [key: string]: plugin
    }

    register(key: string, plugin: plugin) {
        this.pluginsMap[key] = plugin
    }

    /**
     * 便捷地注册一个组件为插件，触发时直接用新页面打开
     */
    registerComponent(
        key: string,
        name: string,
        getComponent: () => Promise<any>,
        filter: (
            VDirectories: VirtualDirectory[],
            VFiles: VirtualFile[]
        ) => boolean
    ): void {
        let _component: any
        const views = useVirtualPages()
        this.register(key, {
            name,
            filter,
            func: async (
                VDirectories: VirtualDirectory[],
                VFiles: VirtualFile[]
            ) => {
                if (filter(VDirectories, VFiles) === false) {
                    return
                }
                if (_component === undefined) _component = await getComponent()
                views.push(_component, VDirectories, VFiles)
            }
        })
    }

    getUsablePlugin(VDirectories: VirtualDirectory[], VFiles: VirtualFile[]) {
        const usableList = []
        for (let key of Object.keys(this.pluginsMap)) {
            if (this.pluginsMap[key].filter(VDirectories, VFiles)) {
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
        VDirectories: VirtualDirectory[],
        VFiles: VirtualFile[]
    ) {
        this.pluginsMap[key].func(VDirectories, VFiles)
    }
}
