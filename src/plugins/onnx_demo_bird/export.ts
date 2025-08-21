import { registerComponentOption } from '@/class/PluginCenter'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { Analytics } from '@vicons/ionicons5'

const pluginConfig: registerComponentOption = {
   key: '45632456',
   name: 'ONNX DEMO BIRD',
   icon: Analytics,
   getComponent: async () =>
      (await import('./onnx_demo.vue')).default,
   filter: (_vDirs: VirtualDirectory[], vFiles: VirtualFile[]) => {
      if (vFiles.length === 0) {
         return false
      }
      
      // 检查是否存在.onnx文件
      let hasOnnxFile = false
      // 检查是否存在图片文件
      let hasImageFile = false
      
      const imageSuffixList = [
         'xbm', 'tif', 'pjp', 'svgz', 'jpg', 'jpeg', 'ico', 'tiff', 'gif',
         'svg', 'jfif', 'webp', 'png', 'bmp', 'pjpeg', 'avif'
      ]
      
      for (let vf of vFiles) {
         if (vf.name.endsWith('.onnx')) {
            hasOnnxFile = true
            return true
         }
         
         for (let end of imageSuffixList) {
            if (vf.name.endsWith(end)) {
               hasImageFile = true
               break
            }
         }
         
         if (hasOnnxFile && hasImageFile) {
            return true
         }
      }
      
      return false
   }
}

export default pluginConfig

import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component 