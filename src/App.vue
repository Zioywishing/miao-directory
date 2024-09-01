<script setup lang="ts">
import { h, onMounted, reactive, ref, shallowRef } from 'vue'
import { NIcon, NScrollbar, NDropdown } from 'naive-ui'
import {
    EyeOffOutline,
    EyeOutline,
    CloseOutline,
    CopyOutline,
    EllipsisVertical,
    QrCodeOutline
} from '@vicons/ionicons5'
import miaoDirectory from '@/views/miaoDirectory.vue'
import VirtualDirectory, { VirtualFile } from './class/VirtualDirectory'
import MiaoMask from './components/miaoMask.vue'
import config from './config'
import useVirtualPages from './hooks/useVirtualPages'
import init from './hooks/init'

const { baseUrl } = config

const showModal = ref<boolean>(false)

const modalData = shallowRef<{
    component: any
    props: any
}>()

const views = useVirtualPages()

const rootDirectory = reactive(
    new VirtualDirectory({
        name: '根目录',
        stats: {
            atimeMs: 0,
            birthtimeMs: 0,
            ctimeMs: 0,
            mtimeMs: 0
        }
    })
)

// component就是一个vue组件，类似于miaoDirectory
const createView = (
    component: any,
    currentDirectories?: VirtualDirectory[],
    currentFiles?: VirtualFile[],
    index?: number
) => {
    views.push(component, currentDirectories, currentFiles, index)
}

const deleteView = (index: number) => {
    views.deleteView(index)
    if (views.length === 0) {
        createView(miaoDirectory, [rootDirectory])
    }
}

// 点击标题是隐藏其他标签或显示其他标签，还挺好用的
const handleClickTitle = (index: number) => {
    let count = views._views.filter((v) => v.visible).length
    let op = !views._views[index].visible || count > 1 ? 'hideOthers' : 'showOthers'
    let _index = 0
    while (_index < views._views.length) {
        if (_index !== index) {
            views._views[_index].visible = op === 'hideOthers' ? false : true
        } else {
            views._views[_index].visible = true
        }
        _index += 1
    }
}

// 顶部菜单相关
function renderIcon(icon: any) {
    return () => {
        return h(NIcon, null, {
            default: () => h(icon)
        })
    }
}

const openMenuOption = [
    {
        label: '分享',
        key: 'share',
        icon: renderIcon(QrCodeOutline)
    }
]

const handleMenuSelect = async (key: string) => {
    if (key === 'share') {
        showModal.value = true
        modalData.value = {
            component: (await import('naive-ui/es/qr-code')).NQrCode,
            props: {
                value: baseUrl,
                size: 300,
                errorCorrectionLevel: 'H'
            }
        }
    }
}

onMounted(() => {
    init()
    createView(miaoDirectory, [rootDirectory])
})
</script>

<template>
    <div class="view">
        <div class="view-controller">
            <n-scrollbar x-scrollable>
                <div class="tabs-container">
                    <transition-group name="tab">
                        <div class="tab" v-for="(view, index) of views._views" :key="view.id">
                            <span class="tab-title" :title="view.title" @click="handleClickTitle(index)">
                                {{
                                    view.title.length > 5 && 0
                                        ? `${view.title.substring(0, 5)}...`
                                        : view.title
                                }}
                            </span>
                            <div class="tab-point" :style="{ backgroundColor: view.color }"></div>
                            <div class="tab-control">
                                <n-icon class="tag-control-icon icon" @click="view.switchShow()">
                                    <EyeOutline v-show="view.visible" class="icon-inner" />
                                    <EyeOffOutline v-show="!view.visible" class="icon-inner" />
                                </n-icon>
                                <n-icon class="tag-control-icon icon" @click="
                                    createView(
                                        view.component,
                                        view.currentDirectories,
                                        view.currentFiles,
                                        index + 1
                                    )
                                    ">
                                    <CopyOutline />
                                </n-icon>
                                <n-icon class="tag-control-icon icon" @click="deleteView(index)">
                                    <CloseOutline class="icon-inner" />
                                </n-icon>
                            </div>
                        </div>
                    </transition-group>
                </div>
            </n-scrollbar>
            <div class="view-controller-menu">
                <div class="view-controller-menu-item">
                    <n-dropdown trigger="click" :options="openMenuOption" @select="handleMenuSelect">
                        <n-icon class="icon">
                            <EllipsisVertical class="icon-inner" />
                        </n-icon>
                    </n-dropdown>
                </div>
            </div>
        </div>
        <div class="view-container">
            <transition-group name="page">
                <div class="view-container-item" v-for="(view, index) of views._views" v-show="view.visible"
                    :key="view.id">
                    <component :is="view.component" v-model:current-directories="view.currentDirectories"
                        v-model:current-files="view.currentFiles" :id="view.id" :color="view.color"
                        @exit="deleteView(index)"></component>
                </div>
            </transition-group>
        </div>
    </div>
    <!-- 模态框展示，用来显示分享二维码，设置菜单之类的东西 -->
    <MiaoMask v-model:show="showModal" @click="showModal = false">
        <component @click="(e: any) => e.stopPropagation()" :is="modalData?.component" v-bind="modalData?.props">
        </component>
    </MiaoMask>
</template>

<style lang="scss" scoped>
$controller-height: 25px;
$tag-width: 170px;

.view {
    position: relative;
    height: 100%;
    width: 100%;

    .view-controller {
        display: flex;
        height: $controller-height;
        width: 100%;
        background-color: #dadada;
        // overflow: hidden;

        .tabs-container {
            display: flex;
            margin-left: 5px;
            flex: 1;

            // overflow-x: scroll;
            .tab {
                position: relative;
                width: $tag-width;
                height: $controller-height;
                margin: 0 5px;
                // flex: 1;
                display: flex;
                border-radius: 5px 5px 0 0;
                align-items: center;

                .tab-title {
                    // font-family: monospace;
                    // font-weight: bolder;
                    margin-left: 4px;
                    width: 90px;
                    user-select: none;
                    cursor: pointer;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;

                    span {
                        user-select: none;
                        cursor: pointer;
                    }
                }

                .tab-point {
                    height: 5px;
                    aspect-ratio: 1;
                    border-radius: 66px;
                    margin-left: 5px;
                }

                .tab-control {
                    position: absolute;
                    right: 10px;
                    display: flex;
                    align-items: center;

                    .tab-control-icon:not(:last-child) {
                        margin-right: 5px;
                    }
                }

                &:not(:last-child)::after {
                    content: '';
                    height: calc($controller-height * 0.6);
                    width: 1px;
                    border-right: 1px solid black;
                    position: absolute;
                    right: 0px;
                }
            }
        }

        .view-controller-menu {
            position: relative;
            display: flex;
            align-items: center;
            padding: 0 5px;

            .view-controller-menu-item {
                height: 100%;
                aspect-ratio: 1;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            &::before {
                content: '';
                height: calc($controller-height * 0.6);
                width: 1px;
                border-right: 1px solid black;
                position: absolute;
                left: 2px;
            }
        }

        .icon {
            height: calc($controller-height * 0.7);
            width: calc($controller-height * 0.7);
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            background-color: rgba(128, 128, 128, 0);
            transition: background-color 0.3s;

            &:hover {
                background-color: rgba(128, 128, 128, 0.4);
            }
        }
    }

    .view-container {
        position: relative;
        display: flex;
        // flex-direction: column;
        height: calc(100% - $controller-height);
        overflow-y: hidden;
        overflow-x: overlay;

        .view-container-item {
            flex: 1;
            height: 100%;
            min-width: 180px;
        }

        &::-webkit-scrollbar {
            position: absolute;
            width: 4px;
        }

        // 滚动条轨道
        &::-webkit-scrollbar-track {
            // background: rgb(239, 239, 239);
            border-radius: 2px;
        }

        // 小滑块
        &::-webkit-scrollbar-thumb {
            background: #e0e0e0;
            // border-radius: 5px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #999999;
        }
    }
}

// transition动画相关
.view {
    .view-controller {
        .tabs-container {

            .tab-move,
            .tab-enter-active {
                transition: all 0.2s ease;
            }

            .tab-leave-active {
                transition: none;
            }

            .tab-enter-from {
                opacity: 0;
                transform: translateY(-30px);
            }

            // .tab-leave-to {
            //   opacity: 0;
            //   transform: translateY(-80px) translateX(calc($tag-width + 10px));
            // }

            .tab-leave-active {
                position: absolute;
            }
        }
    }

    // .view-container {
    //     .page-move {
    //       transition: all 0.2s ease;
    //     }

    //     .page-enter-active {

    //     }

    //     .page-leave-active {
    //       transition: none;
    //     }

    //     .page-enter-from {
    //       opacity: 0;
    //     }

    //     .page-leave-active {
    //       position: absolute;
    //     }
    // }
}
</style>
