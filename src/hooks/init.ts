import MiaoDirectory from '@/views/miaoDirectory.vue'
import usePluginCenter from './usePluginCenter'

export default function init() {
    const pluginCenter = usePluginCenter()
    pluginCenter.registerComponent(
        'miaoDirectory',
        '文件夹',
        async () => MiaoDirectory,
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
        async () => (await import('@/views/miaoVideoPlayer.vue')).default,
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
        async () => (await import('@/views/miaoIframe.vue')).default,
        (vDirs, vFiles) => {
            if (vDirs.length !== 0) {
                return false
            }
            if (vFiles.length !== 1) {
                return false
            }
            return vFiles[0].name.endsWith('html')
        }
    )
    pluginCenter.registerComponent(
        'miaoPDF',
        'PDF浏览',
        async () => (await import('@/views/miaoPDF.vue')).default,
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
    pluginCenter.registerComponent(
        'miaoCodeMirror',
        '代码编辑',
        async () => (await import('@/views/miaoCodeMirror.vue')).default,
        (vDirs, vFiles) => {
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
                'vue',
            ]) {
                if (vFiles[0].name.endsWith(end)) {
                    return true
                }
            }
            return false
        }
    )
	pluginCenter.registerComponent(
		"miaoImages",
		"图片浏览",
		async () => (await import("@/views/miaoImages.vue")).default,
		(vDirs, vFiles) => {
			if (vDirs.length === 0 && vFiles.length === 0) {
				return false;
			}
			miao: for (let vf of vFiles)
				for (let end of [".xbm", ".tif", "pjp", ".svgz", "jpg", "jpeg", "ico", "tiff", ".gif", "svg", ".jfif", ".webp", ".png", ".bmp", "pjpeg", ".avif"]) {
					if (vf.name.endsWith(end)) {
						continue miao;
					}
				}
			return true;
		}
	);
}
