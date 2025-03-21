<template>
   <miao-drop-handler @on-virtual-files="handleDrop">
      <miao-message-provider ref="miaoMessageRef">
         <div class="mnist-demo" ref="rootRef">
            <n-card title="MNIST手写数字识别" class="mnist-demo-card">
               <n-grid :cols="2" :x-gap="12">
                  <n-grid-item>
                     <div class="mnist-demo-section">
                        <h3>手写数字画板 (28×28像素)</h3>
                        <div class="canvas-container">
                           <canvas ref="drawingCanvasRef" width="28" height="28" class="drawing-canvas"
                              @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing"
                              @mouseleave="stopDrawing" @touchstart.prevent="handleTouchStart"
                              @touchmove.prevent="handleTouchMove" @touchend.prevent="stopDrawing"></canvas>
                           <div class="canvas-controls">
                              <n-button @click="clearCanvas">清除</n-button>
                              <n-button type="primary" @click="recognizeDigit" :disabled="!onnxModel || isProcessing"
                                 :loading="isProcessing">
                                 识别
                              </n-button>
                           </div>
                        </div>
                     </div>
                  </n-grid-item>
                  <n-grid-item>
                     <div class="mnist-demo-section">
                        <h3>ONNX模型</h3>
                        <div v-if="onnxModel" class="mnist-demo-model-info">
                           <p>模型: {{ onnxModel.name }}</p>
                           <p>大小: {{ formatFileSize(onnxModel.size) }}</p>
                        </div>
                        <n-empty v-else description="无模型" />

                        <div class="mnist-demo-result" v-if="modelOutput">
                           <h3>识别结果:</h3>
                           <div class="result-container">
                              <div class="result-digit">{{ recognizedDigit }}</div>
                              <!-- <n-progress type="line" :percentage="confidence" :indicator-placement="'inside'" :color="resultColor" /> -->
                              <div class="confidence-text">置信度: {{ (confidence).toFixed(2) }}%</div>
                           </div>
                        </div>
                     </div>
                  </n-grid-item>
               </n-grid>
            </n-card>
         </div>
      </miao-message-provider>
   </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import miaoMessageProvider from '@/components/miaoAlertTipProvider.vue'
import { VirtualFile } from '@/class/VirtualDirectory'
import VirtualDirectory from '@/class/VirtualDirectory'
import { onMounted, ref, computed } from 'vue'
// @ts-ignore
let ort: any;

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
   required: true
})

const currentDirectories = defineModel<VirtualDirectory[]>(
   'currentDirectories',
   {
      required: true
   }
)

// 画板常量
const GRID_SIZE = 28  // MNIST 模型的输入是 28x28
// const DISPLAY_SCALE = 10 // 显示缩放比例，用于CSS缩放

const miaoMessageRef = ref<InstanceType<typeof miaoMessageProvider>>()
const rootRef = ref()
const drawingCanvasRef = ref<HTMLCanvasElement | null>(null)
const isProcessing = ref(false)
const modelOutput = ref<number[] | null>(null)
const recognizedDigit = ref<number | null>(null)
const confidence = ref<number>(0)
const resultColor = ref('#18a058')

// 绘图相关状态
const isDrawing = ref(false)
const lastPos = ref<{ x: number, y: number } | null>(null)
const gridData = ref<number[][]>(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)))

// 获取ONNX模型文件
const onnxModel = computed(() => {
   for (const file of currentFiles.value) {
      if (file.name.toLowerCase().endsWith('.onnx')) {
         return file
      }
   }
   return null
})

// 获取Canvas上下文
const getContext = (): CanvasRenderingContext2D | null => {
   const canvas = drawingCanvasRef.value
   if (!canvas) return null
   const ctx = canvas.getContext('2d')
   if (!ctx) return null
   return ctx
}

// 将显示坐标转换为Canvas像素坐标
const convertCoordsToCanvas = (displayX: number, displayY: number): { x: number, y: number } => {
   const canvas = drawingCanvasRef.value
   if (!canvas) return { x: 0, y: 0 }

   // 获取Canvas的CSS尺寸
   const rect = canvas.getBoundingClientRect()

   // 计算缩放比例
   const scaleX = canvas.width / rect.width
   const scaleY = canvas.height / rect.height

   // 将显示坐标转换为Canvas坐标
   const canvasX = (displayX - rect.left) * scaleX
   const canvasY = (displayY - rect.top) * scaleY

   // 返回整数坐标（因为我们是28x28的像素级别操作）
   return {
      x: Math.floor(canvasX),
      y: Math.floor(canvasY)
   }
}

// 画板绘图相关函数
const clearCanvas = () => {
   const ctx = getContext()
   if (!ctx) return

   // 清空Canvas
   ctx.fillStyle = 'white'
   ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE)

   // 清空数据
   gridData.value = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))

   // 清除结果
   modelOutput.value = null
   recognizedDigit.value = null
   confidence.value = 0
}

// 开始绘制
const startDrawing = (e: MouseEvent) => {
   isDrawing.value = true

   const { x, y } = convertCoordsToCanvas(e.clientX, e.clientY)
   lastPos.value = { x, y }
   drawPixel(x, y)
}

// 绘制
const draw = (e: MouseEvent) => {
   if (!isDrawing.value || !lastPos.value) return

   const { x, y } = convertCoordsToCanvas(e.clientX, e.clientY)
   if (x === lastPos.value.x && y === lastPos.value.y) return // 避免在同一像素重复绘制

   // 绘制当前像素
   drawPixel(x, y)

   // 绘制连续线条（Bresenham算法）
   const { x: lastX, y: lastY } = lastPos.value
   drawLine(lastX, lastY, x, y)

   // 更新最后位置
   lastPos.value = { x, y }
}

// 停止绘制
const stopDrawing = () => {
   isDrawing.value = false
   lastPos.value = null
   // 更新到gridData（因为我们在绘制时已经更新了，所以这里不需要额外操作）

   // 如果有ONNX模型且当前没有在推理中，则自动进行推理
   // if (onnxModel.value && !isProcessing.value) {
   //    recognizeDigit()
   // }
}

// 绘制单个像素
const drawPixel = (x: number, y: number) => {
   if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return

   const ctx = getContext()
   if (!ctx) return

   // 绘制到Canvas
   ctx.fillStyle = 'black'
   ctx.fillRect(x, y, 1, 1)

   // 更新数据
   gridData.value[y][x] = 1
}

// 使用Bresenham算法绘制线条
const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
   const dx = Math.abs(x1 - x0)
   const dy = Math.abs(y1 - y0)
   const sx = x0 < x1 ? 1 : -1
   const sy = y0 < y1 ? 1 : -1
   let err = dx - dy

   while (true) {
      // 如果是终点，结束循环
      if (x0 === x1 && y0 === y1) break

      const e2 = 2 * err
      if (e2 > -dy) {
         err -= dy
         x0 += sx
      }
      if (e2 < dx) {
         err += dx
         y0 += sy
      }

      drawPixel(x0, y0)
   }
}

// 处理触摸事件
const handleTouchStart = (e: TouchEvent) => {
   if (e.touches.length !== 1) return

   const touch = e.touches[0]
   const { x, y } = convertCoordsToCanvas(touch.clientX, touch.clientY)

   isDrawing.value = true
   lastPos.value = { x, y }
   drawPixel(x, y)
}

const handleTouchMove = (e: TouchEvent) => {
   if (!isDrawing.value || !lastPos.value) return
   if (e.touches.length !== 1) return

   const touch = e.touches[0]
   const { x, y } = convertCoordsToCanvas(touch.clientX, touch.clientY)

   if (x === lastPos.value.x && y === lastPos.value.y) return // 避免在同一像素重复绘制

   // 绘制当前像素
   drawPixel(x, y)

   // 绘制连续线条
   const { x: lastX, y: lastY } = lastPos.value
   drawLine(lastX, lastY, x, y)

   // 更新最后位置
   lastPos.value = { x, y }
}

// 从Canvas更新gridData（在本实现中，我们在绘制时已经同步更新了gridData，这个函数保留用于检查）
const updateGridDataFromCanvas = () => {
   const ctx = getContext()
   if (!ctx) return

   // 从Canvas读取像素数据
   const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE)
   const data = imageData.data

   // 更新gridData
   for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
         const pixelIndex = (y * GRID_SIZE + x) * 4
         const r = data[pixelIndex]
         const g = data[pixelIndex + 1]
         const b = data[pixelIndex + 2]

         // 简单阈值处理，非白即黑
         gridData.value[y][x] = (r + g + b < 600) ? 1 : 0
      }
   }
}

// 处理文件拖放
const handleDrop = (vFiles: VirtualFile[]) => {
   for (const file of vFiles) {
      if (file.name.toLowerCase().endsWith('.onnx')) {
         currentFiles.value.unshift(file)
         miaoMessageRef.value?.alertTip('已添加ONNX模型文件', { type: 'success', timeout: 2000 })
         return
      }
   }
}

// 格式化文件大小
const formatFileSize = (size: number): string => {
   if (size < 1024) {
      return `${size} B`
   } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
   } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
   }
}

// 将grid数据预处理为MNIST输入格式
const preprocessGridData = (): Float32Array => {
   // 转换为MNIST模型期望的格式 (1x1x28x28)
   const inputData = new Float32Array(GRID_SIZE * GRID_SIZE)

   for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
         // 计算一维索引
         const index = row * GRID_SIZE + col
         // 存储像素值（MNIST期望格式为：黑色笔画对应较高的值，白色背景对应较低的值）
         inputData[index] = gridData.value[row][col]
      }
   }

   return inputData
}

// 识别手写数字
const recognizeDigit = async () => {
   if (!onnxModel.value) {
      miaoMessageRef.value?.alertTip('请先选择ONNX模型文件', { type: 'error', timeout: 2000 })
      return
   }

   // 在识别前检查并更新gridData
   updateGridDataFromCanvas()

   isProcessing.value = true
   modelOutput.value = null
   recognizedDigit.value = null
   confidence.value = 0

   try {
      // 显示处理信息
      const alertUpdate = miaoMessageRef.value!.alertTip('正在加载ONNX模型...', { type: 'info', timeout: 2000 })

      // 1. 加载模型
      const modelResponse = await fetch(onnxModel.value.url)
      const modelBuffer = await modelResponse.arrayBuffer()
      alertUpdate('正在创建推理会话...')

      // 创建ONNX会话
      const session = await ort.InferenceSession.create(modelBuffer)

      // 2. 预处理画布数据
      alertUpdate('正在预处理图像...')
      const inputData = preprocessGridData()

      // 创建输入张量
      // MNIST模型通常期望形状为[1, 1, 28, 28]的输入
      const inputTensor = new ort.Tensor('float32', inputData, [1, 1, 28, 28])

      alertUpdate('执行模型推理...')

      // 3. 运行模型推理 - 使用"Input3"作为输入名称
      const outputs = await session.run({
         // 使用正确的输入名称
         Input3: inputTensor
      })

      // 4. 处理模型输出
      alertUpdate('处理模型输出结果...')

      // 获取输出数据
      const outputTensor = Object.values(outputs)[0]
      const outputData = [...(outputTensor as { data: Float32Array }).data]

      // 设置结果
      modelOutput.value = outputData

      // 找出最可能的数字（最大概率对应的索引）
      let maxIndex = 0
      let maxProb = outputData[0]

      for (let i = 1; i < outputData.length; i++) {
         if (outputData[i] > maxProb) {
            maxProb = outputData[i]
            maxIndex = i
         }
      }

      recognizedDigit.value = maxIndex

      // 计算置信度百分比
      const softmaxSum = outputData.reduce((sum, val) => sum + Math.exp(val), 0)
      const probability = Math.exp(maxProb) / softmaxSum
      confidence.value = probability * 100

      // 设置结果颜色
      if (confidence.value > 90) {
         resultColor.value = '#18a058' // 绿色
      } else if (confidence.value > 70) {
         resultColor.value = '#2080f0' // 蓝色
      } else if (confidence.value > 50) {
         resultColor.value = '#f0a020' // 橙色
      } else {
         resultColor.value = '#d03050' // 红色
      }

      alertUpdate('识别完成!', { type: 'success' })
   } catch (error) {
      console.error('ONNX处理错误:', error)
      miaoMessageRef.value?.alertTip(`处理出错: ${error}`, { type: 'error', timeout: 2000 })
   } finally {
      isProcessing.value = false
   }
}

onMounted(async () => {
   // 如果传入了onnxruntime-web，则使用传入的，否则从jsdelivr加载
   if (currentDirectories.value && currentDirectories.value.length > 0 && currentDirectories.value[0]?.url) {
      const ortModule = await import(/* @vite-ignore */ `${currentDirectories.value[0]?.url}/dist/ort.all.min.mjs`);
      ort = ortModule;
   } else {
      // 从jsdelivr加载
      //  @ts-ignore
      const ortModule = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.all.min.js');
      ort = ortModule;
   }

   // 初始化绘图区域
   if (drawingCanvasRef.value) {
      initCanvas();
   }
})

// 添加初始化画布函数
const initCanvas = () => {
   // 初始化Canvas
   const ctx = getContext()
   if (ctx) {
      // 设置白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE)

      // 设置抗锯齿（关闭，保证像素对齐）
      ctx.imageSmoothingEnabled = false
   }

   // 检查是否有ONNX模型
   if (onnxModel.value) {
      miaoMessageRef.value?.alertTip('已检测到ONNX模型文件，您可以绘制数字进行识别', { type: 'info', timeout: 2000 })
   } else {
      miaoMessageRef.value?.alertTip('请添加MNIST模型(.onnx)文件', { type: 'info', timeout: 2000 })
   }
}
</script>

<style scoped>
.mnist-demo {
   width: 100%;
   height: 100%;
   padding: 16px;
   overflow: auto;
}

.mnist-demo-card {
   margin-bottom: 16px;
}

.mnist-demo-section {
   padding: 8px;
   text-align: center;
   border: 1px dashed #ccc;
   border-radius: 4px;
   min-height: 320px;
   display: flex;
   flex-direction: column;
   justify-content: flex-start;
}

.canvas-container {
   display: flex;
   flex-direction: column;
   align-items: center;
   margin-top: 8px;
}

.drawing-canvas {
   width: 280px;
   height: 280px;
   border: 1px solid #ccc;
   touch-action: none;
   image-rendering: pixelated;
   /* 像素化渲染 */
   image-rendering: crisp-edges;
   /* 确保边缘清晰 */
   background-color: white;
   box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.canvas-controls {
   display: flex;
   justify-content: center;
   gap: 12px;
   margin-top: 16px;
}

.mnist-demo-model-info {
   text-align: left;
   width: 100%;
   margin-bottom: 20px;
}

.mnist-demo-result {
   margin-top: 16px;
   border-top: 1px solid #eee;
   padding-top: 16px;
   width: 100%;
}

.result-container {
   display: flex;
   flex-direction: column;
   align-items: center;
   margin-top: 16px;
}

.result-digit {
   font-size: 64px;
   font-weight: bold;
   line-height: 1;
   margin-bottom: 16px;
}

.confidence-text {
   margin-top: 8px;
   font-size: 14px;
   color: #666;
}
</style>