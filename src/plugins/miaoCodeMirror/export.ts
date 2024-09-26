import { registerComponentOption } from '@/class/PluginCenter'
import { CodeOutline } from '@vicons/ionicons5'
import { PluginExportType } from '@/types/type'

const pluginConfig: registerComponentOption = {
    key: 'miaoCodeMirror',
    name: '代码编辑',
    icon: CodeOutline,
    getComponent: async () =>
        (await import('@/plugins/miaoCodeMirror/miaoCodeMirror.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        for (let end of [
            'js',
            'ts',
            'jsx',
            'tsx',
            'py',
            'html',
            'css',
            'scss',
            'go',
            'json',
            'md',
            'yaml',
            'txt',
            'xml',
            'vue'
        ]) {
            if (vFiles[0].name.endsWith(end)) {
                return true
            }
        }
        return false
    }
}

export default pluginConfig

export const type = PluginExportType.component