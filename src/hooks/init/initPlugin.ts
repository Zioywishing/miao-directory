import usePluginCenter, { initPluginCenter } from '@/hooks/usePluginCenter'
import { Plugin, registerComponentOption } from '@/class/PluginCenter'
import { alertTipType, PluginExportType } from '@/types/type'

const initPlugin = async (globalAlertTip: alertTipType) => {
   initPluginCenter(globalAlertTip)
   const modulesFiles = import.meta.glob('@/plugins/**/export*.ts', {
      eager: true
   })
   const pluginCenter = usePluginCenter()
   for (let pluginConfig of Object.values(modulesFiles)) {
      const _config = pluginConfig as {
         default: registerComponentOption | Plugin
         type: PluginExportType
         key?: string
      }
      const { type, key = `${Math.random()}` } = _config
      if (type === PluginExportType.component) {
         pluginCenter.registerComponent(
            _config.default as registerComponentOption
         )
      } else if (type === PluginExportType.default) {
         pluginCenter.register(key as string, _config.default as Plugin)
      }
   }
}

export default initPlugin
