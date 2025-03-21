<template>
   <miao-drop-handler @on-virtual-files="handleDrop">
      <miao-message-provider ref="miaoMessageRef">
         <div class="onnx-demo" ref="rootRef">
            <n-card title="ONNX模型演示" class="onnx-demo-card">
               <n-grid :cols="2" :x-gap="12">
                  <n-grid-item>
                     <div class="onnx-demo-section">
                        <h3>输入图像</h3>
                        <div v-if="inputImage" class="onnx-demo-image-container">
                           <img :src="inputImage.url" class="onnx-demo-image" />
                           <p>{{ inputImage.name }}</p>
                        </div>
                        <n-empty v-else description="无图像" />
                     </div>
                  </n-grid-item>
                  <n-grid-item>
                     <div class="onnx-demo-section">
                        <h3>ONNX模型</h3>
                        <div v-if="onnxModel" class="onnx-demo-model-info">
                           <p>模型: {{ onnxModel.name }}</p>
                           <p>大小: {{ formatFileSize(onnxModel.size) }}</p>
                        </div>
                        <n-empty v-else description="无模型" />
                     </div>
                  </n-grid-item>
               </n-grid>

               <!-- <div class="onnx-demo-control">
                  <n-button type="primary" @click="processImage" :disabled="!inputImage || !onnxModel || isProcessing"
                     :loading="isProcessing">
                     处理图像
                  </n-button>
               </div> -->

               <div class="onnx-demo-result" v-if="modelOutput">
                  <h3>模型输出:</h3>
                  <n-card embedded>
                     <pre>{{ modelOutput }}</pre>
                  </n-card>
               </div>
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
import { onMounted, ref, computed, watch } from 'vue'
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

const miaoMessageRef = ref<InstanceType<typeof miaoMessageProvider>>()
const rootRef = ref()
const isProcessing = ref(false)
const modelOutput = ref<string | null>(null)

// 获取第一个图像文件
const inputImage = computed(() => {
   const imageSuffixList = [
      'xbm', 'tif', 'pjp', 'svgz', 'jpg', 'jpeg', 'ico', 'tiff', 'gif',
      'svg', 'jfif', 'webp', 'png', 'bmp', 'pjpeg', 'avif'
   ]

   for (const file of currentFiles.value) {
      for (const suffix of imageSuffixList) {
         if (file.name.toLowerCase().endsWith(suffix)) {
            return file
         }
      }
   }

   return null
})

// 获取ONNX模型文件
const onnxModel = computed(() => {
   for (const file of currentFiles.value) {
      if (file.name.toLowerCase().endsWith('.onnx')) {
         return file
      }
   }

   return null
})

const handleDrop = (vFiles: VirtualFile[]) => {
   const imageSuffixList = [
      'xbm', 'tif', 'pjp', 'svgz', 'jpg', 'jpeg', 'ico', 'tiff', 'gif',
      'svg', 'jfif', 'webp', 'png', 'bmp', 'pjpeg', 'avif'
   ]
   let imgFile: VirtualFile | null = null
   out: for (const file of vFiles) {
      for (const suffix of imageSuffixList) {
         if (file.name.toLowerCase().endsWith(suffix)) {
            imgFile = file
            break out
         }
      }
   }
   if (imgFile) {
      currentFiles.value.unshift(imgFile)
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

const resizeImage = async (img: ImageBitmap, width: number, height: number): Promise<ImageBitmap> => {
   const canvas = new OffscreenCanvas(width, height)
   canvas.width = width
   canvas.height = height
   const ctx = canvas.getContext('2d')
   ctx?.drawImage(img, 0, 0, width, height)
   return await createImageBitmap(canvas)
}

// 处理图像
const processImage = async () => {
   if (!inputImage.value || !onnxModel.value) {
      miaoMessageRef.value?.alertTip('请选择图像和ONNX模型文件', { type: 'error', timeout: 2000 })
      return
   }

   isProcessing.value = true
   modelOutput.value = null

   try {
      // 显示处理信息
      const alertUpdate = miaoMessageRef.value!.alertTip('正在加载ONNX模型...', { type: 'info', timeout: 2000 })

      // 1. 加载模型
      const modelResponse = await fetch(onnxModel.value.url)
      const modelBuffer = await modelResponse.arrayBuffer()
      alertUpdate('正在创建推理会话...')

      // 创建ONNX会话
      const session = await ort.InferenceSession.create(modelBuffer)

      // 2. 加载和预处理图像
      alertUpdate('正在加载图像...')
      const imgResponse = await fetch(inputImage.value.url)
      const imgBlob = await imgResponse.blob()

      // 将图像转换为适合模型的格式
      alertUpdate('正在预处理图像...')
      const size = 64
      const img = await createImageBitmap(imgBlob)
      const data = await resizeImage(img, size, size)

      const canvas = new OffscreenCanvas(size, size)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.drawImage(data, 0, 0, size, size)
      const imageData = ctx.getImageData(0, 0, size, size).data

      const greyScale = [];
      for (let i = 0; i < imageData.length; i += 4) {
         greyScale.push(
            (imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114 - 127.5) /
            127.5
         );
      }
      const inputTensor = new ort.Tensor('float32', new Float32Array(greyScale), [1, 1, size, size])

      alertUpdate('执行模型推理...')

      // 3. 运行模型推理
      const outputMap = await session.run({
         // 这里的键名应该根据实际模型的输入名称进行调整
         Input2505: inputTensor
      })

      // 4. 处理模型输出
      alertUpdate('处理模型输出结果...')

      // 获取输出数据（假设输出张量名为"output"，可能需要根据实际模型调整）
      const outputTensor = Object.values(outputMap)[0]
      // 将输出格式化为可读内容
      const formattedOutput = JSON.stringify(
         {
            // shape: outputTensor.dims,
            data: [...[...(outputTensor as { data: Float32Array }).data].entries()].sort((a, b) => b[1] - a[1]).map(([index, value]) => ({ index, value }))
         },
         null,
         2
      )

      // 设置结果
      modelOutput.value = formattedOutput

      alertUpdate('处理完成!', { type: 'success' })
   } catch (error) {
      console.error('ONNX处理错误:', error)
      miaoMessageRef.value?.alertTip(`处理出错`, { type: 'error', timeout: 2000 })
      modelOutput.value = `错误: ${error}`
   } finally {
      isProcessing.value = false
   }
}

onMounted(async () => {
   console.log('currentDirectories.value[0].url', currentDirectories.value[0]?.url)
   // 如果传入了onnxruntime-web，则使用传入的，否则从jsdelivr加载
   if (currentDirectories.value && currentDirectories.value.length > 0 && currentDirectories.value[0].url) {
      const ortModule = await import(/* @vite-ignore */ `${currentDirectories.value[0].url}dist/ort.all.min.mjs`);
      ort = ortModule;
      console.log('ort', ort)
   } else {
      // 从jsdelivr加载
      //  @ts-ignore
      const ortModule = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.all.min.js');
      ort = ortModule;
   }
   
   // 初始化模型
   await initModel();
})

// 初始化模型函数
const initModel = async () => {
   // 初始化时检查是否有适合的文件
   if (inputImage.value && onnxModel.value) {
      miaoMessageRef.value?.alertTip('已检测到图像和ONNX模型，可以进行处理', { type: 'info', timeout: 2000 })
   }

   watch(() => inputImage.value, () => {
      processImage()
   }, {
      immediate: true
   })
}
</script>

<style scoped>
.onnx-demo {
   width: 100%;
   height: 100%;
   padding: 16px;
   overflow: auto;
}

.onnx-demo-card {
   margin-bottom: 16px;
}

.onnx-demo-section {
   padding: 8px;
   text-align: center;
   border: 1px dashed #ccc;
   border-radius: 4px;
   min-height: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
}

.onnx-demo-image-container {
   display: flex;
   flex-direction: column;
   align-items: center;
}

.onnx-demo-image {
   max-width: 100%;
   max-height: 180px;
   object-fit: contain;
}

.onnx-demo-model-info {
   text-align: left;
   width: 100%;
}

.onnx-demo-control {
   display: flex;
   justify-content: center;
   margin: 16px 0;
}

.onnx-demo-result {
   margin-top: 16px;
   border-top: 1px solid #eee;
   padding-top: 16px;
}

.onnx-demo-result pre {
   white-space: pre-wrap;
   word-break: break-all;
   max-height: 300px;
   overflow: auto;
   background-color: #f5f5f5;
   padding: 8px;
   border-radius: 4px;
}
</style>