import { ref } from 'vue'
import config from '@/config'
import { useMiaoFetch } from '@/hooks/useMiaoFetchApi'

export interface ServerAddress {
  title: string
  url: string
}

/**
 * 获取服务器所有可用的访问地址
 */
export default function useServerAddresses() {
  const addresses = ref<ServerAddress[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 从服务器获取可用地址列表
   */
  const fetchAddresses = async () => {
    loading.value = true
    error.value = null

    try {
      const { baseUrl, api } = config
      const { miaoFetch } = useMiaoFetch({ retry: 1 })
      
      const response = await miaoFetch({
        url: `${baseUrl}${api.addresses}`
      })
      
      addresses.value = response.data as ServerAddress[]
    } catch (err) {
      console.error('获取服务器地址失败:', err)
      error.value = err as Error
      
      // 如果API失败，提供基本的地址
      addresses.value = [
        { title: '当前地址', url: config.baseUrl },
        { title: '本地地址', url: 'http://localhost:17705' }
      ]
    } finally {
      loading.value = false
    }
  }

  return {
    addresses,
    loading,
    error,
    fetchAddresses
  }
} 