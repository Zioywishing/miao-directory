import { pastePluginConfig } from './export'
import { PluginExportType } from '@/types/type'

// 导出为默认插件类型
export const type = PluginExportType.default

// 插件键值
export const key = 'miaoPaste'

// 导出粘贴插件
export default pastePluginConfig 