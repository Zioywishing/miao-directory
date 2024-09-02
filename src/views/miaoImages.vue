<template>
    <miao-drop-handler
        @on-virtual-directory="handleDrop"
        @on-virtual-files="handleDrop">
        <div class="miaoImage" ref="rootRef">
            <n-scrollbar ref="NScrollbarRef">
                <div
                    class="miaoImage-container"
                    v-for="imageGroup in imageGroupList">
                    <div class="miaoImage-container-day">
                        <span class="miaoImage-container-day-text">
                            {{ imageGroup.day }}
                        </span>
                    </div>
                    <div
                        class="miaoImage-container-row"
                        v-for="vFile in imageGroup.items"
                        :key="vFile.id">
                        <img
                            :src="vFile.url"
                            class="miaoImage-container-row-image"
                            loading="lazy"
                            :class="
                                activeImage === vFile
                                    ? 'miaoImage-container-row-image-active'
                                    : ''
                            "
                            @click="activeImage = vFile" />
                    </div>
                </div>
            </n-scrollbar>
            <miao-mask
                :show="activeImage !== undefined"
                @click="activeImage = undefined"
                class="miaoImage-mask">
                <ChevronBack
                    class="miaoImage-mask-btn miaoImage-mask-btn-back"
                    @click="handleActiveImageBack" />
                <img
                    :src="activeImage?.url"
                    class="miaoImage-mask-active"
                    @click="(e) => e.stopPropagation()"
                    draggable="false" />
                <ChevronForward
                    class="miaoImage-mask-btn miaoImage-mask-btn-forward"
                    @click="handleActiveImageForward" />
            </miao-mask>
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoMask from '@/components/miaoMask.vue'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import { uniq } from 'lodash'
import { computed, nextTick, onMounted, ref } from 'vue'
import { NScrollbar } from 'naive-ui'
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

const currentDirectories = defineModel<VirtualDirectory[]>(
    'currentDirectories',
    {
        required: true
    }
)
const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const NScrollbarRef = ref()
const rootRef = ref<any>()

const imageFileList = ref<VirtualFile[]>([])

const imageGroupList = computed(() => {
    return groupByDay(imageFileList.value)
})
const activeImage = ref<VirtualFile>()

const groupByDay = (array: VirtualFile[]) => {
    const result = []
    let currentDay = null
    let currentGroup: VirtualFile[] = []

    for (const item of array) {
        const date = new Date(item.stats.mtimeMs)
        const day = `${date.getFullYear()}年 ${String(
            date.getMonth() + 1
        ).padStart(2, '0')}月 ${String(date.getDate()).padStart(2, '0')}日`

        if (day !== currentDay) {
            if (currentGroup.length > 0) {
                result.push({
                    day: currentDay,
                    items: currentGroup
                })
            }
            currentDay = day
            currentGroup = [item]
        } else {
            currentGroup.push(item)
        }
    }
    if (currentGroup.length > 0) {
        result.push({
            day: currentDay,
            items: currentGroup
        })
    }

    return result
}

const scrollToActiveImage = () => {
    const dom = rootRef.value?.querySelector(
        '.miaoImage-container-row-image-active'
    )
    NScrollbarRef.value.scrollTo({
        top: dom.offsetTop - 30,
        behavior: 'smooth'
    })
}

const handleActiveImageBack = (e: any) => {
    e.stopPropagation()
    if (!activeImage.value) {
        return
    }
    const index = imageFileList.value.indexOf(activeImage.value)
    activeImage.value =
        imageFileList.value[
            (index - 1 + imageFileList.value.length) %
                imageFileList.value.length
        ]
    nextTick(scrollToActiveImage)
}

const handleActiveImageForward = (e: any) => {
    e.stopPropagation()
    if (!activeImage.value) {
        return
    }
    const index = imageFileList.value.indexOf(activeImage.value)
    activeImage.value =
        imageFileList.value[
            (index + 1 + imageFileList.value.length) %
                imageFileList.value.length
        ]
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
    vItems.forEach((v) => {
        updateImageSrcList(v)
    })
}

const updateImageSrcList = async (source: VirtualFile | VirtualDirectory) => {
    let newSrcList: string[]
    let newFileList: VirtualFile[]
    if (source.type === 'directory') {
        await source.update()
        newFileList = [
            ...(source.files?.filter((v) =>
                imageSuffixList.includes(v.name.split('.').pop() ?? '')
            ) ?? [])
        ]
        newSrcList =
            source.files
                ?.filter((v) =>
                    imageSuffixList.includes(v.name.split('.').pop() ?? '')
                )
                .map((v) => v.url) ?? []
    } else {
        if (!imageSuffixList.includes(source.name.split('.').pop() ?? '')) {
            return
        }
        newFileList = [source]
        newSrcList = [source.url]
    }
    imageFileList.value = uniq([...imageFileList.value, ...newFileList]).sort(
        (a, b) => a.stats.mtimeMs - b.stats.mtimeMs
    )
}

onMounted(() => {
    ;[...currentFiles.value, ...currentDirectories.value].forEach(
        updateImageSrcList
    )
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
        margin-bottom: 20px;
        margin-top: 20px;
        .miaoImage-container-day {
            width: 100%;
            .miaoImage-container-day-text {
                margin-left: 40px;
                font-size: 20px;
                user-select: none;
                letter-spacing: 1px;
            }
        }

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
