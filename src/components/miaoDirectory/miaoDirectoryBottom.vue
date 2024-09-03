<template>
    <div class="miao-directory-container-bottom" :style="{
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
          }" @click="emit('add-new-item')" />
        </div>
      </div>
      <div class="container-bottom-item">
        <div class="container-bottom-item-icon">
          <cloud-upload-outline :style="{
            color:
              index % 2 === 0
                ? 'rgb(0 0 0)'
                : 'rgb(255 255 255)'
          }" @click="emit('pick-files-upload')" />
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { AddOutline, CloudUploadOutline } from '@vicons/ionicons5'
  defineProps<{
    index: number
  }>()

  const emit = defineEmits<{
    'add-new-item': []
    'pick-files-upload': []
  }>()
  </script>

  <style scoped lang="scss">
  .miao-directory-container-bottom {
    height: 60px;
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
          transition: width 0.3s ease;
          transition: height 0.3s ease;
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
  </style>