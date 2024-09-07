// @ts-nocheck
import { registerComponentOption } from '@/class/PluginCenter'

const pluginConfig: registerComponentOption = {
    key: 'yourPluginKey',
    name: 'yourPluginName',
    // icon: LogoChrome,
    getComponent: async () => null,
        // (await import('yourPluginPath')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        return vFiles[0].name.endsWith('?')
    },
    disable: true
}

export default pluginConfig


import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component