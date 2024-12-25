<script setup lang="ts">
import {
   computed,
   onMounted,
   provide,
   ref,
   shallowRef,
   useTemplateRef
} from 'vue'
import { QrCodeOutline, ExtensionPuzzleOutline } from '@vicons/ionicons5'
import type VirtualDirectory from './class/VirtualDirectory'
import type { VirtualFile } from './class/VirtualDirectory'
import MiaoMask from './components/miaoMask.vue'
import MiaoMessageProvider from './components/miaoAlertTipProvider.vue'
import config from './config'
import useVirtualPages from './hooks/useVirtualPages'
import init from './hooks/init'
import usePluginCenter from './hooks/usePluginCenter'
import PluginCenter, { PluginGroup } from './class/PluginCenter'
import { renderIcon } from './utils/miaoTools'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import useRootVDirectory from './hooks/useRootVDirectory'
import ViewController from '@/components/APP/ViewController.vue'
import ViewContainer from '@/components/APP/ViewContainer.vue'

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
const rootDirectory = useRootVDirectory()

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

const openMenuOption = computed(
   () =>
      [
         {
            label: '分享',
            key: 'share',
            icon: renderIcon(QrCodeOutline)
         },
         pluginCenter.value
            ? {
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
              }
            : undefined
      ].filter((v) => v) as DropdownMixedOption[]
)

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
})

// @ts-ignore
provide('globalAlertTip', messageProviderRef.value?.alertTip)
provide('rootDirectory', rootDirectory)
</script>

<template>
   <div class="view" ref="viewRef">
      <miao-message-provider ref="messageProviderRef">
         <ViewController
            :views="views"
            :handleClickTitle="handleClickTitle"
            :createView="createView"
            :deleteView="deleteView"
            :openMenuOption="openMenuOption"
            :handleMenuSelect="handleMenuSelect" />
         <ViewContainer
            :views="views"
            :deleteView="deleteView"
            :handleClickTitle="handleClickTitle" />
      </miao-message-provider>
   </div>
   <!-- 模态框展示，用来显示分享二维码，设置菜单之类的东西 -->
   <MiaoMask v-model:show="showModal" @click="showModal = false">
      <component
         @click="(e: any) => e.stopPropagation()"
         :is="modalData?.component"
         v-bind="modalData?.props"></component>
   </MiaoMask>
</template>

<style lang="scss" scoped>
@use "styles/default.scss";

$controller-height: 25px;
$tag-width: 170px;

.view {
   background-color: #ffffff;
   position: relative;
   height: 100%;
   width: 100%;
}
</style>
