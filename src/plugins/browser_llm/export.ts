import { registerComponentOption } from '@/class/PluginCenter'
import PlayCircle from '@vicons/ionicons5/es/PlayCircle'

const pluginConfig: registerComponentOption = {
   key: 'browser_llm',  
   name: 'Browser_LLM',
   icon: PlayCircle,
   getComponent: async () =>
      (await import('@/plugins/browser_llm/browser_llm.vue')).default,
   filter: (vDirs, vFiles) => {
      if (vDirs.length > 1) {
         return false
      }
      if (vDirs.length === 1 && vDirs[0].name !== 'tasks_genai_wasm') {
         return false
      }
      if (vFiles.length === 0) {
         return false
      }
      for (let i of vFiles) {
         for (let s of ['model.bin', 'model.task']) {
            if (i.name.endsWith(s)) {
               return true
            }
         }
      }
      return false
   },
   priority: 6
}

export default pluginConfig

import { PluginExportType } from '@/types/type'
export const type = PluginExportType.component
