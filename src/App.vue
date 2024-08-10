<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { NIcon, NScrollbar } from 'naive-ui';
import { EyeOffOutline, EyeOutline, CloseOutline, CopyOutline, EllipsisVertical } from '@vicons/ionicons5'
import miaoDirectory from './views/miaoDirectory.vue';
import VirtualPage from './class/virtualPage';
import VirtualDirectory from './class/virtualDirectory';

const views = reactive<VirtualPage[]>([])

const rootDirectory = new VirtualDirectory({
  name: '根目录',
  stats: {
    atimeMs: 0,
    birthtimeMs: 0,
    ctimeMs: 0,
    mtimeMs: 0,
  }
})

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

onMounted(() => {
  createView(rootDirectory)
})

// todo: 让所有伪页面共享一个rootDirectory
</script>

<template>
	<div class="view-controler">
		<n-scrollbar x-scrollable>
			<div class="tags-container">
				<div class="tag" v-for="(view, index) of views" :key="view.uid">
					<div class="tag-title">{{ view.title }}</div>
					<div class="tag-point" :style="{ backgroundColor: view.color } "></div>
					<div class="tag-control">
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
			</div>
		</n-scrollbar>
		<div class="view-controler-menu">
			<div class="view-controler-menu-item">
				<n-icon class="icon" @click="">
					<EllipsisVertical class="icon-inner" />
				</n-icon>
			</div>
		</div>
	</div>
	<div class="view-container">
		<div class="view" v-for="(view, index) of views" v-show="view.visible" :key="view.uid">
			<miao-directory v-model:current-directory="view.currentDirectory" :color="view.color" :index="index" @exit="deleteView(index)"></miao-directory>
		</div>
	</div>
</template>

<style lang="scss" scoped>
$controler-height: 25px;

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
    .tag {
      position: relative;
      width: 170px;
      margin: 0 5px;
      // flex: 1;
      display: flex;
      border-radius: 5px 5px 0 0;
      align-items: center;

      .tag-title {
        margin-left: 4px;
        // width: 70%;
        user-select: none;
      }

      .tag-point {
        height: 5px;
        aspect-ratio: 1;
        border-radius: 66px;
        margin-left: 5px;
      }

      .tag-control {
        position: absolute;
        right: 10px;
        display: flex;
        align-items: center;

        .tag-control-icon:not(:last-child) {
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
  .view {
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
</style>
