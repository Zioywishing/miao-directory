<template>
	<div class="container" ref="rootDom">
		<n-breadcrumb separator=">">
			<n-breadcrumb-item v-for="(dir) in currentDirectory?.directoryArray" @click="setCurrentDirectory(dir)">
				{{ dir.name }}
			</n-breadcrumb-item>
		</n-breadcrumb>
		<button v-for="(dir) in currentDirectory?.directorys" @click="setCurrentDirectory(dir)" style="display: block;">
			{{ `dir ===> ${dir.name}` }}
		</button>
		<a v-for="(file) in currentDirectory?.files" :href="`${baseUrl}/get${file.path}`" target="_blank" style="display: block;">
			{{ `file ===> ${file.name}` }}
		</a>
	</div>
</template>

<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb } from 'naive-ui'
import type { file, directory } from '@/types/type.ts'
import VirtualDirectory from '@/class/virtualDirectory';
import { onMounted, ref } from 'vue';
import Config from '@/config'
import dropHandler from '@/hooks/dropHandler';

const emit = defineEmits<{
    (e: 'onTitleChange', title: string): void
}>()

const { baseUrl } = Config

const rootDom = ref<HTMLDivElement>()

const rootDirectory = new VirtualDirectory({
    name: '根目录',
    stats: {
        atimeMs: 0,
        birthtimeMs: 0,
        ctimeMs: 0,
        mtimeMs: 0,
    }
})

const currentDirectory = ref<VirtualDirectory | undefined>(rootDirectory)

// 设置显示的dir
const setCurrentDirectory = async (virtualDirectory: VirtualDirectory) => {
    if (virtualDirectory.files === undefined && virtualDirectory.directorys === undefined) {
        const data: (file | directory)[] = await (await fetch(`${baseUrl}/get${virtualDirectory.path}`)).json()
        virtualDirectory.setContent(data)
    }
    // 刷新一下
    currentDirectory.value = undefined
    currentDirectory.value = virtualDirectory
    emit("onTitleChange", currentDirectory.value.name)
}

onMounted(async () => {
    await setCurrentDirectory(rootDirectory)
    rootDom.value && dropHandler(rootDom.value, {
        onDrop(files){
            console.log(files, files.map(v=>v.name))
        }
    })
})
</script>

<style scoped lang="scss">
.container {
    height: 100%;
    width: 100%;
}
</style>
