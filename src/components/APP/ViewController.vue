<script setup lang="ts">
import { NIcon, NScrollbar, NDropdown } from 'naive-ui'
import {
   EyeOffOutline,
   EyeOutline,
   CloseOutline,
   CopyOutline,
   EllipsisVertical
} from '@vicons/ionicons5'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import type { VirtualPages } from '@/class/VirtualPage'
import type VirtualDirectory from '@/class/VirtualDirectory'
import type { VirtualFile } from '@/class/VirtualDirectory'

const props = defineProps<{
   views: VirtualPages
   handleClickTitle: (index: number) => void
   createView: (
      component: any,
      name: string,
      currentDirectories?: VirtualDirectory[],
      currentFiles?: VirtualFile[],
      index?: number
   ) => void
   deleteView: (index: number) => void
   openMenuOption: DropdownMixedOption[]
   handleMenuSelect: (key: string) => any
}>()
</script>

<template>
   <div class="view-controller">
      <n-scrollbar x-scrollable>
         <div class="tabs-container">
            <transition-group name="tab">
               <div
                  class="tab"
                  v-for="(view, index) of props.views._views"
                  :key="view.id">
                  <span
                     class="tab-title"
                     :title="view.title"
                     @click="props.handleClickTitle(index)">
                     {{
                        view.title.length > 5 && 0
                           ? `${view.title.substring(0, 5)}...`
                           : view.title
                     }}
                  </span>
                  <div class="tab-control">
                     <div
                        class="tab-point"
                        :style="{ backgroundColor: view.color }"></div>
                     <n-icon
                        class="tag-control-icon icon"
                        @click="view.switchShow()">
                        <EyeOutline v-show="view.visible" class="icon-inner" />
                        <EyeOffOutline
                           v-show="!view.visible"
                           class="icon-inner" />
                     </n-icon>
                     <n-icon
                        class="tag-control-icon icon"
                        @click="
                           props.createView(
                              view.component,
                              view.name,
                              view.currentDirectories,
                              view.currentFiles,
                              index + 1
                           )
                        "
                        v-if="view.allowCopy">
                        <CopyOutline />
                     </n-icon>
                     <n-icon
                        class="tag-control-icon icon"
                        @click="props.deleteView(index)">
                        <CloseOutline class="icon-inner" />
                     </n-icon>
                  </div>
               </div>
            </transition-group>
         </div>
      </n-scrollbar>
      <div class="view-controller-menu">
         <div class="view-controller-menu-item">
            <n-dropdown
               trigger="click"
               :options="props.openMenuOption"
               @select="props.handleMenuSelect">
               <n-icon class="icon">
                  <EllipsisVertical class="icon-inner" />
               </n-icon>
            </n-dropdown>
         </div>
      </div>
   </div>
</template>

<style lang="scss" scoped>
$controller-height: 25px;
$tag-width: 170px;

.view-controller {
   display: flex;
   height: $controller-height;
   width: 100%;
   background-color: #dadada;

   .tabs-container {
      display: flex;
      margin-left: 5px;
      flex: 1;

      .tab {
         position: relative;
         width: $tag-width;
         height: $controller-height;
         margin: 0 5px;
         display: flex;
         border-radius: 5px 5px 0 0;
         align-items: center;

         .tab-title {
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

// transition动画相关
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

      .tab-leave-active {
         position: absolute;
      }
   }
}
</style>
