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
import { onBeforeUnmount, onMounted, ref } from 'vue';
// import useViretualPages from '@/hooks/useVirtualPages';
import XGPlayer from 'xgplayer'
import '@/style/xgplayer.scss'
import TextTrack from 'xgplayer/es/plugins/track'
import 'xgplayer/es/plugins/track/index.css'
import axios from 'axios';
import config from '@/config';


// const props = defineProps<{
//     id: number
// }>()
const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

// const views = useViretualPages()
// const view = views.getView(props.id)

// const videoPath = ref<string>('');
const xgPlayer = ref()

let _player: XGPlayer
const { setVideo } = (() => {
    return {
        setVideo: async (videoVFile: VirtualFile, vttVFiles?: VirtualFile[]) => {
            _player && _player.destroy()
            const _list = []
            if (vttVFiles) {
                for (let i of vttVFiles) {
                    if (i.name.endsWith('srt')) {
                        const response = await axios.get(i.url)
                        console.log(srtToVtt(response.data))
                        const url = setUrl(new Blob([srtToVtt(response.data)]))
                        _list.push({
                            id: i.name,
                            url,
                            language: 'zh-cn',
                            text: i.name,
                            default: i === vttVFiles[0]
                        })
                    } else {
                        _list.push({
                            id: i.name,
                            url: i.url,
                            language: 'zh-cn',
                            text: i.name,
                            default: i === vttVFiles[0]
                        })
                    }
                }
            }
            const texttrack = {
                list: _list
            }
            _player = new XGPlayer({
                plugins: [TextTrack],
                el: xgPlayer.value,
                url: videoVFile.url,
                width: '100%',
                height: '100%',
                volume: 1,
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
                },
                texttrack,
            })
        }
    }
})()

const { setUrl, destroyUrl } = (() => {
    const urlList: string[] = []
    return {
        setUrl(blob: Blob) {
            const url = URL.createObjectURL(blob)
            urlList.push(url)
            return url
        },
        destroyUrl() {
            for (const url of urlList) {
                URL.revokeObjectURL(url)
            }
        }
    }
})()

const handleDropVFiles = (files: VirtualFile[]) => {
    setVideo(findVideo(files), findTextTrack(files))
};

function srtToVtt(srt: string) {
    // 将 SRT 字幕按行分割
    const lines = srt.split('\n');
    let vtt = 'WEBVTT\n\n'; // VTT 文件的开头

    let index = 0;
    while (index < lines.length) {
        // 跳过空行
        if (lines[index].trim() === '') {
            index++;
            continue;
        }

        // SRT 中的序号
        const sequenceNumber = lines[index].trim();
        index++;

        // 时间戳
        const timeLine = lines[index].trim().replace(/,/g, '.'); // 将逗号替换为点
        index++;

        // 字幕文本
        let text = '';
        while (index < lines.length && lines[index].trim() !== '') {
            text += lines[index].trim() + '\n';
            index++;
        }

        // 添加到 VTT 字幕中
        vtt += `${timeLine}\n${text.trim()}\n\n`;
    }

    return vtt;
}


const findVideo = (vFiles: VirtualFile[]) => vFiles.filter(v => {
    for (let s of ['mp4', 'm3u8', 'hls']) {
        if (v.name.endsWith(s)) {
            return true
        }
    }
    return false
})[0]

const findTextTrack = (vFiles: VirtualFile[]) => vFiles.filter(v => {
    for (let s of ['vtt', 'srt']) {
        if (v.name.endsWith(s)) {
            return true
        }
    }
    return false
})

onMounted(() => {
    if (currentFiles.value.length) {
        setVideo(findVideo(currentFiles.value), findTextTrack(currentFiles.value))
    }
});

onBeforeUnmount(() => {
    _player.destroy()
    destroyUrl()
})
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
