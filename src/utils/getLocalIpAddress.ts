/**
 * 获取本机的局域网IP地址
 * 使用Web API获取可用的网络接口信息（如果浏览器支持）
 * @returns 一个Promise，解析为包含可用局域网IP地址的数组
 */
export async function getLocalIpAddresses(): Promise<string[]> {
  // 部分浏览器未实现RTCPeerConnection对象
  if (!window.RTCPeerConnection) {
    console.warn('当前浏览器不支持获取局域网IP')
    return []
  }
  
  return new Promise((resolve) => {
    const ips: string[] = []
    const pc = new RTCPeerConnection({
      // 使用Google的STUN服务器
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    pc.createDataChannel('')
    
    // 创建一个offer来触发ICE候选者的收集
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => console.error('获取IP地址时出错:', err))

    // 监听ICE候选者事件
    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        // ICE收集完成
        pc.close()
        resolve(ips)
        return
      }

      // 解析候选者信息中的IP地址
      const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(event.candidate.candidate)
      const ipAddress = ipMatch && ipMatch[1]
      
      if (ipAddress && !ips.includes(ipAddress) && isPrivateIp(ipAddress)) {
        ips.push(ipAddress)
      }
    }
    
    // 5秒超时，确保不会无限等待
    setTimeout(() => {
      pc.close()
      resolve(ips)
    }, 5000)
  })
}

/**
 * 判断一个IP地址是否为私有局域网IP
 * @param ip IP地址
 * @returns 是否为私有IP
 */
function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(part => parseInt(part, 10))
  
  // 检查是否是局域网IP
  // 10.0.0.0 - 10.255.255.255
  // 172.16.0.0 - 172.31.255.255
  // 192.168.0.0 - 192.168.255.255
  return (
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  )
} 