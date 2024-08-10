<template>
	<div class="miao-directory-item-container" ref="rootDomRef">
		<div class="container-top">
			<n-breadcrumb separator=">">
				<n-breadcrumb-item v-for="(dir) in currentDirectory?.directoryArray" @click="setCurrentDirectory(dir)">
					{{ dir.name }}
				</n-breadcrumb-item>
			</n-breadcrumb>
		</div>
		<div class="container-items">
			<!-- <miaoDirectoryItem v-if="currentDirectory?.parent" :item="currentDirectory?.parent" name=".." @click="setCurrentDirectory(currentDirectory?.parent)" /> -->
			<miaoDirectoryItem v-for="(dir) in currentDirectory?.directorys" @click="setCurrentDirectory(dir)" :item="dir" :key="dir.uid" />
			<miaoDirectoryItem v-for="(file) in currentDirectory?.files" :item="file" :key="file.uid" @click="openUrl(`${baseUrl}/get${file.path}`)" />
		</div>
		<div class="container-bottom">
            <div>
                fuck
            </div>
        </div>
		<miaoMask v-model:show="showModel"></miaoMask>
	</div>
</template>

<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb } from 'naive-ui'
import type { file, directory } from '@/types/type.ts'
import VirtualDirectory from '@/class/virtualDirectory';
import { onMounted, ref } from 'vue';
import Config from '@/config'
import dropHandler, { dropHandlerHooks } from '@/hooks/dropHandler';
import miaoMask from '@/components/miaoMask.vue';
import miaoDirectoryItem from '@/components/miaoDirectory/miaoDirectoryItem.vue';
import useMiaoFetch from '@/hooks/useMiaoFetch';
import useDataBus from '@/hooks/useDataBus';

const { baseUrl } = Config
const dataBus = useDataBus()

const miaoFetch = useMiaoFetch({
    retry: 5,
})

// 目前展示的Dir
const currentDirectory = defineModel<VirtualDirectory | undefined>('currentDirectory', { required: true })

// 是否显示模态框
const showModel = ref(0)

// 用于监听拖拽文件事件
const rootDomRef = ref<HTMLDivElement>()

// 设置显示的dir
const setCurrentDirectory = async (virtualDirectory: VirtualDirectory) => {
    // 若没有缓存数据则同步刷新，有缓存数据则异步刷新
    if (virtualDirectory.files === undefined || virtualDirectory.directorys === undefined) {
        const data: (file | directory)[] = await (await miaoFetch(`${baseUrl}/get${virtualDirectory.path}`)).json()
        virtualDirectory.setContent(data)
    } else {
        ; (async () => {
            const data: (file | directory)[] = await (await miaoFetch(`${baseUrl}/get${virtualDirectory.path}`)).json()
            virtualDirectory.setContent(data)
            currentDirectory.value = undefined
            currentDirectory.value = virtualDirectory
        })()
    }
    // 刷新一下
    currentDirectory.value = undefined
    currentDirectory.value = virtualDirectory
    // emit("onCurrentDirectoryChange", currentDirectory.value)
}

const openUrl = (href: string) => {
  var oA = document.createElement("a");
  oA.href = href;
  oA.target = "_blank";
  oA.click();
}

onMounted(async () => {
    currentDirectory.value && await setCurrentDirectory(currentDirectory.value)
    // 拖动事件处理
    const dropFileOption:dropHandlerHooks = {
        onDropFiles(files: File[]) {
            const dragData = dataBus.get('dragData')
            console.log({dragData, files})
        },
        onEnter() {
            showModel.value += 1
        },
        onEnd() {
            showModel.value -= 1
        },
    }
    rootDomRef.value && dropHandler(rootDomRef.value, dropFileOption)
})
</script>

<style scoped lang="scss">
$top-height: 30px;
$bottom-bar-height: 60px;

.miao-directory-item-container {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    .container-top {
        height: $top-height;
        width: 100%;
        user-select: none;
        margin-bottom: 5px;
    }
    .container-items {
        flex: 1;
        width: 100%;
        background-color: #f8f8f8;
    }
    .container-bottom {
        height: $bottom-bar-height;
        background-color: bisque;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
    }
}
</style>
