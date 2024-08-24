<template>
    <miao-drop-handler @on-virtual-directory="handleDropVDirectory" @on-files="handleDropFiles"
        @on-virtual-files="handleDropVirtualFiles">
        <div class="miao-directory-item-container" ref="rootDomRef">
            <div class="container-top" :style="{
                backgroundColor:
                    index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
            }">
                <div class="container-top-colorfulBar" :style="{ backgroundColor: props.color }"></div>
                <div class="container-top-breadcrumb">
                    <!-- <n-scrollbar x-scrollable> -->
                    <div class="container-top-breadcrumb-container">
                        <n-breadcrumb separator=">" style="margin-left: 5px">
                            <n-breadcrumb-item :clickable="false">
                                <n-icon size="18">
                                    <CloudOutline />
                                </n-icon>
                            </n-breadcrumb-item>
                            <n-breadcrumb-item v-for="dir in currentDirectory?.getParents"
                                @click="setCurrentDirectory(dir)" :clickable="true">
                                <div>{{ dir.name }}</div>
                            </n-breadcrumb-item>
                        </n-breadcrumb>
                    </div>
                    <!-- </n-scrollbar> -->
                </div>
                <div class="container-top-tools">
                    <n-icon class="container-top-tools-item" size="15" @click="handleBack">
                        <ChevronBackOutline />
                    </n-icon>
                    <n-icon class="container-top-tools-item" size="14" @click="handleReload">
                        <ReloadOutline class="container-top-tools-item-reload" />
                    </n-icon>
                    <n-icon class="container-top-tools-item" size="20" @click="emit('exit')">
                        <CloseOutline />
                    </n-icon>
                </div>
            </div>
            <div class="container-items" :style="{
                backgroundColor:
                    index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
            }">
                <n-scrollbar>
                    <transition-group name="dirItem">
                        <miaoDirectoryItem v-for="dir in showData_directory" :item="dir" :key="dir.uid"
                            :color="props.color" :selectedItem="selectedItem.value" @delete="handleItemDelete(dir)"
                            @click="handleItemClick(dir)" @drag-start="handleItemDragStart"
                            @rename="handleItemRename(dir)" @on-selected="handleItemSelect(dir)" />
                    </transition-group>
                    <transition-group name="dirItem">
                        <miaoDirectoryItem v-for="file in showData_files" :item="file" :key="file.uid"
                            :color="props.color" :selectedItem="selectedItem.value" @click="handleItemClick(file)"
                            @download="handleItemDownload(file)" @delete="handleItemDelete(file)"
                            @drag-start="handleItemDragStart" @rename="handleItemRename(file)"
                            @on-selected="handleItemSelect(file)" />
                    </transition-group>
                    <!-- <n-virtual-list :item="showData_all" :item-size="50">

                    </n-virtual-list> -->
                </n-scrollbar>
            </div>
            <div class="container-bottom" :style="{
                backgroundColor:
                    index % 2 === 1 ? 'rgb(61 61 61)' : 'rgb(162 162 162)'
            }">
                <div class="container-bottom-item">
                    <div class="container-bottom-item-icon">
                        <add-outline :style="{
                            color:
                                index % 2 === 0
                                    ? 'rgb(0 0 0)'
                                    : 'rgb(255 255 255)'
                        }" @click="handleAddNewItem" />
                    </div>
                </div>
                <div class="container-bottom-item">
                    <div class="container-bottom-item-icon">
                        <cloud-upload-outline :style="{
                            color:
                                index % 2 === 0
                                    ? 'rgb(0 0 0)'
                                    : 'rgb(255 255 255)'
                        }" @click="handlePickFilesUpload" />
                    </div>
                </div>
            </div>
            <miao-mask v-model:show="showModel"></miao-mask>
            <miao-popup-input ref="popupInput"></miao-popup-input>
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb, NIcon, NScrollbar } from 'naive-ui'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { computed, onMounted, reactive, ref } from 'vue'
import Config from '@/config'
import miaoMask from '@/components/miaoMask.vue'
import miaoDirectoryItem from '@/components/miaoDirectory/miaoDirectoryItem.vue'
import miaoPopupInput from '@/components/miaoPopupInput.vue'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import useDataBus from '@/hooks/useDataBus'
import {
    CloudOutline,
    ChevronBackOutline,
    ReloadOutline,
    CloseOutline,
    CloudUploadOutline,
    AddOutline
} from '@vicons/ionicons5'
import useUploadQueue from '@/hooks/useUploadQueue'
import useVirtualPages from '@/hooks/useVirtualPages'
import { filePicker } from '@/hooks/miaoTools'
import { uniq } from 'lodash'

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

class SelectedItem {
    constructor() {
        this._selectedItem = []
    }
    _selectedItem: (VirtualDirectory | VirtualFile)[]
    push(item: VirtualDirectory | VirtualFile) {
        this._selectedItem = [item, ...this._selectedItem]
    }
    remove(item: VirtualDirectory | VirtualFile) {
        this._selectedItem = this._selectedItem.filter(v => v !== item)
    }
    clear() {
        this._selectedItem = []
    }
    // 保证内容仍然存在于dir中且各个元素不重复
    get value() {
        return uniq(this._selectedItem).filter(v => {
            if (currentDirectory.value === undefined) {
                return false
            }
            // @ts-ignore
            return [...currentDirectory.value?.directorys, ...currentDirectory.value?.files].includes(v)
        })
    }
}
// 已选择的item，用于多选功能
const selectedItem = reactive(new SelectedItem())

const currentDirectorys = defineModel<VirtualDirectory[]>('currentDirectorys', {
    required: true
})

// 目前展示的Dir
const currentDirectory = computed(() => {
    return currentDirectorys.value[0]
})

// 当前组件在views中的序号
const index = computed(() => {
    return views.getIndex(props.id)
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
// const showData_all = computed<(VirtualDirectory | VirtualFile)[]>(() => {
//     const data = currentDirectory.value?.directorys
//         ? [...currentDirectory.value?.directorys]
//         : []
//     data.push(...currentDirectory.value?.files)
//     return data
// })

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
        await virtualDirectory.update()
    } else {
        virtualDirectory.update()
    }
    currentDirectorys.value[0] = virtualDirectory
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

const handleItemClick = (item: VirtualDirectory | VirtualFile) => {
    if (selectedItem.value.length > 0) {
        handleItemSelect(item)
    } else {
        if (item.type === 'file') {
            openUrl(`${baseUrl}${api.get}${item.path}`)
        } else if (item.type === 'directory') {
            setCurrentDirectory(item)
        }
    }
}

const handleItemDownload = (item: VirtualFile) => {
    openUrl(`${baseUrl}${api.get}${item.path}`, {
        download: item.name
    })
}

const handleItemDelete = async (_item: VirtualDirectory | VirtualFile) => {
    for (let item of uniq([...selectedItem.value, _item])) {
        ; (async () => {
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
        })()
    }
}

const handleItemRename = async (item: VirtualDirectory | VirtualFile) => {
    const popupRes = await popupInput.value.popup({
        title: '重命名',
        showInput: true,
        inputValue: item.name,
        inputProps: {
            placeholder: item.name
        },
        options: [
            {
                label: '取消',
                key: false,
                type: 'error'
            },
            {
                label: '确认',
                key: true,
                type: 'success'
            }
        ]
    })
    if (popupRes.key === false) {
        return
    }
    const newName = popupRes.text
    const { response } = miaoFetchApi.rename(item, newName, {
        retry: 5
    })
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
    const items = uniq([item, ...selectedItem.value])
    dataBus.set('dragData_vFiles', items.filter(v => v.type === 'file'))
    dataBus.set('dragData_vDirectory', items.filter(v => v.type === 'directory'))
    selectedItem.clear()
}

const handleDropFiles = async (files: File[]) => {
    currentDirectory.value &&
        uploadQueue.push(files, currentDirectory.value, {
            onFinish() {
                reload()
            }
        })
}

const handleDropVDirectory = async (vDirs: VirtualDirectory[]) => {
    // 不能移到自己或自己的子文件夹内
    for (let vDir of vDirs) {
        if (currentDirectory.value.getParents.includes(vDir)) {
            return
        }
    }
    for (let dir of vDirs) {
        ; (async () => {
            const _from = dir.parent
            const { response } = miaoFetchApi.cut(dir, currentDirectory.value)
            const id = (await response).eventId
            const { response: res } = miaoFetchApi.query(id)
            const eventResult = await res
            if (eventResult.status === 'success') {
                reload()
                _from && _from.update()
            }
        })()
    }
}

const handleDropVirtualFiles = (files: VirtualFile[]) => {
    if (files[0].parent === currentDirectory.value) {
        return
    }
    for (let file of files) {
        ; (async () => {
            const _from = file.parent
            const { response } = miaoFetchApi.cut(file, currentDirectory.value)
            const id = (await response).eventId
            const { response: res } = miaoFetchApi.query(id)
            const eventResult = await res
            if (eventResult.status === 'success') {
                reload()
                _from.update()
            }
        })()
    }
}

const handlePickFilesUpload = async () => {
    const files = await filePicker({
        multiple: true
    })
    const _currDir = currentDirectory.value
    uploadQueue.push(files, _currDir, {
        onFinish() {
            _currDir.update()
        }
    })
}

const handleAddNewItem = async () => {
    const popupRes = await popupInput.value.popup({
        title: '新建文件/文件夹',
        showInput: true,
        inputProps: {
            placeholder: ''
        },
        options: [
            {
                label: '取消',
                key: 'cancel',
                type: 'error'
            },
            {
                label: '文件',
                key: 'file',
                type: 'success'
            },
            {
                label: '文件夹',
                key: 'dir',
                type: 'success'
            }
        ]
    })
    // todo: 上传前如重名文件夹等等的错误提前检查
    if (popupRes.key === 'cancel' || popupRes.text === '') {
        return
    }
    const _currDir = currentDirectory.value
    const name = popupRes.text
    const opType: 'file' | 'dir' = popupRes.key
    if (opType === 'dir') {
        const res = await miaoFetchApi.mkdir(currentDirectory.value, name)
        if (res.message === 'success') {
            _currDir.update()
        }
    } else {
        const { response } = miaoFetchApi.mkFile(currentDirectory.value, name)
        const res = await response
        if (res.message === 'success') {
            _currDir.update()
        }
    }
}

const handleItemSelect = (item: VirtualDirectory | VirtualFile) => {
    if (!selectedItem.value.includes(item)) {
        selectedItem.push(item)
    } else {
        selectedItem.remove(item)
    }
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
    // min-width: 236px;
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
        justify-content: space-around;
        align-items: center;
        user-select: none;
        box-shadow: 0px 1px 10px #888888;
        z-index: 2;

        .container-bottom-item {
            height: 40px;
            width: 40px;
            display: flex;
            justify-content: center;
            align-items: center;

            .container-bottom-item-icon {
                svg {
                    width: 30px;
                    height: 30px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                &:hover {
                    svg {
                        width: 40px;
                        height: 40px;
                    }
                }
            }
        }
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
// }</style>
