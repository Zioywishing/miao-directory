// @ts-nocheck
import { registerComponentOption } from '@/class/PluginCenter'

const pluginConfig: registerComponentOption = {
    key: 'miaoCrypto',
    name: '文件加密',
    getComponent: async () =>
        (await import('./miaoCrypto.vue')).default,
    filter: (vDirs, vFiles) => {
        return true
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length !== 1) {
            return false
        }
        return vFiles[0].name.endsWith('txt')
    },
}

export default pluginConfig
