<template>
   <div ref="divRef" @dragstart="onDs" :draggable="isDraggable ?? true">
      <slot></slot>
   </div>
</template>

<script setup lang="ts">
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory';
import useDataBus from '@/hooks/useDataBus';
import { onMounted, ref } from 'vue'
// import Sortable from 'sortablejs'

const props = defineProps<{
   isDraggable?: boolean,
   bindVirtualFiles?: VirtualFile[],
   bindVirtualDirectories?: VirtualDirectory[],
}>()
const emit = defineEmits<{
   onDragStart: [e: DragEvent]
}>()

const divRef = ref<HTMLDivElement>()

const onDs = (e: DragEvent) => {
   emit('onDragStart', e)
   const dataBus = useDataBus()
   props.bindVirtualFiles && dataBus.set(
      'dragData_vFiles',
      props.bindVirtualFiles
   )
   props.bindVirtualDirectories && dataBus.set(
      'dragData_vDirectory',
      props.bindVirtualDirectories
   )
}

onMounted(() => {
   divRef?.value?.addEventListener('dragstart', function (ev) {
      var img = new Image()
      img.src =
         "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath /%3E%3C/svg%3E"
      ev?.dataTransfer?.setDragImage(img, 0, 0)
   })
})
</script>

<style scoped></style>
