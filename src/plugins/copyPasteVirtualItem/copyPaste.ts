import { VirtualDirectory, VirtualFile } from '@/class/VirtualDirectory'
import { usePluginHooksType } from '@/types/type'

// 用于存储复制的项目
let copiedItems: {
    files: VirtualFile[],
    directories: VirtualDirectory[],
    isCut: boolean
} = {
    files: [],
    directories: [],
    isCut: false
}

// 复制或剪切虚拟项目
const copyItems = (vDirs: VirtualDirectory[], vFiles: VirtualFile[], hooks: usePluginHooksType, isCut = false) => {
    const { globalAlertTip } = hooks
    
    // 保存复制的项目
    copiedItems = {
        files: [...vFiles],
        directories: [...vDirs],
        isCut
    }
    
    // 生成消息文本
    const fileCount = vFiles.length
    const dirCount = vDirs.length
    let messageText = ''
    
    if (fileCount > 0 && dirCount > 0) {
        messageText = `已${isCut ? '剪切' : '复制'} ${fileCount}个文件和${dirCount}个文件夹`
    } else if (fileCount > 0) {
        messageText = `已${isCut ? '剪切' : '复制'} ${fileCount}个文件`
    } else if (dirCount > 0) {
        messageText = `已${isCut ? '剪切' : '复制'} ${dirCount}个文件夹`
    }
    
    // 显示提示
    globalAlertTip(messageText, {
        type: 'info',
        timeout: 2000
    })
}

// 粘贴虚拟项目
const pasteItems = async (vDirs: VirtualDirectory[], _vFiles: VirtualFile[], hooks: usePluginHooksType) => {
    const { globalAlertTip, getRootVDirectory } = hooks
    
    // 检查目标目录
    if (vDirs.length !== 1) {
        globalAlertTip('请选择一个目标文件夹进行粘贴', {
            type: 'error',
            timeout: 2000
        })
        return
    }
    
    // 检查是否有复制的项目
    if (copiedItems.files.length === 0 && copiedItems.directories.length === 0) {
        globalAlertTip('没有可粘贴的项目', {
            type: 'info',
            timeout: 2000
        })
        return
    }
    
    const targetDir = vDirs[0]
    let successCount = 0
    let failCount = 0
    
    // 处理粘贴文件
    for (const file of copiedItems.files) {
        try {
            if (copiedItems.isCut) {
                // 剪切操作
                const success = await file.moveTo(targetDir)
                if (success) {
                    successCount++
                } else {
                    failCount++
                }
            } else {
                // 复制操作
                const success = await file.copyTo(targetDir)
                if (success) {
                    successCount++
                } else {
                    failCount++
                }
            }
        } catch (err) {
            console.error('粘贴文件失败:', err)
            failCount++
        }
    }
    
    // 处理粘贴目录
    for (const dir of copiedItems.directories) {
        try {
            if (copiedItems.isCut) {
                // 目录移动 - 使用mv方法而不是moveTo
                const success = await dir.mv(targetDir)
                if (success) {
                    successCount++
                } else {
                    failCount++
                }
            } else {
                // 目录复制
                const success = await dir.copy(targetDir)
                if (success) {
                    successCount++
                } else {
                    failCount++
                }
            }
        } catch (err) {
            console.error('粘贴目录失败:', err)
            failCount++
        }
    }
    
    // 如果是剪切操作，粘贴后清空复制的项目
    if (copiedItems.isCut && successCount > 0) {
        copiedItems = {
            files: [],
            directories: [],
            isCut: false
        }
    }
    
    // 显示操作结果
    if (successCount > 0 && failCount === 0) {
        globalAlertTip(`成功${copiedItems.isCut ? '移动' : '复制'}了${successCount}个项目`, {
            type: 'success',
            timeout: 2000
        })
    } else if (successCount > 0 && failCount > 0) {
        globalAlertTip(`${successCount}个项目成功，${failCount}个项目失败`, {
            type: 'info',
            timeout: 2000
        })
    } else {
        globalAlertTip('操作失败', {
            type: 'error',
            timeout: 2000
        })
    }
    
    // 更新目录
    try {
        // 使用update方法更新根目录
        const rootDir = getRootVDirectory();
        await rootDir.update();
    } catch (err) {
        console.error('更新目录失败:', err);
    }
}

// 复制功能
export const copy = (vDirs: VirtualDirectory[], vFiles: VirtualFile[], hooks: usePluginHooksType) => {
    copyItems(vDirs, vFiles, hooks, false)
}

// 剪切功能
export const cut = (vDirs: VirtualDirectory[], vFiles: VirtualFile[], hooks: usePluginHooksType) => {
    copyItems(vDirs, vFiles, hooks, true)
}

// 粘贴功能
export const paste = (vDirs: VirtualDirectory[], vFiles: VirtualFile[], hooks: usePluginHooksType) => {
    pasteItems(vDirs, vFiles, hooks)
} 