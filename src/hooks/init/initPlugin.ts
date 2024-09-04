
import usePluginCenter from '@/hooks/usePluginCenter'
import { registerComponentOption } from '@/class/PluginCenter'

const initPlugin = async () => {
    const modulesFiles = import.meta.glob('@/plugins/**/export.ts')
    const pluginCenter = usePluginCenter()
    for (let pluginConfig of Object.values(modulesFiles)) {
        const _config = pluginConfig as () => Promise<{
            default: registerComponentOption
        }>
        pluginCenter.registerComponent((await _config()).default)
    }
}

export default initPlugin
