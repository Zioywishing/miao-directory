import { NIcon } from 'naive-ui'
import { h } from 'vue'

export const filePicker = (() => {
    let _resolve: ((files: File[]) => void) | undefined
    return (option?: { accept?: 'string'; multiple: boolean }) => {
        if (_resolve) {
            _resolve([])
            _resolve = undefined
        }
        return new Promise<File[]>((resolve) => {
            const inpEle = document.createElement('input')
            inpEle.id = `__file_${Math.ceil(Math.random() * 100000000)}`
            inpEle.type = 'file'
            inpEle.style.display = 'none'
            _resolve = resolve
            // 文件类型限制
            // inpEle.accept="image/*"
            option?.accept && (inpEle.accept = option?.accept)
            // 多选限制
            option?.multiple && (inpEle.multiple = option?.multiple)
            // inpEle.addEventListener("change", event => fn.call(inpEle, event, inpEle.files), { once: true });
            inpEle.addEventListener(
                'change',
                () => {
                    if (!inpEle.files) {
                        return
                    }
                    const files: File[] = []
                    let i = 0
                    while (i < inpEle.files?.length) {
                        const _file = inpEle?.files?.item(i)
                        if (_file !== null) {
                            files.push(_file)
                        }
                        i += 1
                    }
                    resolve(files)
                    _resolve = undefined
                },
                { once: true }
            )
            inpEle.click()
        })
    }
})()

export const renderIcon = (icon: any) => {
    return () => {
        return h(NIcon, null, {
            default: () => h(icon)
        })
    }
}

export default {
    filePicker,
    renderIcon
}
