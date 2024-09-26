import { registerComponentOption } from '@/class/PluginCenter'
import PlayCircle from '@vicons/ionicons5/es/PlayCircle'

const pluginConfig: registerComponentOption = {
    key: 'miaoVideoPlayer',
    name: '视频',
    icon: PlayCircle,
    getComponent: async () =>
        (await import('@/plugins/miaoVideoPlayer/miaoVideoPlayer.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length === 0) {
            return false
        }
        for (let i of vFiles) {
            for (let s of ['mp4', 'mp3']) {
                if (i.name.endsWith(s)) {
                    return true
                }
            }
        }
        return false
    }
}

export default pluginConfig


import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component