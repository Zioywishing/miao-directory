<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <miao-alert-tip-provider ref="miaoMessageRef">
            <div class="miaoMusic-container">
                <NScrollbar>
                    <miao-music-main v-if="ap" :ap="ap"></miao-music-main>
                </NScrollbar>
                <miao-mask
                    :show="isAPlayerListShow"
                    style="z-index: 5"
                    @click="() => ap?.list.hide()"></miao-mask>
                <div ref="aplayer" style="z-index: 10" />
            </div>
        </miao-alert-tip-provider>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import useAplayerMiao from './hooks/aplayerMiao'
import { VirtualFile } from '@/class/VirtualDirectory'
import { App, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { NScrollbar } from 'naive-ui'
import './src/APlayer.fix.css'
// @ts-ignore
import APlayer from 'APlayer'
import config from '@/config'
import difference from 'lodash/difference'
import uniq from 'lodash/uniq'
import apType from './types/ap'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import miaoAlertTipProvider from '@/components/miaoAlertTipProvider.vue'
import usePluginCenter from '@/hooks/usePluginCenter'
import VirtualPage from '@/class/VirtualPage'
import miaoMask from '@/components/miaoMask.vue'
import miaoMusicMain from './src/main.vue'

const pluginCenter = usePluginCenter()
let ap = ref<apType>()
let vueApp: App<Element>

const miaoMessageRef = ref<InstanceType<typeof miaoAlertTipProvider>>()
const aplayer = ref<any>(null)
const isAPlayerListShow = ref(true)

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const props = defineProps<{
    view: VirtualPage
}>()

watch(
    () => currentFiles.value,
    (value, oldValue) => {
        const diff = difference(value, oldValue)
        if (diff.length > 0) {
            const _s = `等${diff.length}个资源`
            miaoMessageRef.value?.alertTip(
                `已添加 ${diff[0].name}${diff.length !== 1 ? _s : ''}`,
                {
                    type: 'success',
                    timeout: 3000
                }
            )
            ap?.value?.list.add(getMusicList(diff))
        }
    }
)

const getMusicList = (mp3VFiles: VirtualFile[]) =>
    mp3VFiles.map((v, index) => ({
        url: `${config.baseUrl}${v.url}`,
        name: v.name,
        artist: ' ',
        index
    }))

const handleDropVFiles = (files: VirtualFile[]) => {
    currentFiles.value = uniq([...currentFiles.value, ...files])
}

const initAPlayerMiao = () => {
    const aplayerOption = {
        container: aplayer.value,
        audio: getMusicList(currentFiles.value),
        autoplay: true,
        volume: 1,
        theme: '#60e8a2',
        listMaxHeight: '500px'
    }
    ap.value = reactive<apType>(new APlayer(aplayerOption))
    vueApp = useAplayerMiao(ap.value, {
        onDragItemStart: () => {},
        onDragItemEnd: () => {},
        onPlayVideo: (element) => {
            pluginCenter.usePlugin(
                'miaoVideoPlayer',
                [],
                [
                    currentFiles.value.find(
                        (v) => v.name === element.name
                    ) as VirtualFile
                ]
            )
        }
    })
    ap.value.on('listremove', (...args: any) => {
        const { index } = args[0] as { index: number }
        const _name = ap?.value?.list.audios[index].name
        currentFiles.value = currentFiles.value.filter((v) => v.name !== _name)
    })
    ap.value.on('play', () => {
        const name = ap.value?.list.audios[ap.value.list.index].name as string
        props.view.setTitle(name)
    })
    ap.value.on('listshow', () => {
        isAPlayerListShow.value = true
    })
    ap.value.on('listhide', () => {
        isAPlayerListShow.value = false
    })
}

onMounted(() => {
    currentFiles.value = [...currentFiles.value.reverse()]
    initAPlayerMiao()
})

onUnmounted(() => {
    vueApp.unmount()
    ap?.value?.destroy()
})
</script>

<style scoped lang="scss">
.miaoMusic-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>
<style lang="scss">
.aplayer {
    display: flex;
    flex-direction: column-reverse;
    position: absolute;
    bottom: 10px;
    width: -webkit-fill-available;
    .aplayer-icon-order,
    .aplayer-icon-loop {
        display: none !important;
    }
}
</style>
