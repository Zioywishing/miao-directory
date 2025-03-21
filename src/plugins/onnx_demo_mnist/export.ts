import { registerComponentOption } from '@/class/PluginCenter'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { Analytics } from '@vicons/ionicons5'

const pluginConfig: registerComponentOption = {
   key: 'onnx_demo_mnist',
   name: 'ONNX DEMO MNIST',
   icon: Analytics,
   getComponent: async () =>
      // @ts-ignore
      (await import('@/plugins/onnx_demo_mnist/onnx_demo_mnist.vue')).default,
   filter: (_vDirs: VirtualDirectory[], vFiles: VirtualFile[]) => {
      if (vFiles.length === 0) {
         return false
      }
      
      // 检查是否存在.onnx文件
      for (let vf of vFiles) {
         if (vf.name.endsWith('.onnx')) {
            return true
         }
      }
      
      return false
   }
}

export default pluginConfig

import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component 