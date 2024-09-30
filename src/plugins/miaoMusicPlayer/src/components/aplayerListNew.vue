<template>
    <div class="aplayer-list-top">
        <div @click="loopModeToggle" class="aplayer-list-top-loopMode">
            <component
                :is="loopModeMap[loopMode].icon"
                class="aplayer-list-top-loopMode-icon"></component>
            <span class="aplayer-list-top-loopMode-name">
                {{ loopModeMap[loopMode].name }}
            </span>
        </div>
        <div class="aplayer-list-top-buttons">
            <AddCircleOutline
                v-if="onSaveCollection"
                class="aplayer-list-top-buttons-icon"
                @click="onSaveCollection(ap.list.audios)"></AddCircleOutline>
        </div>
        <span></span>
    </div>
    <ol
        :style="{ maxHeight: `calc( ${ap.options.listMaxHeight} - 30px )` }"
        :class="[
            !isDragging ? 'miaoMusic-ol-isDragging' : 'miaoMusic-ol-notDragging'
        ]"
        :key="refreshKey"
        ref="ol">
        <VueDraggable
            v-model="ap.list.audios"
            @start="onDragStart"
            @end="onDragEnd"
            item-key="id"
            handle=".aplayer-list-control-btn-reorder"
            ghostClass="iSDragging"
            :animation="150">
            <!-- <miaoLazyDiv :min-height="'32px'" auto-height> -->
            <li
                v-for="(element, index) in ap.list.audios"
                :class="[activeAudioIndex == index ? 'aplayer-list-light' : '']"
                class="aplayer-list-new"
                :key="element.id">
                <span
                    class="aplayer-list-cur"
                    :style="{ backgroundColor: apTheme }"></span>
                <span class="aplayer-list-index">{{ index + 1 }}</span>
                <span class="aplayer-list-title">{{ element.name }}</span>
                <div class="aplayer-list-control">
                    <div
                        v-if="isVideo(element)"
                        class="aplayer-list-control-btn aplayer-list-control-btn-hover aplayer-list-control-btn-play"
                        @click.stop="onPlayVideo && onPlayVideo(element)">
                        <VideocamOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div
                        class="aplayer-list-control-btn aplayer-list-control-btn-hover aplayer-list-control-btn-play"
                        @click.stop="switchAudio(index)">
                        <component
                            :is="
                                activeAudioIndex == index && !isPaused
                                    ? PauseOutline
                                    : PlayOutline
                            "
                            class="aplayer-list-control-btn-svg"></component>
                    </div>
                    <div
                        class="aplayer-list-control-btn aplayer-list-control-btn-hover"
                        @click.stop="switchAudio(index)"
                        v-if="false">
                        <HeartOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div
                        class="aplayer-list-control-btn"
                        @click.stop="listAudioUp(index)"
                        v-if="false">
                        <ChevronUpOutline
                            class="aplayer-list-control-btn-svg" />
                    </div>
                    <div
                        class="aplayer-list-control-btn"
                        @click.stop="listAudioDown(index)"
                        v-if="false">
                        <ChevronDownOutline
                            class="aplayer-list-control-btn-svg" />
                    </div>
                    <div
                        class="aplayer-list-control-btn aplayer-list-control-btn-hover"
                        @click.stop="listAudioRemove(index)">
                        <CloseOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div
                        class="aplayer-list-control-btn aplayer-list-control-btn-reorder">
                        <ReorderFourOutline
                            class="aplayer-list-control-btn-svg" />
                    </div>
                </div>
                <span
                    class="aplayer-list-author"
                    v-show="element.artist !== 'Audio artist1'">
                    {{ element.artist }}
                </span>
            </li>
            <!-- </miaoLazyDiv> -->
        </VueDraggable>
    </ol>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import {
    ChevronUpOutline,
    ChevronDownOutline,
    CloseOutline,
    ReorderFourOutline,
    PlayOutline,
    HeartOutline,
    VideocamOutline,
    PauseOutline,
    ListCircleOutline,
    ListOutline,
    HeadsetOutline,
    LogoOctocat,
    AddCircleOutline
} from '@vicons/ionicons5'

import { VueDraggable } from 'vue-draggable-plus'
// 与vue-draggable冲突
// import miaoLazyDiv from '@/components/miaoLazyDiv.vue';
import apType, { audioType } from '../../types/ap'
import { aplayerMiaoOption } from '../../hooks/aplayerMiao'

const props = defineProps<
    {
        ap: apType
    } & aplayerMiaoOption
>()

const apRef = ref(props.ap)

const ol = ref<HTMLOListElement>()

const refreshKey = ref(Math.random())

const isDragging = ref(false)

const apTheme = computed(
    () =>
        props.ap.list.audios[activeAudioIndex.value].theme ??
        props.ap.options.theme
)

const activeAudioIndex = computed(() => props.ap.list.index)
const isPaused = ref(false)

props.ap.on('play', () => {
    nextTick(() => {
        isPaused.value = false
    })
})

props.ap.on('pause', () => {
    isPaused.value = true
})

props.ap.on('listswitch', (...args: any) => {
    // 手动触发更新，不然监听不到
    props.ap.list.index = args[0].index as number
})

const refresh = () => {
    const top = ol.value?.scrollTop
    refreshKey.value = Math.random()
    nextTick(() => {
        ol.value?.scrollTo({
            top
        })
    })
}

props.ap.on('listremove', refresh)
props.ap.on('listadd', refresh)

const switchAudio = (index: number) => {
    if (index === activeAudioIndex.value) {
        if (props.ap.paused) {
            props.ap.play()
        } else {
            props.ap.pause()
        }
        props.ap.paused = props.ap.paused
        return
    }
    props.ap.list.switch(index)
}
const listRefreshIndex = (curr: audioType) => {
    for (let index in props.ap.list.audios) {
        if (props.ap.list.audios[index] === curr) {
            props.ap.list.index = parseInt(index)
            return
        }
    }
}

const listAudioUp = (index: number) => {
    const arr = props.ap.list.audios
    const len = arr.length
    const curr = props.ap.list.audios[props.ap.list.index]
    if (index === 0) {
        const _item = arr.shift()
        _item && arr.push(_item)
    } else {
        const pre: number = (len - 1 + index) % len
        const _pre = arr[index]
        arr[index] = arr[pre]
        arr[pre] = _pre
    }
    listRefreshIndex(curr)
}

const listAudioDown = (index: number) => {
    const arr = props.ap.list.audios
    const len = arr.length
    const curr = props.ap.list.audios[props.ap.list.index]
    if (index === len - 1) {
        const _item = arr.pop()
        _item && arr.unshift(_item)
    } else {
        const pre: number = (len + 1 + index) % len
        const _pre = arr[index]
        arr[index] = arr[pre]
        arr[pre] = _pre
    }
    listRefreshIndex(curr)
}
const listAudioRemove = (index: number) => {
    props.ap.list.remove(index)
}
const { onDragStart, onDragEnd } = (() => {
    let curr: audioType
    return {
        onDragStart: () => {
            isDragging.value = true
            curr = props.ap.list.audios[props.ap.list.index]
        },
        onDragEnd: () => {
            listRefreshIndex(curr)
            nextTick(() => {
                isDragging.value = false
            })
        }
    }
})()

const isVideo = (element: audioType) => {
    for (let end of ['mp4']) {
        if (element.name.endsWith(end)) {
            return true
        }
    }
    return false
}
const loopModeMap = {
    0: { name: '列表循环', icon: ListCircleOutline },
    1: { name: '单曲循环', icon: HeadsetOutline },
    2: { name: '列表播放', icon: ListOutline },
    3: { name: '随机播放', icon: LogoOctocat }
}

const loopMode = computed(() => {
    if (apRef.value.options.order === 'list') {
        switch (apRef.value.options.loop) {
            case 'all':
                return 0
            case 'one':
                return 1
            case 'none':
                return 2
        }
    }
    return 3
})

const loopModeToggle = () => {
    const ops = apRef.value.options
    if (ops.order === 'random') {
        ops.order = 'list'
    } else {
        switch (ops.loop) {
            case 'all': {
                ops.loop = 'one'
                break
            }
            case 'one': {
                ops.loop = 'none'
                break
            }
            case 'none': {
                ops.loop = 'all'
                ops.order = 'random'
                break
            }
        }
    }
}

onMounted(() => {
    console.log(props.ap)
})
</script>

<style lang="scss" scoped>
.aplayer-list-new {
    height: fit-content !important;
    cursor: default !important;

    .aplayer-list-cur {
        height: calc(100% - 8px) !important;
    }

    .aplayer-list-index {
        display: inline-block;
        width: 20px;
        margin-right: 4px !important;
        cursor: default !important;
    }
}

.aplayer-list-control {
    float: right;
    height: 32px;
    display: flex;
    align-items: center;

    &-btn {
        width: 25px;
        height: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        &-svg {
            width: 20px;
            aspect-ratio: 1;
            transition: all 0.1s ease;
        }
    }

    &-btn-hover {
        .aplayer-list-control-btn-svg {
            &:hover {
                width: 24px;
            }
        }
    }
}

.aplayer-list-top {
    height: 30px;
    // width: auto;
    // max-width: 100%;
    position: relative;
    border-bottom: 1px solid #e9e9e9;
    display: flex;
    justify-items: baseline;
    align-items: center;
    padding: 0 10px;
    .aplayer-list-top-loopMode {
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        float: left;
        // background-color: #f9f9f9;
        scale: 1;
        transition: scale 0.15s ease;
        &-icon {
            width: 20px;
            aspect-ratio: 1;
            transform: translateY(1px);
            fill: #000;
            path {
                fill: #000 !important;
            }
        }
        &-name {
            margin-left: 5px;
        }
        &:hover {
            scale: 1.1;
        }
    }
    .aplayer-list-top-buttons {
        display: inline-flex;
        position: absolute;
        right: 10px;
        align-items: center;
        justify-content: center;
        scale: 1;
        transition: scale 0.15s ease;
        &-icon {
            width: 20px;
            aspect-ratio: 1;
            cursor: pointer;
        }
        &:hover {
            scale: 1.1;
        }
    }
}
</style>

<style lang="scss">
.aplayer svg circle,
.aplayer .aplayer-list-new svg path {
    fill: #ffffff00;
}

.iSDragging {
    opacity: 0.5;
    // background: #60e8a2 !important;
}

.aplayer-list-light {
    background: unset !important;

    .aplayer-list-title {
        color: #60e8a2;
    }
}

.aplayer .aplayer-list .miaoMusic-ol-isDragging li:hover {
    background: #efefef !important;
}

.miaoMusicDrag-move,
.miaoMusicDrag-enter-active,
.miaoMusicDrag-leave-active {
    transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.miaoMusicDrag-enter-from,
.miaoMusicDrag-leave-to {
    opacity: 0;
    transform: scaleY(0.01) translate(30px, 0);
}

.miaoMusicDrag-leave-active {
    position: absolute;
}
</style>
