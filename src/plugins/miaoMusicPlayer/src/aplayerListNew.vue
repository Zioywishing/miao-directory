<template>
    <ol :style="{ maxHeight: ap.options.listMaxHeight }" :key="refreshKey">
        <VueDraggable v-model="ap.list.audios" @start="onDragStart" @end="onDragEnd" item-key="id"
            handle=".aplayer-list-control-btn-reorder" ghostClass="iSDragging" :animation="150">
            <li v-for="(element, index) in ap.list.audios"
                :class="activeAudioIndex == index ? 'aplayer-list-light' : ''" class="aplayer-list-new"
                :key="element.id">
                <span class="aplayer-list-cur" :style="{ backgroundColor: apTheme }"></span>
                <span class="aplayer-list-index">{{ index + 1 }}</span>
                <span class="aplayer-list-title">{{ element.name }}</span>
                <div class="aplayer-list-control">
                    <div class="aplayer-list-control-btn aplayer-list-control-btn-hover aplayer-list-control-btn-play"
                        @click.stop="switchAudio(index)">
                        <PlayOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div class="aplayer-list-control-btn aplayer-list-control-btn-hover"
                        @click.stop="switchAudio(index)" v-if="false">
                        <HeartOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div class="aplayer-list-control-btn" @click.stop="listAudioUp(index)" v-if="false">
                        <ChevronUpOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div class="aplayer-list-control-btn" @click.stop="listAudioDown(index)" v-if="false">
                        <ChevronDownOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div class="aplayer-list-control-btn aplayer-list-control-btn-hover"
                        @click.stop="listAudioRemove(index)">
                        <CloseOutline class="aplayer-list-control-btn-svg" />
                    </div>
                    <div class="aplayer-list-control-btn aplayer-list-control-btn-reorder">
                        <ReorderFourOutline class="aplayer-list-control-btn-svg" />
                    </div>
                </div>
                <span class="aplayer-list-author" v-show="element.artist !== 'Audio artist1'">{{ element.artist
                    }}</span>
            </li>
        </VueDraggable>
    </ol>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ChevronUpOutline, ChevronDownOutline, CloseOutline, ReorderFourOutline, PlayOutline, HeartOutline } from '@vicons/ionicons5';
import { VueDraggable } from 'vue-draggable-plus'
import apType, { audioType } from '../types/ap';

const props = defineProps<{
    ap: apType
    onDragItemStart: () => void,
    onDragItemEnd: () => void
}>()

const refreshKey = ref(Math.random())

const apTheme = computed(() => props.ap.list.audios[activeAudioIndex.value].theme ?? props.ap.options.theme)

const activeAudioIndex = computed(() => props.ap.list.index)

props.ap.on('listswitch', (...args: any) => {
    // 手动触发更新，不然监听不到
    props.ap.list.index = args[0].index as number;
})

const refresh = () => {
    refreshKey.value = Math.random()
}

props.ap.on('listremove', refresh)
props.ap.on('listadd', refresh)

const switchAudio = (index: number) => {
    if (index === activeAudioIndex.value) {
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
    const arr = props.ap.list.audios;
    const len = arr.length
    const curr = props.ap.list.audios[props.ap.list.index]
    if (index === 0) {
        const _item = arr.shift();
        _item && arr.push(_item);
    } else {
        const pre: number = (len - 1 + index) % len;
        const _pre = arr[index];
        arr[index] = arr[pre];
        arr[pre] = _pre;
    }
    listRefreshIndex(curr)
};

const listAudioDown = (index: number) => {
    const arr = props.ap.list.audios;
    const len = arr.length
    const curr = props.ap.list.audios[props.ap.list.index]
    if (index === len - 1) {
        const _item = arr.pop();
        _item && arr.unshift(_item);
    } else {
        const pre: number = (len + 1 + index) % len;
        const _pre = arr[index];
        arr[index] = arr[pre];
        arr[pre] = _pre;
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
            curr = props.ap.list.audios[props.ap.list.index]
        },
        onDragEnd: () => {
            listRefreshIndex(curr)
        }
    }
})()
// const onDragEnd = (_e: any) => {
//     const curr = props.ap.list.audios[props.ap.list.index]
//     listRefreshIndex(curr)
// }

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
            transition: all .1s ease;
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

.aplayer .aplayer-list ol li:hover {
    background: #efefef !important;
}
</style>
