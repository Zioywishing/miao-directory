import { registerComponentOption } from '@/class/PluginCenter'
import LogoChrome from '@vicons/ionicons5/es/LogoChrome'

const pluginConfig: registerComponentOption = {
    key: 'miaoIframe',
    name: '框架',
    icon: LogoChrome,
    getComponent: async () =>
        (await import('@/plugins/miaoIframe/miaoIframe.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        return vFiles[0].name.endsWith('html')
    }
}

export default pluginConfig


import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component