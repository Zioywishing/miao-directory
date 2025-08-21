import { PluginGroup, registerComponentOption } from "@/class/PluginCenter"
import VirtualDirectory, { VirtualFile } from "@/class/VirtualDirectory"
import VirtualPage from "@/class/VirtualPage"
import usePluginCenter from "@/hooks/usePluginCenter"
import useVirtualPages from "@/hooks/useVirtualPages"
import { Component } from "vue"

export const componentOption2pluginOption = (option: registerComponentOption) => {
    const {
        key,
        name,
        getComponent,
        icon,
        filter,
        group = [PluginGroup.default],
        disable = false,
        exitConfirm = false,
        single = false,
        priority = 0
    } = option
    let _component: Component
    let _componentPromise: Promise<Component>
    const views = useVirtualPages()
    const pluginCenter = usePluginCenter()
    return {
        name,
        filter,
        icon: shallowRef(icon),
        group,
        disable,
        priority,
        func: async (
            VDirectories: VirtualDirectory[],
            VFiles: VirtualFile[]
        ) => {
            if (filter(VDirectories, VFiles) === false) {
                return
            }

            if (_component === undefined) {
                if (_componentPromise !== undefined) {
                    await _componentPromise
                }
                else {
                    const setAlertTip = pluginCenter.globalAlertTip(`加载 ${name} 插件中`)
                    _componentPromise = getComponent()
                    _component = await _componentPromise
                    setAlertTip &&
                        setAlertTip(`加载 ${name} 插件完成`, {
                            type: 'success',
                            timeout: 2000
                        })
                }
            }
            const _findRes = views.find(_component) as VirtualPage[]
            if (single && _findRes.length !== 0) {
                const view = _findRes[0]
                view.currentFiles = [...view.currentFiles, ...VFiles]
                view.currentDirectories = [
                    ...view.currentDirectories,
                    ...VDirectories
                ]
            } else {
                views.push(_component, key, VDirectories, VFiles, {
                    VirtualPageOption: {
                        exitConfirm,
                        allowCopy: single === false
                    }
                })
            }
        }
    }
}

