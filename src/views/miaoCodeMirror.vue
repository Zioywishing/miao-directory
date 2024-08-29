<template>
    <div class="codemirror-container" ref="rootRef">
        <button @click="handleSave">保存</button>
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

let vFile: VirtualFile
const rootRef = ref<HTMLDivElement>()

const codeData = ref<string>()
// 第一次点击保存时自动备份data，暂时懒得做
const bakData = ref<string>()
const extensions = ref<unknown[]>([])

const handleSave = async () => {
    if (bakData.value === codeData.value) {
        return
    }
    const parentDir = vFile.parent
    const file_bak = new File(
        [new Blob([bakData.value ?? ''])],
        `${vFile.name}.bak`
    )
    const file = new File([new Blob([codeData.value ?? ''])], vFile.name)
    bakData.value = codeData.value
    miaoFetchApi.upload(file, parentDir)
    false && miaoFetchApi.upload(file_bak, parentDir)
}

const setExtensions = async (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLocaleLowerCase()
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            const { javascript } = await import('@codemirror/lang-javascript')
            extensions.value = [javascript()]
            break
        case 'css':
        case 'scss':
            const { sass } = await import('@codemirror/lang-sass')
            extensions.value = [sass()]
            break
        case 'html':
            const { html } = await import('@codemirror/lang-html')
            extensions.value = [html()]
            break
        case 'py':
            const { python } = await import('@codemirror/lang-python')
            extensions.value = [python()]
            break
        case 'go':
            const { go } = await import('@codemirror/lang-go')
            extensions.value = [go()]
            break
        case 'json':
            const { json } = await import('@codemirror/lang-json')
            extensions.value = [json()]
            break
        case 'md':
            const { markdown } = await import('@codemirror/lang-markdown')
            extensions.value = [markdown()]
            break
        case 'yaml':
            const { yaml } = await import('@codemirror/lang-yaml')
            extensions.value = [yaml()]
            break
        case 'vue':
            const { vue } = await import('@codemirror/lang-vue')
            extensions.value = [vue()]
            break
        case 'xml':
            const { xml } = await import('@codemirror/lang-xml')
            extensions.value = [xml()]
            break
        default:
            extensions.value = []
    }
}

onMounted(async () => {
    vFile = currentFiles.value[0]
    const fileName = currentFiles.value[0].name
    codeData.value = (
        await miaoFetchApi.getFile(currentFiles.value[0], {
            axiosOption: { responseType: 'text' }
        })
    ).toString()
    bakData.value = codeData.value
    await setExtensions(fileName)
    rootRef.value?.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault()
            handleSave()
        }
    })
})
</script>

<style scoped lang="scss">
.codemirror-container {
    width: 100%;
    height: 100%;
}
</style>
