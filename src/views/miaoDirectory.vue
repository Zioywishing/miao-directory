<template>
	<div class="miao-directory-item-container" ref="rootDomRef">
		<div class="container-top">
			<div class="container-top-colorbar" :style="{ backgroundColor: props.color }"></div>
			<div class="container-top-breadcrumb">
				<!-- <n-scrollbar x-scrollable> -->
				<div class="container-top-breadcrumb-container">
					<n-breadcrumb separator=">" style="margin-left: 5px;">
						<n-breadcrumb-item :clickable="false">
							<n-icon size="18">
								<CloudOutline />
							</n-icon>
						</n-breadcrumb-item>
						<n-breadcrumb-item v-for="(dir) in currentDirectory?.directoryArray" @click="setCurrentDirectory(dir)" :clickable="true">
							<div>{{ dir.name }}</div>
						</n-breadcrumb-item>
					</n-breadcrumb>
				</div>
				<!-- </n-scrollbar> -->
			</div>
			<div class="container-top-tools">
				<n-icon class="container-top-tools-item" size="15" @click="handleBack">
					<ChevronBackOutline />
				</n-icon>
				<n-icon class="container-top-tools-item" size="14" @click="handleReload">
					<ReloadOutline class="container-top-tools-item-reload" />
				</n-icon>
				<n-icon class="container-top-tools-item" size="20" @click="emit('exit')">
					<CloseOutline />
				</n-icon>
			</div>
		</div>
		<div class="container-items" :style="{ backgroundColor: props.index % 2 === 0 ? '#f8f8f8' : 'rgb(240 240 240)' }">
			<n-scrollbar>
				<miaoDirectoryItem v-for="(dir) in currentDirectory?.directorys" @click="setCurrentDirectory(dir)" :item="dir" :key="dir.uid" :color="props.color" />
				<miaoDirectoryItem
					v-for="(file) in currentDirectory?.files"
					:item="file"
					:key="file.uid"
					@click="openUrl(`${baseUrl}${api.get}${file.path}`)"
					@download="openUrl(`${baseUrl}${api.get}${file.path}`, {download: file.name})"
					:color="props.color"
				/>
			</n-scrollbar>
		</div>
		<div class="container-bottom" :style="{ backgroundColor: props.index % 2 === 1 ? 'rgb(61 61 61)' : 'rgb(162 162 162)' }"></div>
		<miaoMask v-model:show="showModel"></miaoMask>
	</div>
</template>

<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb, NIcon, NScrollbar } from 'naive-ui'
import type { file, directory } from '@/types/type.ts'
import VirtualDirectory from '@/class/VirtualDirectory';
import { onMounted, ref } from 'vue';
import Config from '@/config'
import dropHandler, { dropHandlerHooks } from '@/hooks/dropHandler';
import miaoMask from '@/components/miaoMask.vue';
import miaoDirectoryItem from '@/components/miaoDirectory/miaoDirectoryItem.vue';
import useMiaoFetch from '@/hooks/useMiaoFetch';
import useDataBus from '@/hooks/useDataBus';
import { CloudOutline, ChevronBackOutline, ReloadOutline, CloseOutline } from '@vicons/ionicons5'

const { baseUrl, api } = Config
const dataBus = useDataBus()

const miaoFetch = useMiaoFetch({
    retry: 5,
})

const props = defineProps<{
    color: string
    index: number
}>()

const emit = defineEmits<{
    exit: []
}>()

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
        const data: (file | directory)[] = await (await miaoFetch(`${baseUrl}${api.get}${virtualDirectory.path}`)).json()
        virtualDirectory.updateContent(data)
    } else {
        ; (async () => {
            const data: (file | directory)[] = await (await miaoFetch(`${baseUrl}${api.get}${virtualDirectory.path}`)).json()
            virtualDirectory.updateContent(data)
            currentDirectory.value = undefined
            currentDirectory.value = virtualDirectory
        })()
    }
    // 刷新一下
    currentDirectory.value = undefined
    currentDirectory.value = virtualDirectory
    // emit("onCurrentDirectoryChange", currentDirectory.value)
}

const openUrl = (href: string, config?: {
    download?: string
    target?: string
}) => {
    let {target, download} = config ?? {}

    console.log({target, download, href})
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('target', target ?? '_blank')
    download && a.setAttribute('download', download);
    a.click();
    // var a = document.createElement("a");
    // a.setAttribute('href', href)
    // a.setAttribute('target', target ?? '_blank')
    // a.setAttribute('download', download ?? '')
    // console.log({target, download})
    // a.click();
}

const handleBack = () => {
    if(currentDirectory.value?.parent){
        setCurrentDirectory(currentDirectory.value.parent)
    }
}

const handleReload = () => {
    currentDirectory.value && setCurrentDirectory(currentDirectory.value)
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
    width: inherit;
    min-width: 266px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .container-top {
        height: $top-height;
        width: 100%;
        user-select: none;
        position: relative;
        display: flex;
        align-items: center;
        overflow: hidden;
        background-color: #f1f1f1;
        .container-top-colorbar {
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
                position: absolute;
                height: 100%;
                right: 0;
                top: 0;
                min-width: 100%;
                display: flex;
                justify-content: flex-start;
                align-items: center;
            }
        }
        .container-top-tools {
            position: relative;
            height: 100%;
            width: 70px;
            padding: 0 5px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            .container-top-tools-item {
                width: 20px;
                height: 20px;
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
                    background-color: rgba(128,128,128,0.4);
                }
                &:active .container-top-tools-item-reload {
                    transform: rotate(360deg);
                }
            }
            &::after {
                content: '';
                height: 60%;
                position: absolute;
                right: -1px;
                width: 2px;
                background-color: #828282;
            }
        }
    }
    .container-items {
        width: 100%;
        height: calc(100% - $top-height - $bottom-bar-height);
    }
    .container-bottom {
        height: $bottom-bar-height;
        background-color: bisque;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        box-shadow: 0px 1px 10px #888888;
        z-index: 2;
    }
}
</style>
