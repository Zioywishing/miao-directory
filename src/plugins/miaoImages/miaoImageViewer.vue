<template>
  <miao-mask :show="show" @click="$emit('close')" class="miaoImage-mask" @wheel="handleWheel">
    <ChevronBack class="miaoImage-mask-btn miaoImage-mask-btn-back" @click.stop="$emit('back')" />
    <MiaoDraggableDiv
      v-if="file"
      :is-draggable="isDraggable"
      :bind-virtual-files="[file]"
      @dragend="handleDragEnd"
      @pointerdown="handlePressStart"
      @pointerup="handlePressEnd"
      @pointercancel="handlePressEnd"
      @pointerleave="handlePressEnd"
      @touchstart.passive="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <img :src="file.url" class="miaoImage-mask-active" @click="(e) => e.stopPropagation()" draggable="false" :style="{ transform: `scale(${imgViewScale})` }" />
    </MiaoDraggableDiv>
    <ChevronForward class="miaoImage-mask-btn miaoImage-mask-btn-forward" @click.stop="$emit('forward')" />
  </miao-mask>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import miaoMask from '@/components/miaoMask.vue'
import MiaoDraggableDiv from '@/components/miaoDraggableDiv.vue'
import { ChevronBack, ChevronForward } from '@vicons/ionicons5'
import type { VirtualFile } from '@/class/VirtualDirectory'

const props = defineProps<{
  show: boolean
  file?: VirtualFile
}>()

const imgViewScale = ref(1)
const isDraggable = ref(false)
let pressTimer: number | undefined

const clearPress = () => {
  if (pressTimer !== undefined) {
    clearTimeout(pressTimer)
    pressTimer = undefined
  }
}

const handlePressStart = () => {
  clearPress()
  pressTimer = window.setTimeout(() => {
    isDraggable.value = true
  }, 100)
}

const handlePressEnd = () => {
  clearPress()
  // 延迟复位，避免影响 drop
  setTimeout(() => {
    isDraggable.value = false
  }, 0)
}

const handleTouchStart = () => handlePressStart()
const handleTouchEnd = () => handlePressEnd()

const handleDragEnd = () => {
  isDraggable.value = false
}

const handleWheel = (e: WheelEvent) => {
  if (e.deltaY < 0) {
    imgViewScale.value *= 1.42857
  } else {
    imgViewScale.value /= 1.42857
  }
}

watch(
  () => props.file,
  () => {
    imgViewScale.value = 1
    isDraggable.value = false
    clearPress()
  }
)

watch(
  () => props.show,
  (v) => {
    if (!v) {
      imgViewScale.value = 1
      isDraggable.value = false
      clearPress()
    }
  }
)
</script>

<style scoped lang="scss">
.miaoImage-mask {
  background-color: rgba(0, 0, 0, 0.444);
  overflow: hidden;
}

.miaoImage-mask-active {
  max-width: 80%;
  max-height: 80%;
  user-select: none;
}

.miaoImage-mask-btn {
  color: #ffffff99;
  width: 7%;
  position: absolute;
  cursor: pointer;
  z-index: 9999;

  &-back {
    left: 1%;
  }

  &-forward {
    right: 1%;
  }
}
</style>