<template>
    <div
        class="miao-directory-container-items"
        :style="{
            backgroundColor: index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
        }">
        <n-scrollbar ref="scrollbarRef" style="max-height: 100%">
            <miao-lazy-div
                v-for="dir in showData_directory"
                :key="dir.id"
                min-height="50px">
                <miaoDirectoryItem
                    :item="dir"
                    :color="props.color"
                    :selected="selectedItem.includes(dir)"
                    :drop-down-options="itemDropDownOptions(dir).value"
                    @delete="handleItemDelete(dir)"
                    @plugin="(p) => handleItemUsePlugin(dir)(p)"
                    @click="handleItemClick(dir)"
                    @drag-start="(e) => handleItemDragStart(dir)(e)"
                    @rename="handleItemRename(dir)"
                    @on-selected="handleItemSelect(dir)" />
            </miao-lazy-div>
            <miao-lazy-div
                v-for="file in showData_files"
                :key="file.id"
                min-height="50px">
                <miaoDirectoryItem
                    :item="file"
                    :color="props.color"
                    :selected="selectedItem.includes(file)"
                    :drop-down-options="itemDropDownOptions(file).value"
                    @click="handleItemClick(file)"
                    @download="handleItemDownload(file)"
                    @delete="handleItemDelete(file)"
                    @drag-start="(e) => handleItemDragStart(file)(e)"
                    @rename="handleItemRename(file)"
                    @plugin="(p) => handleItemUsePlugin(file)(p)"
                    @on-selected="handleItemSelect(file)" />
            </miao-lazy-div>
        </n-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import miaoDirectoryItem from './miaoDirectoryItem.vue'
import miaoLazyDiv from '@/components/miaoLazyDiv.vue'
import { computed, ref } from 'vue'
import usePluginCenter from '@/hooks/usePluginCenter'
import { renderIcon } from '@/hooks/miaoTools'

const pluginCenter = usePluginCenter()

const props = defineProps<{
    color: string
    index: number
    showData_directory: VirtualDirectory[]
    showData_files: VirtualFile[]
    selectedItem: (VirtualFile | VirtualDirectory)[]
}>()

const emit = defineEmits<{
    'item-click': [item: VirtualDirectory | VirtualFile]
    'item-download': [item: VirtualFile]
    'item-delete': [item: VirtualDirectory | VirtualFile]
    'item-drag-start': [_event: DragEvent, item: VirtualDirectory | VirtualFile]
    'item-rename': [item: VirtualDirectory | VirtualFile]
    'item-select': [item: VirtualDirectory | VirtualFile]
}>()

const scrollbarRef = ref()

const itemDropDownOptions = (item: VirtualDirectory | VirtualFile) =>
    computed(() => {
        const items = [...props.selectedItem]
        const selected = props.selectedItem.includes(item)
        if (!selected) {
            items.push(item)
        }
        const vDirs = items.filter((v) => v.type === 'directory')
        const vFiles = items.filter((v) => v.type === 'file')
        const options = [
            {
                label: '重命名',
                key: 'rename'
            },
            {
                label: '删除',
                key: 'delete'
            }
        ]
        if (item.type === 'file') {
            options.push(
                ...[
                    {
                        label: '下载',
                        key: 'download'
                    }
                ]
            )
        }
        if (selected === false) {
            options.push(
                ...[
                    {
                        label: '多选:选择',
                        key: 'select'
                    }
                ]
            )
        } else {
            options.push(
                ...[
                    {
                        label: '多选:取消',
                        key: 'select'
                    }
                ]
            )
        }
        options.push(
            ...pluginCenter.getUsablePlugin(vDirs, vFiles).map((v) => ({
                label: `插件:${v.name}`,
                key: `plugin:${v.key}`,
                icon: v.icon ? renderIcon(v.icon) : undefined
            }))
        )
        return options
    })

const handleItemClick = (item: VirtualDirectory | VirtualFile) => {
    emit('item-click', item)
}

const handleItemDownload = (item: VirtualFile) => {
    emit('item-download', item)
}

const handleItemDelete = (item: VirtualDirectory | VirtualFile) => {
    emit('item-delete', item)
}

const handleItemDragStart =
    (item: VirtualDirectory | VirtualFile) => (_event: DragEvent) => {
        emit('item-drag-start', _event, item)
    }

const handleItemRename = (item: VirtualDirectory | VirtualFile) => {
    emit('item-rename', item)
}

const handleItemSelect = (item: VirtualDirectory | VirtualFile) => {
    emit('item-select', item)
}

const handleItemUsePlugin =
    (item: VirtualDirectory | VirtualFile) => (plugin: string) => {
        const items = [...props.selectedItem]
        const selected = props.selectedItem.includes(item)
        if (!selected) {
            items.push(item)
        }
        const vDirs = items.filter((v) => v.type === 'directory')
        const vFiles = items.filter((v) => v.type === 'file')
        pluginCenter.usePlugin(plugin, vDirs, vFiles)
    }

defineExpose({
    scrollTo: (...args: any) => scrollbarRef.value.scrollTo(...args)
})
</script>

<style scoped lang="scss">
.miao-directory-container-items {
    width: 100%;
    flex: 1;
    min-height: 0;
}
</style>
