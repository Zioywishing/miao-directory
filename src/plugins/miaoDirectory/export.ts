import { registerComponentOption } from '@/class/PluginCenter'
import FileTray from '@vicons/ionicons5/es/FileTray'
// import MiaoDirectory from '@/plugins/miaoDirectory/miaoDirectory.vue'

const pluginConfig: registerComponentOption = {
    key: 'miaoDirectory',
    name: '文件夹',
    icon: FileTray,
    getComponent: async () =>
        (await import('@/plugins/miaoDirectory/miaoDirectory.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vFiles.length) {
            return false
        }
        return vDirs.length === 1
    }
}

export default pluginConfig
