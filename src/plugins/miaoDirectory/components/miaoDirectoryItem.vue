<template>
    <miao-draggable-div class="miao-item" :isDraggable="draggable" ref="itemRef" @on-drag-start="handleDragStart">
        <miaoContextMenu :options="dropDownOptions ?? []" :touch-time-out="500" @select="handleDropdownSelect">
            <div class="item-main" :class="selected ? 'item-main-selected' : ''" ref="mainRef">
                <div class="item-main-front" :style="{ backgroundColor: props.color }"></div>
                <Icon class="item-main-icon" v-show="clientWidth > 250"></Icon>
                <div class="item-main-info">
                    <div class="item-main-info-name">
                        <Icon class="item-main-info-name-icon" v-if="clientWidth <= 250"></Icon>
                        <n-ellipsis :style="{ maxWidth: clientWidth > 250 ? '80%' : '75%' }">{{ name }}</n-ellipsis>
                    </div>
                    <div class="item-main-info-date" v-if="time">
                        {{ time }}
                    </div>
                </div>
            </div>
        </miaoContextMenu>
    </miao-draggable-div>
</template>

<script setup lang="ts">
import miaoContextMenu from '@/components/miaoContextMenu.vue'
import {
    DocumentText,
    FileTray,
    Help,
    Image,
    LogoChrome,
    LogoCss3,
    LogoJavascript,
    LogoVue,
    PlayCircle,
    Disc
} from '@vicons/ionicons5'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import dateFormatter from '@/hooks/dateFormatter'
import { NEllipsis } from 'naive-ui'
import { DropdownOption } from 'naive-ui/es/dropdown';
import miaoDraggableDiv from '@/components/miaoDraggableDiv.vue'
// import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'

// const miaoFetchApi = useMiaoFetchApi()

const props = defineProps<{
    item: {
        name: string,
        type: 'directory' | 'file'
        stats: {
            mtimeMs: number
        }
    }
    name?: string
    color: string
    dropDownOptions?: DropdownOption[]
    selected?: boolean
}>()

const emit = defineEmits<{
    download: []
    delete: []
    rename: []
    dragStart: [e: DragEvent]
    onSelected: []
    plugin: [plugin: string]
}>()

const mainRef = ref<HTMLDivElement>()

const draggable = ref(true)

// 使用ResizeObserver实现
const clientWidth = ref<number>(666)

const name = props.name ?? props.item.name

const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        clientWidth.value = entry.contentRect.width;
    }
});

const time = computed(() => {
    return dateFormatter(
        new Date(props.item.stats.mtimeMs),
        'yyyy-MM-dd hh:mm:ss'
    )
})

// 是不是可以直接在这里面实现？
// 应该将所有事件emit出去才对
const handleDropdownSelect = (key: string) => {
    if (key === 'rename') {
        emit('rename')
    } else if (key === 'download') {
        emit('download')
    } else if (key === 'delete') {
        emit('delete')
    } else if (key === 'select') {
        emit('onSelected')
    } else if (key.startsWith('plugin:')) {
        const plugin = key.split(':')[1]
        emit('plugin', plugin)
    }
}

const Icon = computed(() => {
    try {
        if (props.item.type === 'directory') {
            return FileTray
        } else if (props.item.type === 'file') {
            const aft = props.item.name.split('.').at(-1)?.toLowerCase()
            if (!aft) {
                throw 1
            } else if (
                ['txt', 'doc', 'docs', 'docx', 'xls', 'xlsx'].includes(aft)
            ) {
                return DocumentText
            } else if (
                ['mp3', 'wav', 'ape', 'acc', 'ogg', 'flac'].includes(aft)
            ) {
                return Disc
            } else if (
                [
                    'xbm',
                    'tif',
                    'pjp',
                    'svgz',
                    'jpg',
                    'jpeg',
                    'ico',
                    'tiff',
                    'gif',
                    'svg',
                    'jfif',
                    'webp',
                    'png',
                    'bmp',
                    'pjpeg',
                    'avif'
                ].includes(aft)
            ) {
                return Image
            } else if (['mp4', 'm2v', 'mkv'].includes(aft)) {
                return PlayCircle
            } else if (['js', 'jsx', 'ts', 'tsx'].includes(aft)) {
                return LogoJavascript
            } else if (['html'].includes(aft)) {
                return LogoChrome
            } else if (['css', 'scss', 'less'].includes(aft)) {
                return LogoCss3
            } else if (['vue'].includes(aft)) {
                return LogoVue
            }
            return DocumentText
        }
    } catch {
        return Help
    }
})

const itemRef = ref()

const handleDragStart = (e: DragEvent) => {
    emit('dragStart', e)
}

onMounted(() => {
    if (mainRef.value) {
        observer.observe(mainRef.value);
    }
})

onBeforeUnmount(() => {
    if (mainRef.value) {
        observer.unobserve(mainRef.value);
    }
})
</script>

<style lang="scss" scoped>
.miao-item {
    cursor: pointer;
    width: calc(100% - 20px);
    // min-width: 170px;
    // aspect-ratio: 66/9;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 10px;

    .item-main {
        position: relative;
        width: 100%;
        height: 95%;
        background-color: rgb(255, 255, 255);
        border-radius: 7px;
        display: flex;
        align-items: center;
        transition: background-color 0.3s ease;
        overflow-x: hidden;

        .item-main-front {
            height: 100%;
            min-width: 10px;
            border-radius: 7px 0 0 7px;
            background-color: rgb(0, 0, 0);
        }

        .item-main-icon {
            min-width: 30px;
            margin-left: 10px;
            height: 30px;
            width: 30px;
            color: #00403e;
            transition: color 0.15s ease-out;
        }

        .item-main-info {
            margin-left: 10px;
            height: 100%;
            width: calc(100% - 10px);
            display: flex;
            flex-direction: column;

            &-name {
                position: relative;
                user-select: none;
                display: flex;
                align-items: center;
                margin-top: 3px;

                &-icon {
                    color: #00403e;
                    width: 20px;
                    margin-right: 5px;
                    transition: color 0.15s ease-out;
                }
            }

            &-date {
                user-select: none;
                font-size: small;
            }
        }

        .item-main-option {
            height: 100%;
            width: 20px;
            position: absolute;
            right: 0;
            border-radius: 0 7px 7px 0;
            background-color: rgba(0, 0, 0, 0);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            transition: background-color 0.3s;

            .item-main-option-icon {
                color: #000;
                transition: color 0.15s;
            }

            &:hover,
            &:active {
                background-color: #8b8b8b;

                .item-main-option-icon {
                    color: #fff;
                }
            }
        }

        &:hover,
        &:active {
            background-color: #d2d2d2;
        }
    }

    .item-main-selected {
        background-color: rgba(0, 128, 207, 0.32);

        &:hover {
            background-color: rgba(0, 128, 207, 0.64);
            ;
        }
    }
}
</style>
