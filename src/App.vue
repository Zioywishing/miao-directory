<script setup lang="ts">
import { computed, onMounted, provide, reactive, ref, shallowRef, useTemplateRef } from 'vue'
import { NIcon, NScrollbar, NDropdown } from 'naive-ui'
import {
    EyeOffOutline,
    EyeOutline,
    CloseOutline,
    CopyOutline,
    EllipsisVertical,
    QrCodeOutline,
    ExtensionPuzzleOutline
} from '@vicons/ionicons5'
import VirtualDirectory, { VirtualFile } from './class/VirtualDirectory'
import MiaoMask from './components/miaoMask.vue'
import MiaoMessageProvider from './components/miaoAlertTipProvider.vue'
import config from './config'
import useVirtualPages from './hooks/useVirtualPages'
import init from './hooks/init'
import usePluginCenter from './hooks/usePluginCenter'
import PluginCenter, { PluginGroup } from './class/PluginCenter'
import { renderIcon } from './hooks/miaoTools'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'

const { baseUrl } = config

const showModal = ref<boolean>(false)

const viewRef = ref<HTMLDivElement>()

const modalData = shallowRef<{
    component: any
    props: any
}>()

const messageProviderRef = useTemplateRef('messageProviderRef')

const views = useVirtualPages()
let pluginCenter = ref<PluginCenter>()

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
    name: string,
    currentDirectories?: VirtualDirectory[],
    currentFiles?: VirtualFile[],
    index?: number
) => {
    views.push(component, name, currentDirectories, currentFiles, { index })
}

const deleteView = (index: number) => {
    views.deleteView(index)
    if (views.length === 0) {
        pluginCenter.value && pluginCenter.value.usePlugin('miaoDirectory', [rootDirectory], [])
    }
}

// 点击标题是隐藏其他标签或显示其他标签，还挺好用的
const handleClickTitle = (index: number) => {
    let count = views._views.filter((v) => v.visible).length
    let op =
        !views._views[index].visible || count > 1 ? 'hideOthers' : 'showOthers'
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

const openMenuOption = computed(() => [
    {
        label: '分享',
        key: 'share',
        icon: renderIcon(QrCodeOutline)
    }, pluginCenter.value ? {
        label: '插件',
        key: 'plugin',
        children: [
            ...pluginCenter.value
                .getUsablePlugin([], [], {
                    group: [PluginGroup.mainMenu]
                })
                .map((v) => ({
                    label: `${v.name}`,
                    key: `plugin:${v.key}`,
                    icon: v.icon ? renderIcon(v.icon) : undefined
                }))
        ],
        icon: renderIcon(ExtensionPuzzleOutline)
    } : undefined
].filter(v => v) as DropdownMixedOption[])

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
    } else if (key.startsWith('plugin:')) {
        const pluginName = key.split(':')[1]
        pluginCenter.value && pluginCenter.value.usePlugin(pluginName, [], [])
    }
}

onMounted(async () => {
    // @ts-ignore
    await init(messageProviderRef.value?.alertTip)
    pluginCenter.value = usePluginCenter()
    // console.log({ pluginCenter })
    pluginCenter.value.usePlugin('miaoDirectory', [rootDirectory], [])
})

// @ts-ignore
provide('globalAlertTip', messageProviderRef.value?.alertTip)
provide('rootDirectory', rootDirectory)
</script>

<template>
    <div class="view" ref="viewRef">
        <miao-message-provider ref="messageProviderRef">
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
                                <div class="tab-control">
                                    <div class="tab-point" :style="{ backgroundColor: view.color }"></div>
                                    <n-icon class="tag-control-icon icon" @click="view.switchShow()">
                                        <EyeOutline v-show="view.visible" class="icon-inner" />
                                        <EyeOffOutline v-show="!view.visible" class="icon-inner" />
                                    </n-icon>
                                    <n-icon class="tag-control-icon icon" @click="
                                        createView(
                                            view.component,
                                            view.name,
                                            view.currentDirectories,
                                            view.currentFiles,
                                            index + 1
                                        )
                                        " v-if="view.allowCopy">
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
                    <div class="view-container-item" v-for="(view, index) of views._views"
                        :class="!view.visible ? 'view-container-item-hidden' : ''" :key="view.id">
                        <component :is="view.component" v-model:current-directories="view.currentDirectories"
                            v-model:current-files="view.currentFiles" :id="view.id" :color="view.color" :view="view"
                            :views="views" @exit="deleteView(index)"></component>
                    </div>
                </transition-group>
            </div>
        </miao-message-provider>
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
                    margin-right: 5px;
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
            opacity: 1;
            transition: flex .25s ease, opacity .25s ease;
        }

        .view-container-item-hidden {
            flex: 0;
            min-width: 0px;
            opacity: 0;
            transition-delay: opacity .25s;
            // transition: opacity 5.25s ease;
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
                opacity: 0;
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
    //       transition: all 0.15s ease;
    //     }

    //     .page-enter-active {

    //     }

    //     .page-leave-active {
    //       transition: none !important;
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
