<template>
    <div class="miao-markdown-container-miaomiaomiao">
        <iframe
            ref="iframeRef"
            :src="iframeSrc"
            frameborder="0"
            class="iframe-container-iframe"></iframe>
    </div>
</template>

<script setup lang="ts">
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { cloneDeep } from 'lodash';
import { inject, onMounted, ref } from 'vue'
import buildFromTree from '../../hooks/buildFromTree';

const root = inject('rootDirectory') as VirtualDirectory
const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const iframeSrc = ref<string>()
const iframeRef = ref<HTMLIFrameElement>();

const sendRootTree = () => {
    iframeRef.value?.contentWindow && iframeRef.value.contentWindow.postMessage(cloneDeep(root.tree), "*");
}

const handleIframeMessage = (e: MessageEvent<any>) => {
    // const data = e.data;
    sendRootTree()
}
onMounted(() => {
    iframeSrc.value = currentFiles.value[0].url
    if (typeof window.addEventListener != "undefined") {
      window.addEventListener("message", handleIframeMessage, false);
    }
    console.log(buildFromTree(cloneDeep(root.tree)))
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
