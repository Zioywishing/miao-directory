import { registerComponentOption } from '@/class/PluginCenter'
import DocumentText from '@vicons/ionicons5/es/DocumentText'

const pluginConfig: registerComponentOption = {
    key: 'miaoPDF',
    name: 'PDF浏览',
    icon: DocumentText,
    getComponent: async () =>
        (await import('@/plugins/miaoPDF/miaoPDF.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        return vFiles[0].name.endsWith('pdf')
    }
}

export default pluginConfig


import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component