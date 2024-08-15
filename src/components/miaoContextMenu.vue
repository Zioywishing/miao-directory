<!-- 基于naiveui的下拉菜单实现的自定义下拉菜单 -->
<!-- 支持长按和右键呼出下拉菜单 -->
<template>
    <div class="main" @contextmenu="handleContextMenu" @mouseleave="handleMainMouseLeave" @touchstart="handleTouchStart"
     @touchend="handleTouchEnd">
        <slot></slot>
    </div>
    <n-dropdown placement="bottom-start" trigger="manual" :x="x" :y="y" :options="props.options"
        :show="showContextMenu > 0" :on-clickoutside="onClickoutside" @select="handleSelect" @mouseleave="
            showContextMenu -= 1" @mouseenter="showContextMenu += 1" />
</template>

<script setup lang="ts">
import { NDropdown } from 'naive-ui/es/dropdown';
import { DropdownOption } from 'naive-ui/es/dropdown';
import { nextTick, ref } from 'vue';

const props = defineProps<{
    options: DropdownOption[]
    // 长按呼出右键菜单的时延，undefined时不生效
    touchTimeOut?: number
}>()
const emit = defineEmits<{
    select: [key: string]
}>()

const x = ref(0)
const y = ref(0)
const showContextMenu = ref(0)
// 长按计时器
let timer_touch: string | number | NodeJS.Timeout | undefined

const onClickoutside = async () => {
    showContextMenu.value = 0
}

const handleMainMouseLeave = async () => {
    setTimeout(() => {
        showContextMenu.value -= 1
    }, 100)
    // nextTick(()=>{
    //     showContextMenu.value -= 1
    // })
}

const handleSelect = async (key: string) => {
    emit('select', key)
}

const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    showContextMenu.value = 0
    nextTick().then(() => {
        showContextMenu.value += 1
        x.value = e.clientX
        y.value = e.clientY
    })
}

const handleTouchStart = (e: TouchEvent) => {
    if(props.touchTimeOut === undefined) {
        return 
    }
    timer_touch ?? clearTimeout(timer_touch)
    timer_touch = setTimeout(() => {
        showContextMenu.value = 1
        x.value = e.targetTouches[0].clientX
        y.value = e.targetTouches[0].clientY
    }, props.touchTimeOut)
}

const handleTouchEnd = () => {
    if(timer_touch) {
        clearTimeout(timer_touch)
        timer_touch = undefined
    }

}

</script>

<style>
.main {
    width: 100%;
    height: 100%;
    position: relative;
}
</style>