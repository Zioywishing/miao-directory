<template>
    <div
        class="codemirror-container"
        ref="rootRef"
        :class="`codemirror-container-${theme}`">
        <div class="codemirror-container-top">
            <button @click="handleSave">保存</button>
            <button @click="switchTheme">切换主题</button>
        </div>
        <!-- <NScrollbar :key="_key"> -->
            <codemirror
                v-model="codeData"
                :extensions="extensions"
                :style="{ height: '100%' }" />
        <!-- </NScrollbar> -->
    </div>
</template>

<script setup lang="ts">
import { VirtualFile } from '@/class/VirtualDirectory'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import { onMounted, ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { NScrollbar } from 'naive-ui'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'

const miaoFetchApi = useMiaoFetchApi()

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const vFile = ref<VirtualFile>()
const rootRef = ref<HTMLDivElement>()
const _key = ref(Math.random())
const codeData = ref<string>()
// 第一次点击保存时自动备份data，暂时懒得做
const bakData = ref<string>()
const extensions = ref<any[]>([])
const theme = ref<'light' | 'dark'>('light')

const handleSave = async () => {
    if (bakData.value === codeData.value || !vFile.value) {
        return
    }
    const parentDir = vFile.value?.parent
    const file_bak = new File(
        [new Blob([bakData.value ?? ''])],
        `${vFile.value?.name}.bak`
    )
    const file = new File([new Blob([codeData.value ?? ''])], vFile.value.name)
    bakData.value = codeData.value
    miaoFetchApi.upload(file, parentDir)
    false && miaoFetchApi.upload(file_bak, parentDir)
}

const switchTheme = async () => {
    if (!vFile.value) {
        return
    }
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    extensions.value = [
        ...(await getLangExtensions(vFile.value?.name)),
        theme.value === 'dark' ? vscodeDark : vscodeLight
    ]
    _key.value = Math.random()
}

const getLangExtensions = async (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLocaleLowerCase()
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            const { javascript } = await import('@codemirror/lang-javascript')
            return [javascript()]
            break
        case 'css':
        case 'scss':
            const { sass } = await import('@codemirror/lang-sass')
            return [sass()]
            break
        case 'html':
            const { html } = await import('@codemirror/lang-html')
            return [html()]
            break
        case 'py':
            const { python } = await import('@codemirror/lang-python')
            return [python()]
            break
        case 'go':
            const { go } = await import('@codemirror/lang-go')
            return [go()]
            break
        case 'json':
            const { json } = await import('@codemirror/lang-json')
            return [json()]
            break
        case 'md':
            const { markdown } = await import('@codemirror/lang-markdown')
            return [markdown()]
            break
        case 'yaml':
            const { yaml } = await import('@codemirror/lang-yaml')
            return [yaml()]
            break
        case 'vue':
            const { vue } = await import('@codemirror/lang-vue')
            return [vue()]
            break
        case 'xml':
            const { xml } = await import('@codemirror/lang-xml')
            return [xml()]
            break
        default:
            return []
    }
}

onMounted(async () => {
    vFile.value = currentFiles.value[0]
    const fileName = currentFiles.value[0].name
    codeData.value = (
        await miaoFetchApi.getFile(currentFiles.value[0], {
            axiosOption: { responseType: 'text' }
        })
    ).toString()
    bakData.value = codeData.value
    extensions.value = [...(await getLangExtensions(fileName)), vscodeLight]

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
    &-top {
        background-color: aqua;
    }
}
.codemirror-container-dark {
    background-color: rgb(30, 30, 30);
}
.codemirror-container-light {
    background-color: rgb(255, 255, 255);
}
</style>
