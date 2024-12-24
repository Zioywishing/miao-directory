import VirtualDirectory, { VirtualFile } from "@/class/VirtualDirectory";
// import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import { PluginExportType, usePluginHooksType } from "@/types/type";
import type { Plugin, registerComponentOption } from "@/class/PluginCenter";

// const miaoFetchApi = useMiaoFetchApi()

export default async function registerExternalPlugin(_VDirectories: VirtualDirectory[], VFiles: VirtualFile[], hooks: usePluginHooksType) {
    const targetPluginVFile = VFiles[0] as VirtualFile
    // const pluginU8iArr = await miaoFetchApi.getFile(targetPluginVFile).response
    // const pluginText = new TextDecoder().decode(pluginU8iArr)
    // const plugin = await import(/* @vite-ignore */'')
    const plugin = await import(/* @vite-ignore */ targetPluginVFile.url) as {
                        default: registerComponentOption | Plugin;
                        type: PluginExportType;
                        key?: string;
                    }
    // console.log(plugin)
    const pc = hooks.getPluginCenter()
    if(plugin.type === PluginExportType.default) {
        pc.register(`${Math.random()}`, plugin.default as Plugin)
    } else {
        pc.registerComponent(plugin.default as registerComponentOption)
    }
}