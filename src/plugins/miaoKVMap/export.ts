import { registerComponentOption } from '@/class/PluginCenter'
import { PluginExportType } from '@/types/type'
import { CopyOutline } from '@vicons/ionicons5'

const pluginConfig: registerComponentOption = {
   key: 'miaoKVMap',
   name: '键值存储',
   icon: CopyOutline,
   getComponent: async () => (await import('./KVMapPlugin.vue')).default,
   filter: (_, __) => _.length === 0 && __.length === 0,
   disable: false,
   single: true,
   priority: 0
}

export default pluginConfig

export const type = PluginExportType.component 