<template>
    <miao-drop-handler @on-virtual-directory="handleDrop" @on-virtual-files="handleDrop">
        <div class="miaoImage" ref="rootRef">
            <n-scrollbar ref="NScrollbarRef">
                <div class="miaoImage-container">
                    <div class="miaoImage-container-row" v-for="(src, index) in imageSrcList" :key="index">
                        <img :src="src" class="miaoImage-container-row-image" loading="lazy"
                            :class="activeImageIndex === index ? 'miaoImage-container-row-image-active' : ''"
                            @click="activeImageIndex = index" />
                    </div>
                </div>
            </n-scrollbar>
            <miao-mask :show="activeImageIndex !== -1" @click="activeImageIndex = -1" class="miaoImage-mask">
                <ChevronBack class="miaoImage-mask-btn miaoImage-mask-btn-back" @click="handleActiveImageIndexBack" />
                <img :src="imageSrcList[activeImageIndex]" class="miaoImage-mask-active"
                    @click="e => e.stopPropagation()" draggable="false">
                <ChevronForward class="miaoImage-mask-btn miaoImage-mask-btn-forward"
                    @click="handleActiveImageIndexForward" />
            </miao-mask>
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoMask from '@/components/miaoMask.vue';
import miaoDropHandler from '@/components/miaoDropHandler.vue';
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { uniq } from 'lodash';
import { nextTick, onMounted, ref } from 'vue'
import { NScrollbar } from 'naive-ui';
import { ChevronBack, ChevronForward } from '@vicons/ionicons5'

const imageSuffixList = [
    'xbm',
    'tif',
    'pjp',
    'svgz',
    'jpg',
    'jpeg',
    'ico',
    'tiff',
    'gif',
    'svg',
    'jfif',
    'webp',
    'png',
    'bmp',
    'pjpeg',
    'avif'
]

const currentDirectories = defineModel<VirtualDirectory[]>('currentDirectories', {
    required: true
})
const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})


const NScrollbarRef = ref()
const rootRef = ref<any>()

const imageSrcList = ref<string[]>([])

const activeImageIndex = ref(-1)

const scrollToActiveImage = () => {
    const dom = rootRef.value?.querySelector('.miaoImage-container-row-image-active')
    NScrollbarRef.value.scrollTo({
        top: dom.offsetTop - 30,
        behavior: "smooth"
    })
}

const handleActiveImageIndexBack = (e: any) => {
    e.stopPropagation()
    activeImageIndex.value = (activeImageIndex.value - 1 + imageSrcList.value.length) % imageSrcList.value.length
    nextTick(scrollToActiveImage)
}

const handleActiveImageIndexForward = (e: any) => {
    e.stopPropagation()
    activeImageIndex.value = (activeImageIndex.value + 1 + imageSrcList.value.length) % imageSrcList.value.length
    nextTick(scrollToActiveImage)
}

const handleDrop = (vItems: (VirtualFile | VirtualDirectory)[]) => {
    if (vItems[0].type === 'directory') {
        // @ts-ignore
        currentDirectories.value = [...currentDirectories.value, ...vItems]
    } else {
        // @ts-ignore
        currentFiles.value = [...currentFiles, ...vItems]
    }
    vItems.forEach(v => {
        updateImageSrcList(v)
    })
}

const updateImageSrcList = async (source: VirtualFile | VirtualDirectory) => {
    let srcList: string[]
    if (source.type === 'directory') {
        await source.update()
        srcList = source.files?.filter(v => imageSuffixList.includes(v.name.split('.').pop() ?? '')).map(v => v.url) ?? []
    } else {
        srcList = [source.url]
    }
    imageSrcList.value = uniq([...imageSrcList.value, ...srcList])
}

onMounted(() => {
    [...currentDirectories.value, ...currentFiles.value].forEach(updateImageSrcList)
})
</script>

<style scoped lang="scss">
.miaoImage {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .miaoImage-container {
        width: 100%;
        display: flex;
        flex-wrap: wrap;

        .miaoImage-container-row {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 25%;
            aspect-ratio: 1;

            .miaoImage-container-row-image {
                width: 80%;
                aspect-ratio: 1;
                object-fit: cover;
                transition: width 0.25s;
                box-shadow: 0 0 10px -5px;
                cursor: pointer;
                user-select: none;

                &:hover {
                    width: 90%;
                }

                &-active {
                    width: 90%;
                }
            }
        }
    }

    .miaoImage-mask {
        background-color: rgba(0, 0, 0, 0.444);
    }

    .miaoImage-mask-active {
        max-width: 80%;
        max-height: 80%;
        user-select: none;
    }

    .miaoImage-mask-btn {
        color: #ffffff99;
        width: 7%;
        position: absolute;
        cursor: pointer;

        &-back {
            left: 1%;
        }

        &-forward {
            right: 1%;
        }
    }
}
</style>
