<template>
   <miao-alert-tip-provider ref="miaoMessageRef">
      <div class="clipboard-container">
         <n-card class="clipboard-card" title="剪贴板" size="medium">
            <div class="key-section">
               <n-input v-model:value="key" type="text" placeholder="请输入Key值" class="key-input" />
               <div class="button-group">
                  <n-button @click="getData" type="primary" size="small">查询</n-button>
                  <n-button @click="setData" type="info" size="small">设置</n-button>
                  <n-button @click="deleteData" type="error" size="small">删除</n-button>
               </div>
            </div>
            <div class="data-section">
               <n-input v-model:value="content" type="textarea" placeholder="数据内容"
                  :autosize="{ minRows: 5, maxRows: 15 }" class="data-input" />
            </div>
            <div class="flex justify-end items-center gap-3">
               <n-button @click="clearInput" type="error" size="small">清空输入</n-button>
               <div class="flex justify-center items-center">
                  <n-checkbox v-model:checked="useDisk">保存到磁盘</n-checkbox>
               </div>
            </div>
            <div class="status-section" v-if="statusMessage">
               <n-alert :type="statusType" class="status-alert">
                  {{ statusMessage }}
               </n-alert>
            </div>
         </n-card>
      </div>
   </miao-alert-tip-provider>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import {
   NCard,
   NInput,
   NButton,
   NCheckbox,
   NAlert
} from 'naive-ui'
import miaoAlertTipProvider from '@/components/miaoAlertTipProvider.vue'
import { alertTipType } from '@/types/type'

const key = ref('')
const content = ref('')
const useDisk = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info' | 'warning'>('info')
const miaoMessageRef = ref<InstanceType<typeof miaoAlertTipProvider>>()
const globalAlertTip = inject<alertTipType>('globalAlertTip')

// 计算磁盘参数
const diskParam = computed(() => useDisk.value ? '1' : '0')

// 显示状态消息
const showStatus = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
   statusMessage.value = msg
   statusType.value = type
   setTimeout(() => {
      statusMessage.value = ''
   }, 3000)
}

// 显示消息提示
const showMessage = (content: string, type: 'success' | 'error' | 'info' = 'info') => {
   if (miaoMessageRef.value?.alertTip) {
      miaoMessageRef.value.alertTip(content, { type, timeout: 3000 })
   } else if (globalAlertTip) {
      globalAlertTip(content, { type, timeout: 3000 })
   }
}

// 获取数据
const getData = async () => {
   if (!key.value.trim()) {
      showMessage('请输入Key值', 'error')
      return
   }

   try {
      const response = await fetch(`/map/get/${key.value}?disk=${diskParam.value}`)

      if (!response.ok) {
         if (response.status === 404) {
            showStatus('未找到对应的数据', 'warning')
            showMessage('未找到对应的数据', 'error')
         } else {
            showStatus(`获取失败：${response.status}`, 'error')
            showMessage(`获取失败：${response.status}`, 'error')
         }
         return
      }

      const data = await response.text()
      content.value = data
      showStatus('获取成功', 'success')
      showMessage('获取成功', 'success')
   } catch (error) {
      showStatus(`获取失败：${error}`, 'error')
      showMessage(`获取失败：${error}`, 'error')
   }
}

// 设置数据
const setData = async () => {
   if (!key.value.trim()) {
      showMessage('请输入Key值', 'error')
      return
   }

   try {
      const response = await fetch(`/map/set/${key.value}?disk=${diskParam.value}`, {
         method: 'POST',
         body: content.value
      })

      if (!response.ok) {
         showStatus(`设置失败：${response.status}`, 'error')
         showMessage(`设置失败：${response.status}`, 'error')
         return
      }

      showStatus('设置成功', 'success')
      showMessage('设置成功', 'success')
   } catch (error) {
      showStatus(`设置失败：${error}`, 'error')
      showMessage(`设置失败：${error}`, 'error')
   }
}

// 删除数据
const deleteData = async () => {
   if (!key.value.trim()) {
      showMessage('请输入Key值', 'error')
      return
   }

   try {
      const response = await fetch(`/map/delete/${key.value}?disk=${diskParam.value}`, {
         method: 'POST'
      })

      if (!response.ok) {
         showStatus(`删除失败：${response.status}`, 'error')
         showMessage(`删除失败：${response.status}`, 'error')
         return
      }

      content.value = ''
      showStatus('删除成功', 'success')
      showMessage('删除成功', 'success')
   } catch (error) {
      showStatus(`删除失败：${error}`, 'error')
      showMessage(`删除失败：${error}`, 'error')
   }
}

// 清空输入
const clearInput = () => {
   key.value = ''
   content.value = ''
}
</script>

<style scoped lang="scss">
.clipboard-container {
   width: 100%;
   height: 100%;
   display: flex;
   justify-content: center;
   align-items: flex-start;
   padding: 20px;
}

.clipboard-card {
   width: 100%;
   max-width: 600px;
}

.key-section {
   display: flex;
   margin-bottom: 16px;
   gap: 10px;
}

.key-input {
   flex: 1;
}

.button-group {
   display: flex;
   gap: 8px;
}

.data-section {
   margin-bottom: 16px;
}

// .disk-option {
//    // margin-bottom: 16px;
// }

.status-section {
   margin-top: 16px;
}

.status-alert {
   width: 100%;
}
</style>