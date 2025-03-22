package api

import (
	"net"
	"net/http"
	"os"
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

		host, _ := os.Hostname()

		addrs, _ := net.LookupHost(host)
		for _, addr := range addrs {
			if strings.Contains(addr, "%") {
				addr = strings.Split(addr, "%")[0]
			}

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
