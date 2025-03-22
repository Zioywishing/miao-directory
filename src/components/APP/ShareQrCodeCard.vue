<template>
  <n-card title="分享链接" class="share-card">
    <miao-message-provider ref="messageProviderRef">
      <n-scrollbar style="max-height: 60vh;">
        <n-space vertical>
          <!-- <n-text>扫描下方二维码访问不同设备上的应用</n-text>
          <n-divider /> -->
          <n-spin :show="loading">
            <div class="grid-container">
              <div v-for="(item, index) in shareLinks" :key="index" class="grid-item">
                <n-card embedded class="qrcode-card">
                  <template #header>
                    <div class="card-header bg-zinc-100 p-3 rounded-md">
                      <n-text>{{ item.title.split('(')[0] }}</n-text>
                      <n-tooltip trigger="hover" placement="top">
                        <template #trigger>
                          <n-button quaternary circle size="small" @click="copyUrl(item.url)">
                            <template #icon>
                              <n-icon><copy-outline /></n-icon>
                            </template>
                          </n-button>
                        </template>
                        复制链接
                      </n-tooltip>
                    </div>
                  </template>
                  <div class="qrcode-container">
                    <n-qr-code :value="item.url" :size="200" error-correction-level="H"
                      style="box-sizing: content-box;" />
                  </div>
                  <template #footer>
                    <div @click="openUrl(item.url)" class="cursor-pointer hover:text-blue-500 hover:underline">
                      <n-ellipsis style="max-width: 100%" :tooltip="{ maxWidth: 300 }">
                        {{ item.url }}
                      </n-ellipsis>
                    </div>
                  </template>
                </n-card>
              </div>
            </div>
          </n-spin>
        </n-space>
      </n-scrollbar>
    </miao-message-provider>
  </n-card>
</template>

<script setup lang="ts">
import { CopyOutline } from '@vicons/ionicons5'
import { onMounted, ref, useTemplateRef } from 'vue'
import useServerAddresses from '@/hooks/useServerAddresses'
import MiaoMessageProvider from '@/components/miaoAlertTipProvider.vue'

// 服务器地址服务
const serverAddressesService = useServerAddresses()

interface ShareLink {
  title: string
  url: string
}

// 加载状态
const loading = ref(true)
// 分享链接
const shareLinks = ref<ShareLink[]>([])

// 使用本地消息提示组件
const messageProviderRef = useTemplateRef<InstanceType<typeof MiaoMessageProvider>>('messageProviderRef')

// 组件挂载后获取地址列表
onMounted(async () => {
  try {
    await serverAddressesService.fetchAddresses()
    shareLinks.value = serverAddressesService.addresses.value
  } catch (error) {
    // 使用本地的alertTip
    messageProviderRef.value?.alertTip('获取分享链接失败', {
      type: 'error',
      timeout: 3000
    })
    console.error('获取分享链接失败:', error)
  } finally {
    loading.value = false
  }
})

/**
 * 复制URL到剪贴板
 */
const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url).then(
    () => {
      // 使用本地的alertTip
      messageProviderRef.value?.alertTip('链接已复制到剪贴板', {
        type: 'success',
        timeout: 3000
      })
    },
    (err) => {
      console.error('复制失败:', err)
      // 使用本地的alertTip
      messageProviderRef.value?.alertTip('复制失败', {
        type: 'error',
        timeout: 3000
      })
    }
  )
}

const openUrl = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.share-card {
  min-width: 280px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 8px;
}

.qrcode-card {
  text-align: center;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>