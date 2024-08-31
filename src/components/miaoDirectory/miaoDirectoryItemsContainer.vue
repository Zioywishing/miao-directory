<template>
    <div class="miao-directory-container-items" :style="{
        backgroundColor:
            index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
    }">
        <n-scrollbar ref="scrollbarRef" style="max-height: 100%;">
            <miao-lazy-div v-for="(dir, index) in showData_directory" :key="dir.uid" min-height="50px">
                <miaoDirectoryItem :item="dir" :color="props.color" :selectedItem="selectedItem"
                    @delete="handleItemDelete(dir)" @click="handleItemClick(dir)" @drag-start="handleItemDragStart"
                    @rename="handleItemRename(dir)" @on-selected="handleItemSelect(dir)" />
            </miao-lazy-div>
            <miao-lazy-div v-for="(file) in showData_files" :key="file.uid" min-height="50px">
                <miaoDirectoryItem :item="file" :color="props.color" :selectedItem="selectedItem"
                    @click="handleItemClick(file)" @download="handleItemDownload(file)" @delete="handleItemDelete(file)"
                    @drag-start="handleItemDragStart" @rename="handleItemRename(file)"
                    @on-selected="handleItemSelect(file)" />
            </miao-lazy-div>
        </n-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import miaoDirectoryItem from '@/components/miaoDirectory/miaoDirectoryItem.vue'
import miaoLazyDiv from '@/components/miaoLazyDiv.vue'
import { ref } from 'vue';

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

defineExpose({ scrollTo: (...args: any) => scrollbarRef.value.scrollTo(...args) });

const handleItemClick = (item: VirtualDirectory | VirtualFile) => {
    emit('item-click', item)
}

const handleItemDownload = (item: VirtualFile) => {
    emit('item-download', item)
}

const handleItemDelete = (item: VirtualDirectory | VirtualFile) => {
    emit('item-delete', item)
}

const handleItemDragStart = (_event: DragEvent, item: VirtualDirectory | VirtualFile) => {
    emit('item-drag-start', _event, item)
}

const handleItemRename = (item: VirtualDirectory | VirtualFile) => {
    emit('item-rename', item)
}

const handleItemSelect = (item: VirtualDirectory | VirtualFile) => {
    emit('item-select', item)
}
</script>

<style scoped lang="scss">
.miao-directory-container-items {
    width: 100%;
    flex: 1;
    min-height: 0;
}
</style>