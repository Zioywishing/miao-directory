<template>
    <div class="miao-markdown-container-miaomiaomiao">
        <iframe
            :src="iframeSrc"
            frameborder="0"
            class="iframe-container-iframe"></iframe>
    </div>
</template>

<script setup lang="ts">
import { VirtualFile } from '@/class/VirtualDirectory'
import { onMounted, ref } from 'vue'

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const iframeSrc = ref<string>()

onMounted(() => {
    iframeSrc.value = currentFiles.value[0].url
})
</script>

<style scoped lang="scss">
.miao-markdown-container-miaomiaomiao {
    width: 100%;
    height: 100%;
    .iframe-container-iframe {
        width: inherit;
        height: inherit;
    }
}
</style>
