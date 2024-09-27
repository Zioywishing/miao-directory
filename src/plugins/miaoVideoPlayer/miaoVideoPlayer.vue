<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <div class="player-container">
            <div ref="xgPlayer" id="xgplayer"></div>
        </div>
    </miao-drop-handler>
</template>

<script lang="ts" setup>
import { VirtualFile } from '@/class/VirtualDirectory'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import XGPlayer from 'xgplayer'
import '@/style/xgplayer.scss'
import TextTrack from 'xgplayer/es/plugins/track'
import 'xgplayer/es/plugins/track/index.css'
import axios from 'axios'
import uniq from 'lodash/uniq'
import lockScreen from './playerPlugin/lockScreen/lockScreen'
import xgplayerVueApp from './src/XGPlayerVuePluginRoot.vue'
import useXGPlayerVueFrame from './playerPlugin/xgplayer-vue-frame/xgplayer-vue-frame'


const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})
const xgPlayer = ref()

let _player: XGPlayer
const { setVideo } = (() => {
    const initPlayer = (videos: VirtualFile[], texttrack: {
        list: {
            id: number; url: string
            text: string
        }[]
    }) => {
        const videoVFile = videos.shift() as VirtualFile
        _player && _player.destroy()
        _player = new XGPlayer({
            plugins: [
                TextTrack,
                lockScreen,
                useXGPlayerVueFrame(xgplayerVueApp),
            ],
            el: xgPlayer.value,
            url: videoVFile.url,
            width: '100%',
            height: '100%',
            volume: 1,
            // loop: true,
            // pip: true,
            videoFillMode: 'contain',
            autoplay: true,
            download: true,
            screenShot: {
                saveImg: true,
                quality: 1,
                type: 'image/png',
                format: '.png'
            },
            lang: 'zh-cn',
            playbackRate: [0.1, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10],
            playNext: {
                urlList: videos.map(v => v.url)
            },
            texttrack,
            ignores: [videos.length === 0 ? 'playNext' : undefined].filter(v => v) as string[]
        })
    }
    return {
        setVideo: async (
            videoVFiles: VirtualFile[],
            textTrackFiles?: VirtualFile[]
        ) => {
            // 天哪什么精神状态会写出这种代码
            textTrackFiles &&
                textTrackFiles.push(...findTextTrack(currentFiles.value))
            textTrackFiles = uniq(textTrackFiles)
            currentFiles.value = uniq([...currentFiles.value, ...videoVFiles, ...(textTrackFiles ?? [])])
            const videos = findVideo(uniq([...currentFiles.value, ...videoVFiles]))
            const _list = []
            if (textTrackFiles) {
                for (let i of textTrackFiles) {
                    if (i.name.endsWith('srt')) {
                        const response = await axios.get(i.url)
                        // console.log(srtToVtt(response.data))
                        const url = setUrl(new Blob([srtToVtt(response.data)]))
                        _list.push({
                            id: i.id,
                            url,
                            // 这个language会覆盖id的设置，导致无法切换字幕
                            // language: 'zh-cn',
                            text: i.name
                        })
                    } else if (i.name.endsWith('ass')) {
                        const response = await axios.get(i.url)
                        // console.log(assToVtt(response.data))
                        const url = setUrl(new Blob([assToVtt(response.data)]))
                        _list.push({
                            id: i.id,
                            url,
                            text: i.name
                        })
                    } else if (i.name.endsWith('ssa')) {
                        const response = await axios.get(i.url)
                        // console.log(ssaToVtt(response.data))
                        const url = setUrl(new Blob([ssaToVtt(response.data)]))
                        _list.push({
                            id: i.id,
                            url,
                            text: i.name
                        })
                    } else {
                        _list.push({
                            id: i.id,
                            url: i.url,
                            text: i.name
                        })
                    }
                }
            }
            const texttrack = {
                list: _list
            }
            initPlayer([...videos], texttrack)
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
    setVideo(findVideo(files.reverse()), findTextTrack(files))
}

function srtToVtt(srt: string) {
    // 将 SRT 字幕按行分割
    const lines = srt.split('\n')
    let vtt = 'WEBVTT\n\n' // VTT 文件的开头

    let index = 0
    while (index < lines.length) {
        // 跳过空行
        if (lines[index].trim() === '') {
            index++
            continue
        }

        // SRT 中的序号
        lines[index].trim()
        index++

        // 时间戳
        const timeLine = lines[index].trim().replace(/,/g, '.') // 将逗号替换为点
        index++

        // 字幕文本
        let text = ''
        while (index < lines.length && lines[index].trim() !== '') {
            text += lines[index].trim() + '\n'
            index++
        }

        // 添加到 VTT 字幕中
        vtt += `${timeLine}\n${text.trim()}\n\n`
    }

    return vtt
}

function assToVtt(assContent: string) {
    // 分割 ASS 内容为行
    const lines = assContent.split('\n')
    let vttContent = 'WEBVTT\n\n' // VTT 文件头

    // 遍历每一行，寻找字幕条目
    for (let line of lines) {
        // 只处理 [Events] 部分后的 Dialogue 行
        if (line.startsWith('Dialogue:')) {
            // 提取时间戳和文本
            const parts = line.split(',')
            if (parts.length >= 5) {
                // 将时间戳格式化为 VTT 格式
                const startTime = parts[1]
                    .trim()
                    .replace('.', ',')
                    .replace(',', '.') // 替换 . 为 ,，然后再替换为 .
                const endTime = parts[2]
                    .trim()
                    .replace('.', ',')
                    .replace(',', '.') // 替换 . 为 ,，然后再替换为 .

                // 确保时间戳是两位数格式
                const formattedStartTime = startTime.replace(
                    /(\d+):(\d+):(\d+)\.(\d+)/,
                    (match: any, h: any, m: any, s: any, ms: any) => {
                        match
                        return `${String(h).padStart(2, '0')}:${String(
                            m
                        ).padStart(2, '0')}:${String(s).padStart(
                            2,
                            '0'
                        )}.${String(ms).padStart(3, '0')}`
                    }
                )

                const formattedEndTime = endTime.replace(
                    /(\d+):(\d+):(\d+)\.(\d+)/,
                    (match: any, h: any, m: any, s: any, ms: any) => {
                        match
                        return `${String(h).padStart(2, '0')}:${String(
                            m
                        ).padStart(2, '0')}:${String(s).padStart(
                            2,
                            '0'
                        )}.${String(ms).padStart(3, '0')}`
                    }
                )

                const rawText = parts.slice(9).join(',').trim() // 提取文本

                // 清理文本中的样式信息
                const cleanText = rawText
                    .replace(/{[^}]*}/g, '')
                    .replace(/\\N/g, '\n')
                    .trim()

                // 添加到 VTT 内容
                vttContent += `${formattedStartTime} --> ${formattedEndTime}\n${cleanText}\n\n`
            }
        }
    }

    return vttContent.trim() // 返回 VTT 内容，去掉末尾空行
}

function ssaToVtt(ssaContent: string): string {
    function convertSsaTimeToVtt(ssaTime: string): string {
        const timeParts = ssaTime.split(':')
        const hours = timeParts[0].padStart(2, '0')
        const minutes = timeParts[1].padStart(2, '0')
        const secondsAndMilliseconds = timeParts[2].split('.')
        const seconds = secondsAndMilliseconds[0].padStart(2, '0')
        const milliseconds = (secondsAndMilliseconds[1] || '0').padEnd(3, '0')

        return `${hours}:${minutes}:${seconds}.${milliseconds}`
    }
    const lines = ssaContent.split('\n')
    let vttContent = 'WEBVTT\n\n' // VTT文件头
    let inEvents = false

    for (const line of lines) {
        // 检查是否进入[Events]部分
        if (line.startsWith('[Events]')) {
            inEvents = true
            continue
        }

        // 如果在[Events]部分，处理对话行
        if (inEvents && line.startsWith('Dialogue:')) {
            const parts = line.split(',')
            if (parts.length >= 3) {
                const startTime = convertSsaTimeToVtt(parts[1].trim())
                const endTime = convertSsaTimeToVtt(parts[2].trim())
                const text = parts.slice(9).join(',').trim() // 获取字幕文本

                // 去除样式标签
                const cleanText = text.replace(/{[^}]*}/g, '').trim()

                // 添加到VTT内容
                vttContent += `${startTime} --> ${endTime}\n${cleanText}\n\n`
            }
        }
    }

    return vttContent
}

const findVideo = (vFiles: VirtualFile[]) =>
    uniq(vFiles.filter((v) => {
        for (let s of ['mp4', 'mp3']) {
            if (v.name.endsWith(s)) {
                return true
            }
        }
        return false
    }))

const findTextTrack = (vFiles: VirtualFile[]) =>
    vFiles.filter((v) => {
        for (let s of ['vtt', 'srt', 'ass', 'ssa']) {
            if (v.name.endsWith(s)) {
                return true
            }
        }
        return false
    })

onMounted(() => {
    if (currentFiles.value.length) {
        currentFiles.value.reverse()
        setVideo(
            findVideo(currentFiles.value),
            findTextTrack(currentFiles.value)
        )
    }
})

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
        // height: 500px;
        background-color: black;
    }
}

.video-js {
    width: 100%;
    background-color: rgb(0, 0, 0);
}
</style>
