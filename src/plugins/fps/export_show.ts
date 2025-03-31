import { Plugin, PluginGroup } from '@/class/PluginCenter'
import showFps from './showFps'
import { SpeedometerOutline } from '@vicons/ionicons5'
import { PluginExportType } from '@/types/type'
import { shallowRef } from 'vue'
import { fpsElement } from './shared'

const pluginConfig: Plugin = {
   name: '显示FPS',
   icon: shallowRef(SpeedometerOutline),
   filter: () => {
      return fpsElement.value === null
   },
   disable: false,
   group: [PluginGroup.mainMenu],
   func: showFps,
   priority: 0
}

export default pluginConfig

export const type = PluginExportType.default

export const key = 'showFps' 