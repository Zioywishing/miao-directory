<template>
    <miao-drop-handler @on-virtual-directory="handleDropVDirectory" @on-files="handleDropFiles">
        <div class="miao-directory-item-container" ref="rootDomRef">
            <div
                class="container-top"
                :style="{
                    backgroundColor:
                        index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
                }">
                <div
                    class="container-top-colorfulBar"
                    :style="{ backgroundColor: props.color }"></div>
                <div class="container-top-breadcrumb">
                    <!-- <n-scrollbar x-scrollable> -->
                    <div class="container-top-breadcrumb-container">
                        <n-breadcrumb separator=">" style="margin-left: 5px">
                            <n-breadcrumb-item :clickable="false">
                                <n-icon size="18">
                                    <CloudOutline />
                                </n-icon>
                            </n-breadcrumb-item>
                            <n-breadcrumb-item
                                v-for="dir in currentDirectory?.directoryArray"
                                @click="setCurrentDirectory(dir)"
                                :clickable="true">
                                <div>{{ dir.name }}</div>
                            </n-breadcrumb-item>
                        </n-breadcrumb>
                    </div>
                    <!-- </n-scrollbar> -->
                </div>
                <div class="container-top-tools">
                    <n-icon
                        class="container-top-tools-item"
                        size="15"
                        @click="handleBack">
                        <ChevronBackOutline />
                    </n-icon>
                    <n-icon
                        class="container-top-tools-item"
                        size="14"
                        @click="handleReload">
                        <ReloadOutline
                            class="container-top-tools-item-reload" />
                    </n-icon>
                    <n-icon
                        class="container-top-tools-item"
                        size="20"
                        @click="emit('exit')">
                        <CloseOutline />
                    </n-icon>
                </div>
            </div>
            <div
                class="container-items"
                :style="{
                    backgroundColor:
                        index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
                }">
                <n-scrollbar>
                    <transition-group name="dirItem">
                        <miaoDirectoryItem
                            v-for="dir in showData_directory"
                            @click="setCurrentDirectory(dir)"
                            :item="dir"
                            :key="dir.uid"
                            :color="props.color"
                            @delete="handleItemDelete(dir)"
                            @drag-start="handleItemDragStart" />
                    </transition-group>
                    <transition-group name="dirItem">
                        <miaoDirectoryItem
                            v-for="file in showData_files"
                            :item="file"
                            :key="file.uid"
                            @click="openUrl(`${baseUrl}${api.get}${file.path}`)"
                            @download="
                                openUrl(`${baseUrl}${api.get}${file.path}`, {
                                    download: file.name
                                })
                            "
                            @delete="handleItemDelete(file)"
                            @drag-start="handleItemDragStart"
                            :color="props.color" />
                    </transition-group>
                </n-scrollbar>
            </div>
            <div
                class="container-bottom"
                :style="{
                    backgroundColor:
                        index % 2 === 1 ? 'rgb(61 61 61)' : 'rgb(162 162 162)'
                }"></div>
            <miao-mask v-model:show="showModel"></miao-mask>
            <!-- <miao-popup-input ref="popupInput"></miao-popup-input> -->
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb, NIcon, NScrollbar } from 'naive-ui'
import type { file, directory } from '@/types/type.ts'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { computed, onMounted, ref } from 'vue'
import Config from '@/config'
import miaoMask from '@/components/miaoMask.vue'
import miaoDirectoryItem from '@/components/miaoDirectory/miaoDirectoryItem.vue'
// import miaoPopupInput from "@/components/miaoPopupInput.vue";
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import useDataBus from '@/hooks/useDataBus'
import {
    CloudOutline,
    ChevronBackOutline,
    ReloadOutline,
    CloseOutline
} from '@vicons/ionicons5'
import useUploadQueue from '@/hooks/useUploadQueue'
import useVirtualPages from '@/hooks/useVirtualPages'

const { baseUrl, api } = Config
const dataBus = useDataBus()
const views = useVirtualPages()

const miaoFetchApi = useMiaoFetchApi()

const props = defineProps<{
    color: string
    id: number
}>()

const emit = defineEmits<{
    exit: []
}>()

const popupInput = ref()
// 是否显示模态框
const showModel = ref(0)

const currentObjects = defineModel<VirtualDirectory[]>('currentObjects', {
    required: true
})

// 目前展示的Dir
const currentDirectory = computed(() => {
    return currentObjects.value[0]
})

const index = computed(() => {
    for (let i in views) {
        if (views[i].uid === props.id) {
            return parseInt(i)
        }
    }
    return 0
})

// 用于展示的数据，后续会增加排序等操作
const showData_directory = computed<VirtualDirectory[]>(() => {
    const data = currentDirectory.value?.directorys
        ? [...currentDirectory.value?.directorys]
        : []
    return data
})
const showData_files = computed<VirtualFile[]>(() => {
    const data = currentDirectory.value?.files
        ? [...currentDirectory.value?.files]
        : []
    return data
})

// 用于监听拖拽文件事件
const rootDomRef = ref<HTMLDivElement>()

const uploadQueue = useUploadQueue()

// 设置显示的dir
const setCurrentDirectory = async (virtualDirectory: VirtualDirectory) => {
    // 若没有缓存数据则同步刷新，有缓存数据则异步刷新
    if (
        virtualDirectory.files === undefined ||
        virtualDirectory.directorys === undefined
    ) {
        const data: (file | directory)[] = await miaoFetchApi.get(
            virtualDirectory
        )
        virtualDirectory.updateContent(data)
    } else {
        ;(async () => {
            const data: (file | directory)[] = await miaoFetchApi.get(
                virtualDirectory
            )
            virtualDirectory.updateContent(data)
        })()
    }
    currentObjects.value[0] = virtualDirectory
}

const reload = () => {
    setCurrentDirectory(currentDirectory.value)
}

const openUrl = (
    href: string,
    config?: {
        download?: string
        target?: string
    }
) => {
    let { target, download } = config ?? {}
    const a = document.createElement('a')
    a.setAttribute('href', href)
    a.setAttribute('target', target ?? '_blank')
    download && a.setAttribute('download', download)
    a.click()
}

const handleBack = () => {
    if (currentDirectory.value?.parent) {
        setCurrentDirectory(currentDirectory.value.parent)
    }
}

const handleReload = () => {
    reload()
}

const handleItemDelete = async (item: VirtualDirectory | VirtualFile) => {
    const { response } = miaoFetchApi.delete(item, {
        retry: 5
    })
    // todo: 将删除事件统一用一个事件管理中心管理
    const id = (await response).eventId
    const { response: res } = miaoFetchApi.query(id)
    const eventResult = await res
    if (eventResult.status === 'success') {
        reload()
    }
}

const handleItemDragStart = async (
    _event: DragEvent,
    item: VirtualDirectory | VirtualFile
) => {
    if (item.type === 'file') {
        dataBus.set('dragData_vFiles', [item])
    } else {
        dataBus.set('dragData_vDirectory', [item])
    }
}

const handleDropVDirectory = async (vDirs: VirtualDirectory[]) => {
    setCurrentDirectory(vDirs[0])
}

const handleDropFiles = async (files: File[]) => {
    currentDirectory.value &&
        uploadQueue.push(files, currentDirectory.value, {
            onFinish() {
                reload()
            }
        })
}

onMounted(async () => {
    await setCurrentDirectory(currentDirectory.value)
})
</script>

<style scoped lang="scss">
$top-height: 30px;
$bottom-bar-height: 60px;

.miao-directory-item-container {
    position: relative;
    height: 100%;
    width: inherit;
    min-width: 266px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .container-top {
        height: $top-height;
        width: 100%;
        user-select: none;
        position: relative;
        display: flex;
        align-items: center;
        overflow: hidden;
        background-color: #f1f1f1;

        .container-top-colorfulBar {
            height: 70%;
            width: 5px;
            margin-left: 10px;
            border-radius: 3px 0 0 3px;
        }

        .container-top-breadcrumb {
            position: relative;
            height: 70%;
            width: calc(100% - 95px);
            display: flex;
            justify-content: flex-start;
            align-items: center;
            // overflow: hidden;
            overflow-y: hidden;
            overflow-x: hidden;
            background-color: #ffffff;
            padding: 0 5px;
            border-radius: 0 3px 3px 0;

            .container-top-breadcrumb-container {
                position: absolute;
                height: 100%;
                right: 0;
                top: 0;
                min-width: 100%;
                display: flex;
                justify-content: flex-start;
                align-items: center;
            }
        }

        .container-top-tools {
            position: relative;
            height: 100%;
            width: 70px;
            padding: 0 5px;
            display: flex;
            justify-content: space-around;
            align-items: center;

            .container-top-tools-item {
                width: 20px;
                height: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #ffffff00;
                border-radius: 5px;
                transition: background-color 0.3s;
                cursor: pointer;

                .container-top-tools-item-reload {
                    transition: transform 0.6s ease-in-out;
                }

                &:hover {
                    background-color: rgba(128, 128, 128, 0.4);
                }

                &:active .container-top-tools-item-reload {
                    transform: rotate(360deg);
                }
            }

            // &::after {
            //     content: '';
            //     height: 60%;
            //     position: absolute;
            //     right: -2px;
            //     width: 2px;
            //     background-color: #828282;
            // }
        }
    }

    .container-items {
        width: 100%;
        height: calc(100% - $top-height - $bottom-bar-height);
        // flex: 1;
    }

    .container-bottom {
        height: $bottom-bar-height;
        background-color: bisque;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        box-shadow: 0px 1px 10px #888888;
        z-index: 2;
    }
}

// transition动画相关
// .miao-directory-item-container {
//     .container-items {
//         .dirItem-move {
//             transition: all 0.2s ease;
//         }

//         .dirItem-leave-active {
//             transition: none;
//         }

//         .dirItem-enter-from {
//             opacity: 0;
//         }

//         .dirItem-leave-active {
//             position: absolute;
//         }
//     }
// }
</style>
