import MiaoDirectory from '@/views/miaoDirectory.vue'
import usePluginCenter from './usePluginCenter'
import {
    DocumentText,
    FileTray,
    Image,
    LogoChrome,
    CodeOutline,
    PlayCircle,
} from '@vicons/ionicons5'

export default function init() {
    const pluginCenter = usePluginCenter()
    pluginCenter.registerComponent({
        key: 'miaoDirectory',
        name: '文件夹',
        icon: FileTray,
        getComponent: async () => MiaoDirectory,
        filter: (vDirs, vFiles) => {
            if (vFiles.length) {
                return false
            }
            return vDirs.length === 1
        }
    })
    pluginCenter.registerComponent({
        key: 'miaoVideoPlayer',
        name: '视频',
        icon: PlayCircle,
        getComponent: async () =>
            (await import('@/views/miaoVideoPlayer.vue')).default,
        filter: (vDirs, vFiles) => {
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
    })

    pluginCenter.registerComponent({
        key: 'miaoIframe',
        name: '框架',
        icon: LogoChrome,
        getComponent: async () =>
            (await import('@/views/miaoIframe.vue')).default,
        filter: (vDirs, vFiles) => {
            if (vDirs.length !== 0) {
                return false
            }
            if (vFiles.length !== 1) {
                return false
            }
            return vFiles[0].name.endsWith('html')
        }
    })

    pluginCenter.registerComponent({
        key: 'miaoPDF',
        name: 'PDF浏览',
        icon: DocumentText,
        getComponent: async () => (await import('@/views/miaoPDF.vue')).default,
        filter: (vDirs, vFiles) => {
            if (vDirs.length !== 0) {
                return false
            }
            if (vFiles.length !== 1) {
                return false
            }
            return vFiles[0].name.endsWith('pdf')
        }
    })

    pluginCenter.registerComponent({
        key: 'miaoCodeMirror',
        name: '代码编辑',
        icon: CodeOutline,
        getComponent: async () =>
            (await import('@/views/miaoCodeMirror.vue')).default,
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
    })

    pluginCenter.registerComponent({
        key: 'miaoImages',
        name: '图片浏览',
        icon: Image,
        getComponent: async () =>
            (await import('@/views/miaoImages.vue')).default,
        filter: (vDirs, vFiles) => {
            if (vDirs.length === 0 && vFiles.length === 0) {
                return false
            }
            if (vDirs.length) {
                return true
            }
            for (let vf of vFiles)
                for (let end of [
                    'xbm',
                    'tif',
                    'pjp',
                    'svgz',
                    'jpg',
                    'jpeg',
                    'ico',
                    'tiff',
                    'gif',
                    'svg',
                    'jfif',
                    'webp',
                    'png',
                    '.bmp',
                    'pjpeg',
                    'avif'
                ]) {
                    if (vf.name.endsWith(end)) {
                        return true
                    }
                }
            return false
        }
    })
}
