import { VirtualFile } from "@/class/VirtualDirectory"
import config from "@/config"
import { usePluginHooksType } from "@/types/type"
import copy2Clipboard from 'copy-to-clipboard'

const copy = (__: any, vFiles: VirtualFile[], hooks: usePluginHooksType) => {
    const { globalAlertTip } = hooks
    const vFile = vFiles[0]
    console.log(vFile.url)
    copy2Clipboard(`${config.baseUrl}${vFile.url}`)
    globalAlertTip(`${vFile.name}的链接已复制至剪切板`, {
        type: 'info',
        timeout: 2000
    })
}
export default copy