import MiaoDirectory from '@/views/miaoDirectory.vue'
import usePluginCenter from './usePluginCenter'
import MiaoVideoPlayer from '@/views/miaoVideoPlayer.vue'
import MiaoIframe from '@/views/miaoIframe.vue'
import MiaoPDF from '@/views/miaoPDF.vue'

export default function init() {
    const pluginCenter = usePluginCenter()
    pluginCenter.registerComponent(
        'miaoDirectory',
        '文件夹',
        MiaoDirectory,
        (vDirs, vFiles) => {
            if (vFiles.length) {
                return false
            }
            return vDirs.length === 1
        }
    )
    pluginCenter.registerComponent(
        'miaoVideoPlayer',
        '视频',
        MiaoVideoPlayer,
        (vDirs, vFiles) => {
            if (vDirs.length !== 0) {
                return false
            }
            if (vFiles.length === 0) {
                return false
            }
            for (let i of vFiles) {
                for (let s of ['mp4', 'm3u8', 'hls']) {
                    if (i.name.endsWith(s)) {
                        return true
                    }
                }
            }
            return false
        }
    )
    pluginCenter.registerComponent(
        'miaoIframe',
        '框架',
        MiaoIframe,
        () => {
            return false
        }
    )
    pluginCenter.registerComponent(
        'miaoPDF',
        'PDF浏览',
        MiaoPDF,
        (vDirs, vFiles) => {
            if (vDirs.length !== 0) {
                return false
            }
            if (vFiles.length !== 1) {
                return false
            }
            return vFiles[0].name.endsWith('pdf')
        }
    )
}
