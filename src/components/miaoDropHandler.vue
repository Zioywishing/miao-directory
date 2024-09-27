<template>
    <div class="container" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <slot></slot>
        <miao-mask v-model:show="showMask"></miao-mask>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import miaoMask from './miaoMask.vue'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import config from '@/config'
import useDataBus from '@/hooks/useDataBus'

const props = defineProps({
    disable: {
        type: Boolean,
        default: false
    }
})

const dataBus = useDataBus()

const { uploadSizeLimit } = config

const emit = defineEmits<{
    onFiles: [files: File[]]
    onVirtualFiles: [vFiles: VirtualFile[]]
    onVirtualDirectory: [vDirectory: VirtualDirectory[]]
}>()

const showMask = ref<number>(0)

// File類型的數據可能爲文件夾，通過FileReader進行判斷
const isFile = (file: File) =>
    new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
            resolve(true)
            reader.abort()
        }
        reader.onerror = () => {
            resolve(false)
            reader.abort()
        }
        reader.readAsText(file)
    })

/**
 * 只保留文件，移去文件夹
 * @param {File[]} files
 */
const removeDirectory = async (files: File[]) => {
    let index = 0
    while (index < files.length) {
        const currentFile = files[index]
        const _isFile = await isFile(currentFile)
        if (_isFile) {
            index += 1
            continue
        } else {
            files.splice(index, 1)
            continue
        }
    }
}
const check = (event: DragEvent) => [
    ...(event.dataTransfer?.files ?? []),
    ...(dataBus.get('dragData_vFiles') ?? []),
    ...(dataBus.get('dragData_vDirectory') ?? [])
].length !== 0

const handleDragOver = async (event: DragEvent) => {
    if (props.disable || check(event) === false) {
        return
    }
    event.preventDefault()
    if (showMask.value === 1) {
        return
    }
    showMask.value = 1
}

const handleDragLeave = async () => {
    showMask.value = 0
}

const handleDrop = async (event: DragEvent) => {
    if (props.disable || check(event) === false) {
        return
    }
    showMask.value = 0
    event.preventDefault()
    event.stopPropagation()
    // todo: uploadSize的限制不應該在這裏
    const files = [...(event.dataTransfer?.files ?? [])].filter(
        (file) => file.size < uploadSizeLimit
    )
    await removeDirectory(files)
    const virtualFiles: VirtualFile[] = dataBus.pop('dragData_vFiles')
    const virtualDirectory: VirtualDirectory[] = dataBus.pop(
        'dragData_vDirectory'
    )
    // console.log({ virtualDirectory, virtualFiles })
    if (files && files.length) {
        emit('onFiles', files)
    }
    if (virtualFiles && virtualFiles.length) {
        emit('onVirtualFiles', virtualFiles)
    }
    if (virtualDirectory && virtualDirectory.length) {
        emit('onVirtualDirectory', virtualDirectory)
    }
}
</script>

<style lang="scss" scoped>
.container {
    width: 100%;
    height: 100%;
    position: relative;
}
</style>
