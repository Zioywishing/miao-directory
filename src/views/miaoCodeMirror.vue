<template>
    <div class="codemirror-container">
        <NScrollbar>
            <codemirror v-model="codeData" :extensions="extensions" />
        </NScrollbar>
    </div>
</template>

<script setup lang="ts">
import { VirtualFile } from '@/class/VirtualDirectory'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import { onMounted, ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { NScrollbar } from 'naive-ui'

const miaoFetchApi = useMiaoFetchApi()

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const codeData = ref<string>()
const extensions = ref<any[]>([])

const setExtensions = async (fileName: string) => {
    const ext = fileName.split('.').pop()
    switch (ext) {
        case 'js':
        case 'ts':
            const { javascript } = await import('@codemirror/lang-javascript')
            extensions.value = [javascript()]
            break
        case 'css':
        case 'scss':
            const { css } = await import('@codemirror/lang-css')
            extensions.value = [css()]
            break
        case 'html':
            const { html } = await import('@codemirror/lang-html')
            extensions.value = [html()]
            break
        case 'py':
            const { python } = await import('@codemirror/lang-python')
            extensions.value = [python()]
            break
        default:
            extensions.value = []
    }
}

onMounted(async () => {
    const fileName = currentFiles.value[0].name
    codeData.value = (await miaoFetchApi.getFile(currentFiles.value[0])).toString()
    await setExtensions(fileName)
})
</script>

<style scoped lang="scss">
.codemirror-container {
    width: 100%;
    height: 100%;
}
</style>
