<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { NIcon } from 'naive-ui';
import { EyeOffOutline, EyeOutline, CloseOutline, AddOutline } from '@vicons/ionicons5'
import miaoDirectory from './views/miaoDirectory.vue';
import VirtualPage from './class/virtualPage';

const views = reactive<VirtualPage[]>([])

const createView = () => {
  views.push(reactive<VirtualPage>(new VirtualPage()))
}

const deleteView = (index: number) => {
  views.splice(index, 1)
  if(views.length === 0){
    createView()
  }
}

onMounted(() => {
  createView()
})
</script>

<template>
	<div class="view-controler">
		<div class="tag" v-for="(view, index) of views" :key="view.uid">
			<div class="tag-title">{{ view.title }}</div>
			<div class="tag-control">
				<n-icon class="tag-control-icon icon" @click="view.switchShow()">
					<EyeOutline v-show="view.visible" class="icon-inner" />
					<EyeOffOutline v-show="!view.visible" class="icon-inner" />
				</n-icon>
				<n-icon class="tag-control-icon icon" @click="deleteView(index)">
					<CloseOutline class="icon-inner" />
				</n-icon>
			</div>
		</div>
		<div class="tag-short">
			<n-icon class="icon icon-larger" @click="createView()" size="20">
				<AddOutline class="icon-inner" />
			</n-icon>
		</div>
	</div>
	<div class="view-container">
		<div class="view" v-for="(view) of views" v-show="view.visible" :key="view.uid">
			<!-- title: {{ view.title }} -->
			<miao-directory @on-title-change="(_t) => view.setTitle(_t)"></miao-directory>
		</div>
	</div>
</template>

<style lang="scss" scoped>
$controler-height: 25px;

.view-controler {
  display: flex;
  height: $controler-height;
  width: 100%;
  overflow: hidden;

  .tag-short {
    position: relative;
    // margin-left: 5px;
    height: $controler-height;
    width:  $controler-height;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .tag {
    position: relative;
    width: 170px;
    // flex: 1;
    margin: 0 5px;
    display: flex;
    border-radius: 5px 5px 0 0;
    align-items: center;

    &::after {
      content: '';
      height: calc($controler-height*0.6);
      width: 1px;
      border-right: 1px solid black;
      position: absolute;
      right: 0px;
    }

    .tag-title {
      margin-left: 4px;
      width: 70%;
      user-select: none;
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

  .icon-larger {
    height: calc($controler-height * 0.85);
    width: calc($controler-height * 0.85);
  }
}

.view-container {
  position: relative;
  display: flex;
  height: calc(100% - $controler-height);

  .view {
    border: 1px solid black;
    margin: 0 5px;
    padding: 3px;
    flex: 1;
  }
}
</style>
