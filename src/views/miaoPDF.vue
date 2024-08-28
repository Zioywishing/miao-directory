<template>
    <div class="miao-container">
        <div ref="pdfEl" class="miao-container-pdf"></div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { VirtualFile } from '@/class/VirtualDirectory'

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const pdfEl = ref<HTMLDivElement>()

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
    // 循环渲染每一页
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        let pixelRatio = 3
        let viewport = page.getViewport({ scale: 1 })
        let divPage = window.document.createElement('div') // canvas的外层div
        // 使用canvas渲染
        let canvas = divPage.appendChild(
            window.document.createElement('canvas')
        )
        divPage.className = 'page'
        // @ts-ignore
        pdfEl.value.appendChild(divPage)
        canvas.width = viewport.width * pixelRatio // 计算宽度
        canvas.height = viewport.height * pixelRatio
        let renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport: viewport,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0]
        }
        await page.render(renderContext).promise // 一页一页的渲染
        divPage.className = 'page complete'
    }
    console.log('pdf页面全部渲染完毕', pdf.numPages, pdf)
})
</script>

<style scoped lang="scss">
.miao-container {
    width: 100%;
    height: 100%;
    background-color: rgb(53, 53, 53);
    .miao-container-pdf {
        max-width: 100%;
        max-height: 100%;
        overflow: scroll;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .page {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    canvas {
        width: 100%;
        height: 100%;
    }
}
</style>
