<template>
    <div class="miao-container">
        <div class="miao-container-topBar">
            <div class="miao-container-topBar-btn" @click="() => handleZoom(10)" title="快速缩小">--</div>
            <div class="miao-container-topBar-btn" @click="() => handleZoom()" title="缩小">-</div>
            <div class="miao-container-topBar-btn" @click="() => handleResetMargin()" title="还原">还原缩放</div>
            <div class="miao-container-topBar-btn" @click="() => handleShrink()" title="放大">+</div>
            <div class="miao-container-topBar-btn" @click="() => handleShrink(10)" title="快速放大">++</div>
        </div>
        <NScrollbar>
            <div class="miao-container-pdf" :style="{alignItems: pdfMargin < 0 ? 'baseline' : 'center'}">
                <div ref="pdfEl" class="miao-container-pdf-content" :style="{ width: `calc( 100% - ${pdfMargin}px)`}">
                </div>
            </div>
        </NScrollbar>
        <div class="miao-container-loading" v-if="isLoading">{{ loadingPercent === -1 ? '缓存中' :
            `渲染进度：${canvasList.length}/${pdfPageCount}` }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowReactive } from 'vue'
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { VirtualFile } from '@/class/VirtualDirectory'
import { NScrollbar } from 'naive-ui';

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const pdfEl = ref<HTMLDivElement>()

// 通过margin来实现缩小功能
const pdfMargin = ref<number>(0)

const pdfPageCount = ref<number>(-1)

const isLoading = computed(() => {
    return canvasList.length !== pdfPageCount.value
})

const canvasList = shallowReactive<HTMLCanvasElement[]>([])

const handleZoom = (index?: number) => {
    const _index = index ?? 1
    pdfMargin.value += 10 * _index
}

const handleShrink = (index?: number) => {
    const _index = index ?? 1
    // if (pdfMargin.value - 10 * _index <= 0) {
    //     return pdfMargin.value = 0
    // }
    pdfMargin.value -= 10 * _index
}

const handleResetMargin = () => {
    pdfMargin.value = 0
}

const loadingPercent = computed(() => {
    if (pdfPageCount.value === -1) {
        return -1
    }
    return canvasList.length / pdfPageCount.value
})

onMounted(async () => {
    const pdfSrc = currentFiles.value[0].url
    // @ts-ignore
    const PDFJS = await import('pdfjs-dist/build/pdf.mjs')
    if (typeof window !== 'undefined' && 'Worker' in window) {
        PDFJS.GlobalWorkerOptions.workerPort = new PdfjsWorker()
    }
    // 加载文档
    let loadingTask = PDFJS.getDocument({ url: pdfSrc })
    loadingTask.__PDFDocumentLoadingTask = true
    const pdf = await loadingTask.promise // 使用await等待加载完毕
    pdfPageCount.value = pdf.numPages
    // 循环渲染每一页
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        let pixelRatio = 3
        let viewport = page.getViewport({ scale: 1 })
        // 使用canvas渲染
        let canvas = window.document.createElement('canvas')
        canvasList.push(canvas)
        // @ts-ignore
        pdfEl.value.appendChild(canvas)
        canvas.width = viewport.width * pixelRatio // 计算宽度
        canvas.height = viewport.height * pixelRatio
        let renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0]
        }
        await page.render(renderContext).promise // 一页一页的渲染
    }
})
</script>

<style scoped lang="scss">
.miao-container {
    width: 100%;
    height: 100%;
    background-color: rgb(53, 53, 53);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;

    .miao-container-topBar {
        box-sizing: border-box;
        padding: 0 30px;
        height: 30px;
        width: 100%;
        background-color: rgb(170, 176, 182);
        display: flex;
        justify-content: space-around;
        align-items: center;

        &-btn {
            cursor: pointer;
            user-select: none;
            height: 80%;
            padding: 0 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: larger;
            letter-spacing: 1px;
            color: black;
            border-radius: 5px;

            &:hover {
                background-color: #eaeaea42;
            }
        }
    }

    .miao-container-pdf {
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        .miao-container-pdf-content {
            display: flex;
            flex-direction: column;
        }
    }

    .miao-container-loading {
        position: absolute;
        top: 40px;
        background-color: aliceblue;
        border: 1px solid black;
        height: 40px;
        width: 200px;
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 15px;
        letter-spacing: 5px;
        user-select: none;
    }
}
</style>
