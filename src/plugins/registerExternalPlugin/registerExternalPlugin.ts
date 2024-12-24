import VirtualDirectory, { VirtualFile } from "@/class/VirtualDirectory";
// import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import { PluginExportType, usePluginHooksType } from "@/types/type";
import type { Plugin, registerComponentOption } from "@/class/PluginCenter";
import { checkComponentPlugin, checkNormalPlugin } from "./checkPluginAvailable";

// const miaoFetchApi = useMiaoFetchApi()

export default async function registerExternalPlugin(_VDirectories: VirtualDirectory[], VFiles: VirtualFile[], hooks: usePluginHooksType) {
    try {
        const targetPluginVFile = VFiles[0] as VirtualFile
        const plugin = await import(/* @vite-ignore */ targetPluginVFile.url) as {
            default: registerComponentOption | Plugin;
            type: PluginExportType;
            key?: string;
        }
        const pc = hooks.getPluginCenter()
        if (plugin.type === PluginExportType.default) {
            if (checkNormalPlugin(plugin.default) === false) {
                throw('插件不合法')
            }
            pc.register(plugin.key ?? `${Math.random()}`, plugin.default as Plugin)
        } else {
            if (checkComponentPlugin(plugin.default) === false) {
                throw('插件不合法')
            }
            pc.registerComponent(plugin.default as registerComponentOption)
        }
    } catch (e) {
        console.error(e);
        hooks.globalAlertTip('导入外部插件失败', {
            type: 'error',
            timeout: 3000
        })
    }
}