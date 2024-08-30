<template>
    <div class="miao-lazy" ref="miaoLazyRoot" :style="!show ? { minHeight, minWidth } : {}">
        <slot v-if="show" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    minHeight: {
        type: String,
        default: 'none',
    },
    minWidth: {
        type: String,
        default: 'none',
    }
})

const miaoLazyRoot = ref<HTMLDivElement>()

const show = ref<boolean>(props.show === true)

onMounted(() => {
    if (show.value === false) {
        let options = {
            root: null, // 默认为视窗
            rootMargin: '0px', // 视窗的外边距
            threshold: 0.1 // 目标元素可见比例达到 10% 时触发回调
        };

        let observer: IntersectionObserver | undefined = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                show.value = true
                // miaoLazyRoot.value && observer?.unobserve(miaoLazyRoot.value)
                // observer = undefined
            } else {
                show.value = false
            }
        }, options);
        miaoLazyRoot.value && observer.observe(miaoLazyRoot.value);
    }
})
</script>