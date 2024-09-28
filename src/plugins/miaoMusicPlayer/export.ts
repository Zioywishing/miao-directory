import { registerComponentOption } from '@/class/PluginCenter'
import { PluginExportType } from '@/types/type'
import Disc from '@vicons/ionicons5/es/Disc'


const pluginConfig: registerComponentOption = {
    key: 'miaoMusicPlayer',
    name: '音乐',
    icon: Disc,
    getComponent: async () => 
        (await import('./miaoMusicPlayerDemo.vue')).default,
    filter: (vDirs, vFiles) => {
        if (vDirs.length !== 0) {
            return false
        }
        if (vFiles.length === 0) {
            return false
        }
        for (let i of vFiles) {
            for (let s of ['mp3', 'flac', 'ogg']) {
                if (i.name.endsWith(s)) {
                    return true
                }
            }
        }
        return vFiles[0].name.endsWith('?')
    },
    disable: false,
    single: true,
    priority: 5,
}

export default pluginConfig

export const type = PluginExportType.component