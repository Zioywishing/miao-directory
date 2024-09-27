<!-- 只适合用于渲染过程较为复杂的组件，不然可能得不偿失
     这么泛用的组件，性能差点也能理解 -->
<template>
    <div class="miao-lazy" ref="miaoLazyRoot"
        :style="!show ? { minHeight: _autoHeight !== undefined ? _autoHeight : props.minHeight, minWidth, margin } : {}">
        <slot v-if="show" />
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
    // disable: {
    //     type: Boolean,
    //     default: false,
    // },
    disableLazy: {
        type: Boolean,
        default: false,
    },
    // 仅在内容未加载时生效，用于占位
    minHeight: {
        type: String,
        default: 'none',
    },
    minWidth: {
        type: String,
        default: 'none',
    },
    margin: {
        type: String,
        default: 'none',
    },
    autoHeight: {
        type: Boolean,
        default: false
    }
})

const miaoLazyRoot = ref<HTMLDivElement>()

const _autoHeight = ref<string>()

const show = ref<boolean>(props.disableLazy)

const isVisible = (dom: HTMLDivElement) => {
    const offset = dom.getBoundingClientRect().top
    return offset > 0 && offset < 2000
}

const { showSlot, hideSlot, clearTimer } = (() => {
    let timer: any
    let timerInterval: any
    const clearTimer = () => {
        timer && clearTimeout(timer)
        timerInterval && clearInterval(timerInterval)
        timer = undefined
        timerInterval = undefined
    }
    const hideSlot = () => {
        clearTimer()
        if (props.autoHeight) {
            _autoHeight.value = `${miaoLazyRoot.value?.clientHeight}px`
        }
        show.value = false
    }
    const showSlot = () => {
        if (show.value === true) {
            return
        }
        clearTimer()
        // timer = setTimeout(() => {
        if (!miaoLazyRoot.value || isVisible(miaoLazyRoot.value) === false) {
            return
        }
        show.value = true
        timerInterval = setInterval(() => {
            if (show.value === false || miaoLazyRoot.value === undefined) {
                return
            }
            if (isVisible(miaoLazyRoot.value) === false) {
                hideSlot()
            }
        }, 1000)
        // if (props.autoHeight) {
        //     nextTick(() => {
        //         console.log(miaoLazyRoot.value?.clientHeight)
        //         _autoHeight.value = `${miaoLazyRoot.value?.clientHeight}px`
        //     })
        // }
    }
    return { showSlot, hideSlot, clearTimer }
})()

onMounted(() => {
    if (show.value === false) {
        let options = {
            threshold: 0
        };

        let observer: IntersectionObserver | undefined = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                showSlot()
                // miaoLazyRoot.value && observer?.unobserve(miaoLazyRoot.value)
                // observer = undefined
            } else {
                hideSlot()
            }
        }, options);
        miaoLazyRoot.value && observer.observe(miaoLazyRoot.value);
    }
})

onBeforeUnmount(() => {
    clearTimer()
})
</script>