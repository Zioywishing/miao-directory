<template>
    <miao-drop-handler
        @on-virtual-directory="handleDrop"
        @on-virtual-files="handleDrop">
        <miao-message-provider ref="miaoMessageRef">
            <div class="miaoImage" ref="rootRef">
                <n-scrollbar ref="NScrollbarRef" style="max-height: 100%;">
                    <div
                        class="miaoImage-container"
                        v-for="imageGroup in imageGroupList">
                        <div class="miaoImage-container-day">
                            <!-- <div class="miaoImage-container-divide miaoImage-container-divide-before">
                            <div class="miaoImage-container-divide-line"></div>
                        </div> -->
                            <span class="miaoImage-container-day-text">
                                {{ imageGroup.day }}
                            </span>
                            <!-- <div class="miaoImage-container-divide">
                            <div class="miaoImage-container-divide-line"></div>
                        </div> -->
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
                    class="miaoImage-mask"
                    @wheel="handleWheel">
                    <ChevronBack
                        class="miaoImage-mask-btn miaoImage-mask-btn-back"
                        @click="handleActiveImageBack" />
                    <img
                        :src="activeImage?.url"
                        class="miaoImage-mask-active"
                        @click="(e) => e.stopPropagation()"
                        draggable="false"
                        :style="{transform: `scale(${imgViewScale})`}" />
                    <ChevronForward
                        class="miaoImage-mask-btn miaoImage-mask-btn-forward"
                        @click="handleActiveImageForward" />
                </miao-mask>
            </div>
        </miao-message-provider>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoMask from '@/components/miaoMask.vue'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import miaoMessageProvider from '@/components/miaoAlertTipProvider.vue'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import uniq from 'lodash/uniq'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const miaoMessageRef = ref<InstanceType<typeof miaoMessageProvider>>()
const imgViewScale = ref(1)
const imageFileList = ref<VirtualFile[]>([])
const activeImage = ref<VirtualFile>()

const imageGroupList = computed(() => {
    return groupByDay(imageFileList.value)
})

watch(activeImage, () => {
    nextTick(scrollToActiveImage)
    imgViewScale.value = 1
})

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
    dom && NScrollbarRef.value.scrollTo({
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
}

const handleDrop = async (vItems: (VirtualFile | VirtualDirectory)[]) => {
    const length_before = imageFileList.value.length
    if (vItems[0].type === 'directory') {
        // @ts-ignore
        currentDirectories.value = [...currentDirectories.value, ...vItems]
        for (const i of vItems) {
            // @ts-ignore
            await updateImageSrcList(i)
        }
    } else {
        // @ts-ignore
        currentFiles.value = [...currentFiles, ...vItems]
        // @ts-ignore
        await updateImageSrcList(vItems)
    }
    miaoMessageRef.value?.alertTip(
        length_before === imageFileList.value.length
            ? '未发现任何可添加图片'
            : `导入${imageFileList.value.length - length_before}张图片`,
        {
            type:
                length_before === imageFileList.value.length
                    ? 'info'
                    : 'success',
            timeout: 5000
        }
    )
}

const updateImageSrcList = async (source: VirtualFile[] | VirtualDirectory) => {
    let newFileList: VirtualFile[]
    if ('type' in source) {
        await source.update()
        newFileList = [
            ...(source.files?.filter((v) =>
                imageSuffixList.includes(v.name.split('.').pop() ?? '')
            ) ?? [])
        ]
    } else {
        newFileList = [
            ...(source.filter((v) =>
                imageSuffixList.includes(v.name.split('.').pop() ?? '')
            ) ?? [])
        ]
    }
    imageFileList.value = uniq([...imageFileList.value, ...newFileList]).sort(
        (a, b) => -a.stats.mtimeMs + b.stats.mtimeMs
    )
}

const handleWheel = (e: WheelEvent) => {
    if (e.deltaY < 0) {
        imgViewScale.value *= 1.42857
    } else {
        imgViewScale.value /= 1.42857
    }
}

onMounted(async () => {
    const length_before = imageFileList.value.length
    for (const i of [currentFiles.value, ...currentDirectories.value]) {
        await updateImageSrcList(i)
    }
    miaoMessageRef.value?.alertTip(
        length_before === imageFileList.value.length
            ? '未发现任何新增图片'
            : `导入${imageFileList.value.length - length_before}张图片`,
        {
            type:
                length_before === imageFileList.value.length
                    ? 'info'
                    : 'success',
            timeout: 5000
        }
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
            display: flex;
            align-items: center;
            position: relative;
            margin: 0 20px;

            .miaoImage-container-divide {
                flex: 1;
                height: 100%;
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .miaoImage-container-divide-line {
                height: 3px;
                width: 100%;
                border-radius: 5px;
                background-color: rgb(244 244 244);
            }

            .miaoImage-container-divide-before {
                flex: 0.1;
            }

            .miaoImage-container-day-text {
                margin: 0 0 0 10px;
                font-size: 15px;
                user-select: none;
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
        overflow: hidden;
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
