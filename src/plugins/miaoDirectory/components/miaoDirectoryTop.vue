<template>
   <div
      class="miao-directory-container-top"
      :style="{
         backgroundColor: index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)'
      }">
      <div
         class="container-top-colorfulBar"
         :style="{ backgroundColor: props.color }"></div>
      <div class="container-top-breadcrumb">
         <n-scrollbar
            ref="scrollbarRef"
            :x-scrollable="true"
            class="container-top-breadcrumb-scroll"
            @wheel="handleWheel">
            <div class="container-top-breadcrumb-container">
               <n-breadcrumb
                  separator=">"
                  class="sb-nn"
                  style="margin-left: 5px">
                  <n-breadcrumb-item :clickable="false">
                     <n-icon size="18">
                        <CloudOutline />
                     </n-icon>
                  </n-breadcrumb-item>
                  <n-breadcrumb-item
                     v-for="dir in currentDirectory?.getParents"
                     @click="handleClickBreadcrumbItem(dir)"
                     :clickable="true">
                     <n-ellipsis class="!max-w-[100px]">
                        {{ dir.name }}
                     </n-ellipsis>
                  </n-breadcrumb-item>
               </n-breadcrumb>
            </div>
         </n-scrollbar>
      </div>
      <div class="container-top-tools">
         <n-icon
            class="container-top-tools-item"
            size="15"
            @click="$emit('back')">
            <ChevronBackOutline />
         </n-icon>
         <n-icon
            class="container-top-tools-item"
            size="14"
            @click="$emit('reload')">
            <ReloadOutline class="container-top-tools-item-reload" />
         </n-icon>
         <n-dropdown
            trigger="click"
            :options="openMenuOption"
            @select="(key: string) => emit('menuSelect', key)">
            <n-icon class="container-top-tools-item" size="14">
               <EllipsisVertical />
            </n-icon>
         </n-dropdown>
      </div>
   </div>
</template>

<script setup lang="ts">
import {
   CloudOutline,
   ChevronBackOutline,
   ReloadOutline,
   EllipsisVertical
} from '@vicons/ionicons5'
import VirtualDirectory from '@/class/VirtualDirectory'
import { ref } from 'vue'
import { NScrollbar } from 'naive-ui/es/scrollbar';

const props = defineProps<{
   color: string
   index: number
   currentDirectory: VirtualDirectory | undefined
   openMenuOption: {
      key: string
      label: string
      [key: string]: any
   }[]
}>()

const emit = defineEmits<{
   back: []
   reload: []
   menuSelect: [key: string]
   'set-current-directory': [virtualDirectory: VirtualDirectory]
}>()

const scrollbarRef = ref<InstanceType<typeof NScrollbar>>()

const handleClickBreadcrumbItem = (virtualDirectory: VirtualDirectory) => {
   emit('set-current-directory', virtualDirectory)
}

const handleWheel = (event: WheelEvent) => {
   event.preventDefault()
   event.stopPropagation()
   if (scrollbarRef.value) {
      scrollbarRef.value.scrollBy({
         left: event.deltaY,
         behavior: "smooth"
      })
   }
}

defineExpose({
   // @ts-ignore
   scrollTo: (...args: any[]) => scrollbarRef.value?.scrollTo(...args)
   // getRef: () => scrollbarRef.value
})
</script>

<style scoped lang="scss">
.miao-directory-container-top {
   height: 30px;
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
         // position: absolute;
         height: 21px;
         // right: 0;
         // top: 0;
         min-width: 100%;
         display: flex;
         justify-content: flex-start;
         align-items: center;
         overflow: hidden;
      }
   }

   .container-top-tools {
      position: relative;
      height: 100%;
      // width: 70px;
      padding: 0 5px;
      display: flex;
      justify-content: space-around;
      align-items: center;

      .container-top-tools-item {
         width: 20px;
         height: 20px;
         margin: 0 1px;
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
   }
}
</style>

<style lang="scss">
.container-top-breadcrumb-scroll {
   .n-scrollbar-rail {
      transform: translateY(5px);
   }
}
</style>
