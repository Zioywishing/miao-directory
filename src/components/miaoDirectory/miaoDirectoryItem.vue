<template>
    <div class="miao-item" draggable="true" ref="itemRef" @dragstart="handleDragStart">
        <miaoContextMenu :options="dropDownOptions" :touch-time-out="500" @select="handleDropdownSelect">
            <div class="item-main" ref="mainRef">
                <div class="item-main-front" :style="{ backgroundColor: props.color }"></div>
                <Icon class="item-main-icon" v-show="clientWidth > 200"></Icon>
                <div class="item-main-info">
                    <div class="item-main-info-name">
                        <Icon class="item-main-info-name-icon" v-show="clientWidth <= 200"></Icon>
                        {{ name }}
                    </div>
                    <div class="item-main-info-date" v-if="time">
                        {{ time }}
                    </div>
                </div>
                <!-- 菜单现在通过右键/长按呼出 -->
                <!-- <n-dropdown trigger="click" :options="dropDownOptions" @select="handleDropdownSelect">
                    <div class="item-main-option" @click="(e) => e.stopPropagation()">
                        <EllipsisVertical class="item-main-option-icon" />
                    </div>
                </n-dropdown> -->
            </div>
        </miaoContextMenu>
    </div>
</template>

<script setup lang="ts">
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import miaoContextMenu from '../miaoContextMenu.vue'
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
import { computed, onMounted, ref } from 'vue'
import dateFormatter from '@/hooks/dateFormatter'
// import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'

// const miaoFetchApi = useMiaoFetchApi()

const props = defineProps<{
    item: VirtualDirectory | VirtualFile
    name?: string
    color: string
}>()

const emit = defineEmits<{
    download: []
    delete: []
    rename: []
    dragStart: [event: DragEvent, item: VirtualDirectory | VirtualFile]
}>()

const itemType = ref<'file' | 'directory'>(props.item.type)

const mainRef = ref<HTMLDivElement>()

// 使用ResizeObserver实现
const clientWidth = ref<number>(666)

const name = props.name ?? props.item.name

const time = computed(() => {
    return dateFormatter(
        new Date(props.item.stats.mtimeMs),
        'yyyy-MM-dd hh:mm:ss'
    )
})

const dropDownOptions = computed(() => {
    const options = [
        {
            label: '重命名',
            key: 'rename'
        },
        {
            label: '删除',
            key: 'delete'
        },
    ]
    if (itemType.value === 'file') {
        options.push(
            ...[
                {
                    label: '下载',
                    key: 'download'
                }
            ]
        )
    }
    return options
})

// 是不是可以直接在这里面实现？
const handleDropdownSelect = (key: string) => {
    if (key === 'rename') {
        emit('rename')
    } else if (key === 'download') {
        emit('download')
    } else if (key === 'delete') {
        emit('delete')
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
                    '.xbm',
                    '.tif',
                    'pjp',
                    '.svgz',
                    'jpg',
                    'jpeg',
                    'ico',
                    'tiff',
                    '.gif',
                    'svg',
                    '.jfif',
                    '.webp',
                    '.png',
                    '.bmp',
                    'pjpeg',
                    '.avif'
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

const handleDragStart = (event: DragEvent) => {
    emit('dragStart', event, props.item)
    // dataBus.set('dragData', [props.item])
}

onMounted(() => {
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            clientWidth.value = entry.contentRect.width;
        }
    });
    if (mainRef.value) {
        observer.observe(mainRef.value);
    }
})
</script>

<style lang="scss" scoped>
.miao-item {
    cursor: pointer;
    width: calc(100% - 20px);
    min-width: 150px;
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
        transition: background-color 0.3s;

        .item-main-front {
            height: 100%;
            width: 10px;
            border-radius: 7px 0 0 7px;
            background-color: rgb(0, 0, 0);
        }

        .item-main-icon {
            margin-left: 10px;
            height: 80%;
            color: #00403e;
        }

        .item-main-info {
            margin-left: 10px;
            height: 100%;
            display: flex;
            flex-direction: column;

            &-name {
                user-select: none;
                display: flex;
                align-items: center;
                margin-top: 3px;

                &-icon {
                    color: #00403e;
                    width: 20px;
                    margin-right: 5px;
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
}
</style>
