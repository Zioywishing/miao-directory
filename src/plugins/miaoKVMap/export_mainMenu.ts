import { Plugin, PluginGroup } from '@/class/PluginCenter'
import { PluginExportType } from '@/types/type'
import { shallowRef } from 'vue'
import { CopyOutline } from '@vicons/ionicons5'

const pluginConfig: Plugin = {
   name: '键值存储',
   icon: shallowRef(CopyOutline),
   filter: (_, __, views) => {
      return views.find('miaoKVMap').length === 0
   },
   disable: false,
   group: [PluginGroup.mainMenu],
   func(_, __, hooks) {
      const { getPluginCenter } = hooks
      const PluginCenter = getPluginCenter()
      PluginCenter.usePlugin('miaoKVMap', [], [])
   },
   priority: 0
}

export default pluginConfig

export const type = PluginExportType.default
// export const key = 'miaoClipboard_mainMenu' 