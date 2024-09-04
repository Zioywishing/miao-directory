import { registerComponentOption } from '@/class/PluginCenter'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { Image } from '@vicons/ionicons5'

const pluginConfig: registerComponentOption = {
    key: 'miaoImages',
    name: '图片浏览',
    icon: Image,
    getComponent: async () =>
        (await import('@/plugins/miaoImages/miaoImages.vue')).default,
    filter: (vDirs: VirtualDirectory[], vFiles: VirtualFile[]) => {
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
}

export default pluginConfig
