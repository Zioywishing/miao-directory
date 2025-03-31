import { Plugin, PluginGroup } from '@/class/PluginCenter'
import hideFps from './hideFps'
import { EyeOffOutline } from '@vicons/ionicons5'
import { PluginExportType } from '@/types/type'
import { shallowRef } from 'vue'
import { fpsElement } from '../fps/shared'

const pluginConfig: Plugin = {
   name: '隐藏FPS',
   icon: shallowRef(EyeOffOutline),
   filter: () => {
      // 只有当FPS显示元素存在时才显示此按钮
      return fpsElement.value !== null
   },
   disable: false,
   group: [PluginGroup.mainMenu],
   func: hideFps,
   priority: 0
}

export default pluginConfig

export const type = PluginExportType.default

export const key = 'hideFps' 