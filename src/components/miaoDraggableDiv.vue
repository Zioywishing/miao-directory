<template>
    <div ref="divRef" @dragstart="onDs" :draggable="isDraggable">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import Sortable from 'sortablejs'
const props = defineProps<{
    isDraggable: boolean
}>()

const emit = defineEmits<{
    onDragStart: [e: DragEvent]
}>()

const divRef = ref<HTMLDivElement>()

const onDs = (e: DragEvent) => {
    emit('onDragStart', e)
}

onMounted(() => {
    divRef?.value?.addEventListener('dragstart', function (ev) {
        var img = new Image();
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath /%3E%3C/svg%3E";
        ev?.dataTransfer?.setDragImage(img, 0, 0);
    })
})
</script>

<style scoped></style>