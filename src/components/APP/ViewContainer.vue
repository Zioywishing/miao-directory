<script setup lang="ts">
const props = defineProps({
   views: {
      type: Object,
      required: true
   },
   deleteView: {
      type: Function,
      required: true
   }
})
</script>

<template>
   <div class="view-container">
      <div
         class="view-container-item"
         v-for="(view, index) of props.views._views"
         :class="!view.visible ? 'view-container-item-hidden' : ''"
         :key="view.id">
         <component
            :is="view.component"
            v-model:current-directories="view.currentDirectories"
            v-model:current-files="view.currentFiles"
            :id="view.id"
            :color="view.color"
            :view="view"
            :views="props.views"
            @exit="props.deleteView(index)"></component>
      </div>
   </div>
</template>

<style lang="scss" scoped>
$controller-height: 25px;

.view-container {
   position: relative;
   display: flex;
   height: calc(100% - $controller-height);
   overflow-y: hidden;
   overflow-x: overlay;

   .view-container-item {
      flex: 1;
      height: 100%;
      min-width: 180px;
      opacity: 1;
      transition:
         flex 0.25s ease,
         opacity 0.25s ease;
   }

   .view-container-item-hidden {
      flex: 0;
      min-width: 0px;
      opacity: 0;
   }

   &::-webkit-scrollbar {
      position: absolute;
      width: 4px;
   }

   // 滚动条轨道
   &::-webkit-scrollbar-track {
      border-radius: 2px;
   }

   // 小滑块
   &::-webkit-scrollbar-thumb {
      background: #e0e0e0;
   }

   &::-webkit-scrollbar-thumb:hover {
      background: #999999;
   }
}
</style>
