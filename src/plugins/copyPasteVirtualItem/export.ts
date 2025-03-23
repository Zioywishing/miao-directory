import { Plugin, PluginGroup } from '@/class/PluginCenter'
import { copy, cut, paste } from './copyPaste'
import { 
    CopyOutline, 
    CutOutline, 
    DocumentAttachOutline 
} from '@vicons/ionicons5'
import { PluginExportType } from '@/types/type'
import { shallowRef } from 'vue'

// 复制插件配置
export const copyPluginConfig: Plugin = {
    name: '复制',
    icon: shallowRef(CopyOutline),
    filter: (vDirs, vFiles) => {
        // 至少选择了一个文件或文件夹
        return vDirs.length > 0 || vFiles.length > 0
    },
    disable: false,
    group: [PluginGroup.default],
    func: copy,
    priority: -10
}

// 剪切插件配置
export const cutPluginConfig: Plugin = {
    name: '剪切',
    icon: shallowRef(CutOutline),
    filter: (vDirs, vFiles) => {
        // 至少选择了一个文件或文件夹
        return vDirs.length > 0 || vFiles.length > 0
    },
    disable: false,
    group: [PluginGroup.default],
    func: cut,
    priority: -10
}

// 粘贴插件配置
export const pastePluginConfig: Plugin = {
    name: '粘贴',
    icon: shallowRef(DocumentAttachOutline),
    filter: (vDirs, vFiles) => {
        // 只选择了一个目录作为粘贴目标
        return vDirs.length === 1 && vFiles.length === 0
    },
    disable: false,
    group: [PluginGroup.default],
    func: paste,
    priority: -10
}

// 导出为默认插件类型
export const type = PluginExportType.default

// 插件键值
export const key = 'miaoCopy'

// 导出默认的复制插件
export default copyPluginConfig 