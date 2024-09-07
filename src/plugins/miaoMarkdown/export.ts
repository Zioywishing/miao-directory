import { registerComponentOption } from '@/class/PluginCenter'
import DocumentText from '@vicons/ionicons5/es/DocumentText'

const pluginConfig: registerComponentOption = {
    key: 'miaoMarkdown',
    name: 'markdown浏览',
    icon: DocumentText,
    getComponent: async () =>
        (await import('@/plugins/miaoMarkdown/miaoMarkdown.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        return vFiles[0].name.endsWith('md')
    }
}

export default pluginConfig


import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component