<template>
   <miao-message-provider ref="miaoMessageRef">
      <div class="miao-container">
         <div class="miao-container-topBar">
            <div class="topBar-main">
               <div class="top-btn" @click="() => handleZoom(10)" title="快速缩小">--</div>
               <div class="top-btn" @click="() => handleZoom()" title="缩小">-</div>
               <div class="top-btn" @click="() => handleResetMargin()" title="重置">重置</div>
               <div class="top-btn" @click="() => handleShrink()" title="放大">+</div>
               <div class="top-btn" @click="() => handleShrink(10)" title="快速放大">++</div>
               <div class="scale-indicator">{{ Math.round(scale * 100) }}%</div>
            </div>
         </div>
         <NScrollbar ref="scrollRef">
            <div
               class="miao-container-pdf"
               @pointerdown="onPointerDown"
               @pointermove="onPointerMove"
               @pointerup="onPointerUp"
               @pointercancel="onPointerCancel"
               :class="{ 'is-dragging': isDragging}"
               :style="{'align-items': scale > 1 ? 'unset' : 'center' }">

               <div
                  ref="pdfEl"
                  class="miao-container-pdf-content"
                  :style="{
                     width: `${(scale * 100).toFixed(2)}%`,
                  }"></div>
            </div>
         </NScrollbar>
      </div>
   </miao-message-provider>
</template>

<script setup lang="ts">
import miaoMessageProvider from '@/components/miaoAlertTipProvider.vue'
import { onMounted, ref, shallowReactive, onBeforeUnmount } from 'vue'
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import { VirtualFile } from '@/class/VirtualDirectory'
import { NScrollbar } from 'naive-ui'

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
   required: true
})

const pdfEl = ref<HTMLDivElement>()
const miaoMessageRef = ref<InstanceType<typeof miaoMessageProvider>>()
// 新缩放方案：使用等比scale
const scale = ref<number>(1)
const minScale = 0.5
const maxScale = 4

const scrollRef = ref<InstanceType<typeof NScrollbar> | null>(null)
const isDragging = ref(false)
let pressTimeoutId: number | null = null
let dragging = false
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0
const longPressDelay = 100

// 更稳健的滚动容器解析逻辑，避免依赖 $el.querySelector
const scrollContainer = ref<HTMLElement | null>(null)
const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
   let cur: HTMLElement | null = el?.parentElement ?? null
   while (cur) {
      const style = window.getComputedStyle(cur)
      const overflowY = style.overflowY
      const overflowX = style.overflowX
      const canScroll =
         (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
         (cur.scrollHeight > cur.clientHeight || cur.scrollWidth > cur.clientWidth)
      if (canScroll) return cur
      cur = cur.parentElement
   }
   return null
}
const resolveScrollContainer = () => {
   const fromScrollbar = pdfEl.value?.closest('.n-scrollbar')?.querySelector('.n-scrollbar-container') as HTMLElement | null
   scrollContainer.value = fromScrollbar ?? findScrollableParent(pdfEl.value ?? null)
}
const getScrollEl = (): HTMLElement | null => {
   if (!scrollContainer.value) resolveScrollContainer()
   return scrollContainer.value
}

const onPointerDown = (e: PointerEvent) => {
   resolveScrollContainer()
   const el = getScrollEl()
   if (!el) return
   startX = e.clientX
   startY = e.clientY
   startLeft = el.scrollLeft
   startTop = el.scrollTop
   dragging = false
   ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
   if (pressTimeoutId) window.clearTimeout(pressTimeoutId)
   pressTimeoutId = window.setTimeout(() => {
      dragging = true
      isDragging.value = true
      document.body.style.cursor = 'grabbing'
   }, longPressDelay)
}

const onPointerMove = (e: PointerEvent) => {
   const el = getScrollEl()
   if (!el || !dragging) return
   const dx = e.clientX - startX
   const dy = e.clientY - startY
   let newLeft = startLeft - dx
   let newTop = startTop - dy
   const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth)
   const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
   newLeft = Math.max(0, Math.min(maxLeft, newLeft))
   newTop = Math.max(0, Math.min(maxTop, newTop))
   el.scrollLeft = newLeft
   el.scrollTop = newTop
   e.preventDefault()
}

const endDrag = (e: PointerEvent) => {
   if (pressTimeoutId) {
      window.clearTimeout(pressTimeoutId)
      pressTimeoutId = null
   }
   if (dragging) {
      isDragging.value = false
      document.body.style.cursor = ''
   }
   dragging = false
   try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
   } catch {}
}
const onPointerUp = endDrag
const onPointerCancel = endDrag

onBeforeUnmount(() => {
   if (pressTimeoutId) window.clearTimeout(pressTimeoutId)
})

// 等比缩放并保持视窗中心不抖动
const applyZoom = (multiplier: number) => {
   // const el = getScrollEl()
   const oldScale = scale.value
   let newScale = oldScale * multiplier
   newScale = Math.max(minScale, Math.min(maxScale, newScale))
   // const ratio = newScale / oldScale
   // if (el) {
   //    const cx = el.clientWidth / 2
   //    const cy = el.clientHeight / 2
   //    // const targetLeft = (el.scrollLeft + cx) * ratio - cx
   //    // const targetTop = (el.scrollTop + cy) * ratio - cy
   //    scale.value = +newScale.toFixed(4)
   //    // requestAnimationFrame(() => {
   //    //    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth)
   //    //    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight)
   //    //    el.scrollLeft = Math.max(0, Math.min(maxLeft, targetLeft))
   //    //    el.scrollTop = Math.max(0, Math.min(maxTop, targetTop))
   //    // })
   //    return
   // }
   scale.value = +newScale.toFixed(4)
}

const handleZoom = (index?: number) => {
   const _index = index ?? 1
   const factor = 1 + 0.1 * _index
   applyZoom(1 / factor)
}

const handleShrink = (index?: number) => {
   const _index = index ?? 1
   const factor = 1 + 0.1 * _index
   applyZoom(factor)
}

const handleResetMargin = () => {
   // const el = getScrollEl()
   scale.value = 1
}

const pdfPageCount = ref<number>(-1)
const canvasList = shallowReactive<HTMLCanvasElement[]>([])

onMounted(async () => {
   // 初始解析一次滚动容器（等待一帧确保DOM就绪）
   requestAnimationFrame(() => resolveScrollContainer())
   const setLoadingMessage = miaoMessageRef.value?.alertTip('加载PDF插件中', {
      type: 'info',
      timeout: -1
   })
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
      setLoadingMessage && setLoadingMessage(`渲染进度：${i}/${pdf.numPages}`)
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
   setLoadingMessage &&
      setLoadingMessage(`渲染PDF完成`, {
         type: 'success',
         timeout: 3456
      })
})
</script>

<style scoped lang="scss">
.miao-container {
   --bar-height: 44px;
   --bar-bg: linear-gradient(90deg, #eef1f5 0%, #e3e7ec 100%);
   --btn-bg: #ffffff;
   --btn-hover: #f2f4f7;
   --btn-active: #e6e9ef;
   --btn-border: #d7dbe2;
   --text: #1f2328;
   --subtext: #6b7280;

   width: 100%;
   height: 100%;
   background-color: rgb(201, 201, 201);
   overflow: hidden;
   display: flex;
   flex-direction: column;
   align-items: center;

   .miao-container-topBar {
      box-sizing: border-box;
      padding: 0 12px;
      height: var(--bar-height);
      width: 100%;
      background: var(--bar-bg);
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      backdrop-filter: saturate(180%) blur(8px);

      .topBar-main {
         display: flex;
         align-items: center;
         gap: 8px;
         position: relative;
         user-select: none;
      }

      .top-btn {
         cursor: pointer;
         user-select: none;
         height: 30px;
         min-width: 34px;
         padding: 0 10px;
         display: inline-flex;
         align-items: center;
         justify-content: center;
         font-size: 14px;
         letter-spacing: 0.5px;
         color: var(--text);
         background-color: var(--btn-bg);
         border: 1px solid var(--btn-border);
         border-radius: 8px;
         box-shadow: 0 1px 0 rgba(0,0,0,0.02);
         transition: background-color .15s ease, transform .08s ease, box-shadow .15s ease;

         &:hover { background-color: var(--btn-hover); }
         &:active { background-color: var(--btn-active); transform: scale(0.98); }
      }

      .scale-indicator {
         position: absolute;
         right: -60px;
         min-width: 54px;
         text-align: center;
         font-size: 13px;
         color: var(--subtext);
         padding: 0 8px;
      }

      .hint { color: var(--subtext); font-size: 12px; }
   }

   .miao-container-pdf {
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center; // 居中以便缩小时居中显示
      touch-action: none; // 以便自定义拖动
      &.is-dragging { cursor: grabbing; }

      .miao-container-pdf-content {
         display: flex;
         flex-direction: column;
         transition: width .12s ease, padding-top .12s ease;
         will-change: width, padding-top;

         // 让Canvas随容器宽度等比缩放，保证显示完整
         canvas {
            width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 12px auto;
            background: #fff;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
         }
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
