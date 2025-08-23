package api

import (
	"net"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AddressesHandler 返回服务器所有可用的访问地址
func AddressesHandler(serverPort string) gin.HandlerFunc {
	return func(c *gin.Context) {
		addresses := []gin.H{}

		addresses = append(addresses, gin.H{
			"title": "localhost",
			"url":   "http://localhost" + serverPort,
		})

		// 使用网卡枚举方式，确保在各种网络配置下都能获取到可用的IP地址
		for _, addr := range GetAllLocalIPs() {
			var url string
			var title string

			if strings.Contains(addr, ":") {
				url = "http://[" + addr + "]" + serverPort
				title = "IPv6 Address (" + addr + ")"
			} else {
				url = "http://" + addr + serverPort
				title = "IPv4 Address (" + addr + ")"
			}
			addresses = append(addresses, gin.H{
				"title": title,
				"url":   url,
			})
		}

		c.JSON(http.StatusOK, addresses)
	}
}

// GetAllLocalIPs 枚举所有可用的本机IP地址（排除回环、链路本地等一般不可达地址）
func GetAllLocalIPs() []string {
	ips := []string{}

	ifaces, err := net.Interfaces()
	if err != nil {
		return ips
	}

	for _, iface := range ifaces {
		// 仅考虑启用的非回环网卡
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, a := range addrs {
			var ip net.IP
			switch v := a.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			if ip == nil {
				continue
			}

			// 处理 IPv4
			if ipv4 := ip.To4(); ipv4 != nil {
				if ipv4.IsLoopback() {
					continue
				}
				// 跳过 IPv4 链路本地 169.254.0.0/16
				if ipv4[0] == 169 && ipv4[1] == 254 {
					continue
				}
				ips = append(ips, ipv4.String())
				continue
			}

			// 处理 IPv6：排除回环与链路本地
			if ip.IsLoopback() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
				continue
			}
			// 去除 zone（如存在），通过上面的类型断言我们只取 IP 本身已无 zone
			ips = append(ips, ip.String())
		}
	}

	// 去重
	seen := map[string]struct{}{}
	unique := make([]string, 0, len(ips))
	for _, s := range ips {
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		unique = append(unique, s)
	}
	return unique
}

// 判断是否是私有IP地址
func isPrivateIP(ip string) bool {
	ipAddr := net.ParseIP(ip)
	if ipAddr == nil {
		return false
	}

	// 检查常见的私有IP范围
	// 10.0.0.0/8
	if ipAddr[0] == 10 {
		return true
	}
	// 172.16.0.0/12
	if ipAddr[0] == 172 && ipAddr[1] >= 16 && ipAddr[1] <= 31 {
		return true
	}
	// 192.168.0.0/16
	if ipAddr[0] == 192 && ipAddr[1] == 168 {
		return true
	}
	// 127.0.0.0/8 (本地回环)
	if ipAddr[0] == 127 {
		return true
	}

	return false
}
