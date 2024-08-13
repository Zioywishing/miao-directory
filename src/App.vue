<script setup lang="ts">

import { h, onMounted, reactive, ref, shallowRef } from 'vue';
import { NIcon, NScrollbar, NDropdown, NQrCode } from 'naive-ui';
import { EyeOffOutline, EyeOutline, CloseOutline, CopyOutline, EllipsisVertical, QrCodeOutline } from '@vicons/ionicons5'
import miaoDirectory from './views/miaoDirectory.vue';
import VirtualPage from './class/VirtualPage';
import VirtualDirectory from './class/VirtualDirectory';
import MiaoMask from './components/miaoMask.vue';
import config from './config';
import useViretualPages from './hooks/useVirtualPages';

const { baseUrl } = config

const showModal = ref<boolean>(false)

const modalData = shallowRef<{
  component: any
  props: any
}>()

const views = useViretualPages()

const rootDirectory = reactive(new VirtualDirectory({
  name: '根目录',
  stats: {
    atimeMs: 0,
    birthtimeMs: 0,
    ctimeMs: 0,
    mtimeMs: 0,
  }
}))

const createView = (initDirectory: VirtualDirectory, index?: number) => {
  index ?? (index = views.length)
  console.log(initDirectory)
  views.splice(index, 0, reactive<VirtualPage>(new VirtualPage(initDirectory)))
}

const deleteView = (index: number) => {
  views.splice(index, 1)
  if (views.length === 0) {
    createView(rootDirectory)
  }
}

// 点击标题是隐藏其他标签或显示其他标签，还挺好用的
const handleClickTitle = (index: number) => {
  let count = views.filter(v => v.visible).length
  let op = !views[index].visible || count > 1 ? 'hideOthers' : 'showOthers'
  let _index = 0
  while (_index < views.length) {
    if (_index !== index) {
      views[_index].visible = op === 'hideOthers' ? false : true
    } else {
      views[_index].visible = true
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

const handleMenuSelect = (key: string) => {
  console.log(key)
  if (key === 'share') {
    showModal.value = true
    modalData.value = {
      component: NQrCode,
      props: {
        value: baseUrl,
        size: 300,
        errorCorrectionLevel: 'H'
      }
    }
  }
}

onMounted(() => {
  createView(rootDirectory)
})
</script>

<template>
  <div class="view">
    <div class="view-controler">
      <n-scrollbar x-scrollable>
        <div class="tags-container">
          <transition-group name="tab">
            <div class="tab" v-for="(view, index) of views" :key="view.uid">
              <div class="tab-title" @click="handleClickTitle(index)">{{ view.title }}</div>
              <div class="tab-point" :style="{ backgroundColor: view.color }"></div>
              <div class="tab-control">
                <n-icon class="tag-control-icon icon" @click="view.switchShow()">
                  <EyeOutline v-show="view.visible" class="icon-inner" />
                  <EyeOffOutline v-show="!view.visible" class="icon-inner" />
                </n-icon>
                <n-icon class="tag-control-icon icon" @click="createView(view.currentDirectory, index + 1)">
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
      <div class="view-controler-menu">
        <div class="view-controler-menu-item">
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
        <div class="view-container-item" v-for="(view, index) of views" v-show="view.visible" :key="view.uid">
          <miao-directory v-model:current-directory="view.currentDirectory" :color="view.color" :index="index"
            @exit="deleteView(index)"></miao-directory>
        </div>
      </transition-group>
    </div>
  </div>
  <!-- 模态框展示，用来显示分享二维码，设置菜单之类的东西 -->
  <MiaoMask v-model:show="showModal" @click="showModal = false">
    <component :is="modalData?.component" v-bind="modalData?.props"></component>
  </MiaoMask>
</template>

<style lang="scss" scoped>
$controler-height: 25px;
$tag-width: 170px;

.view {
  position: relative;
  height: 100%;
  width: 100%;

  .view-controler {
    display: flex;
    height: $controler-height;
    width: 100%;
    background-color: #dadada;
    // overflow: hidden;

    .tags-container {
      display: flex;
      margin-left: 5px;
      flex: 1;

      // overflow-x: scroll;
      .tab {
        position: relative;
        width: $tag-width;
        margin: 0 5px;
        // flex: 1;
        display: flex;
        border-radius: 5px 5px 0 0;
        align-items: center;

        .tab-title {
          margin-left: 4px;
          // width: 70%;
          user-select: none;
          cursor: pointer;
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
          height: calc($controler-height*0.6);
          width: 1px;
          border-right: 1px solid black;
          position: absolute;
          right: 0px;
        }
      }
    }

    .view-controler-menu {
      position: relative;
      display: flex;
      align-items: center;
      padding: 0 5px;

      .view-controler-menu-item {
        height: 100%;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      &::before {
        content: '';
        height: calc($controler-height*0.6);
        width: 1px;
        border-right: 1px solid black;
        position: absolute;
        left: 2px;
      }
    }

    .icon {
      height: calc($controler-height * 0.7);
      width: calc($controler-height * 0.7);
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
    height: calc(100% - $controler-height);
    overflow-y: overlay;
    overflow-x: overlay;

    .view-container-item {
      flex: 1;
      height: 100%;
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
  .view-controler {
    .tags-container {

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

  .view-container {

    // .page-move {
    //   transition: all 0.2s ease;
    // }

    
    // .page-enter-active {

    // }

    // .page-leave-active {
    //   transition: none;
    // }

    // .page-enter-from {
    //   opacity: 0;
    // }

    // .page-leave-active {
    //   position: absolute;
    // }
  }
}
</style>
