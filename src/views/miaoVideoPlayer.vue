<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <div class="player-container">
            <div ref="xgPlayer" id="xgplayer">
            </div>
        </div>
    </miao-drop-handler>
</template>

<script lang="ts" setup>
import { VirtualFile } from '@/class/VirtualDirectory';
import miaoDropHandler from '@/components/miaoDropHandler.vue';
import { onMounted, ref } from 'vue';
import useViretualPages from '@/hooks/useVirtualPages';
import XGPlayer from 'xgplayer'
import '@/style/xgplayer.scss'


const props = defineProps<{
    id: number
}>()
const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const views = useViretualPages()
const view = views.getView(props.id)

const videoPath = ref<string>('');
const xgPlayer = ref()

const setVideo = (() => {
    let player: any
    return (url: string) => {
        if (player) {
            player.src = url
        } else {
            player = new XGPlayer({
                el: xgPlayer.value,
                url,
                width: '100%',
                height: '100%',
                fluid: true,
                pip: true,
                videoFillMode: 'contain',
                autoplay: true,
                download: true,
                screenShot: {
                    saveImg: true,
                    quality: 0.92,
                    type: 'image/png',
                    format: '.png'
                },
                lang: 'zh-cn',
                playbackRate: [0.1, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10],
                playNext: {
                    urlList: [
                    ],
                }
            })
        }
    }
})()

const handleDropVFiles = (files: VirtualFile[]) => {
    console.log(files)
    view && (view.currentFiles[0] = files[0])
    videoPath.value = files[0].url;
    setVideo(videoPath.value)
};

onMounted(() => {
    if(currentFiles.value.length) {
        setVideo(currentFiles.value[0].url)
    }
});
</script>

<style scoped lang="scss">
.player-container {
    width: 100%;
    height: 100%;
    position: relative;
    background-color: grey;
    display: flex;
    flex-direction: column;
    justify-content: center;

    #xgplayer {
        width: 100%;
        height: 500px;
        background-color: black;
    }
}

.video-js {
    width: 100%;
    background-color: rgb(0, 0, 0);
}
</style>
