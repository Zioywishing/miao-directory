<template>
    <div ref="divRef" @dragstart="onDs" :draggable="true">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
// import Sortable from 'sortablejs'

const emit = defineEmits<{
    onDragStart: [e: DragEvent]
}>()

const divRef = ref<HTMLDivElement>()

const onDs = (e: DragEvent) => {
    emit('onDragStart', e)
}

onMounted(() => {
})
</script>

<style scoped></style>