<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <miao-alert-tip-provider ref="miaoMessageRef">
            <div class="miaoMusic-container">
                <miao-music-main
                    v-if="ap"
                    :ap="ap"
                    v-model:data="data"
                    :updateLocalData="updateLocalData"
                    @new-collection="saveCurrPlayList"></miao-music-main>
                <miao-mask
                    :show="isAPlayerListShow"
                    style="z-index: 5"
                    @click="() => ap?.list.hide()"></miao-mask>
                <div ref="aplayer" style="z-index: 10" />
                <miao-mask
                    :show="isSavingCollection"
                    @click="isSavingCollection = false"></miao-mask>
            </div>
        </miao-alert-tip-provider>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import useAplayerMiao from './hooks/aplayerMiao'
import { VirtualFile } from '@/class/VirtualDirectory'
import {
    App,
    onBeforeMount,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    toRaw,
    watch
} from 'vue'
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
import collectionType from './types/collection'
import cloneDeep from 'lodash/cloneDeep'
import localForage from 'localforage'

const pluginCenter = usePluginCenter()
let ap = ref<apType>()
let vueApp: App<Element>

const miaoMessageRef = ref<InstanceType<typeof miaoAlertTipProvider>>()
const aplayer = ref<any>(null)
const isAPlayerListShow = ref(true)
const isSavingCollection = ref(false)

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const props = defineProps<{
    view: VirtualPage
}>()

const data = ref<collectionType[]>([])

watch(
    data,
    () => {
        updateLocalData()
    },
    {
        deep: true
    }
)

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

const saveCurrPlayList = () => {
    if (ap.value) {
        data.value.unshift({
            id: Math.random(),
            name: `新建歌单-${new Date()}`,
            intro: 'none',
            createTime: new Date(),
            coverUrl: '',
            audios: cloneDeep(ap.value.list.audios)
        })
        miaoMessageRef.value?.alertTip('已创建新的歌单', {
            timeout: 1000,
            type: 'success'
        })
    }
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
        },
        onSaveCollection: saveCurrPlayList
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

const updateLocalData = () => {
    // console.log('updateLocalData', toRaw(data.value))
    localForage.setItem('miaoMusic-storage-musicCollections', toRaw(data.value))
}
const getLocalData = async () => {
    data.value =
        (await localForage.getItem('miaoMusic-storage-musicCollections')) ?? []
}
onBeforeMount(async () => {
    await getLocalData()
})
onMounted(async () => {
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
