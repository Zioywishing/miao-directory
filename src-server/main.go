//go:generate goversioninfo -icon=./icon.ico
package main

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"

	"miao-directory/api"
	"miao-directory/fsOperateEventCenter"
)

//go:embed all:web/*
var webFS embed.FS

var port = ":17705"

func main() {
	gin.SetMode(gin.ReleaseMode)

	fsOperateEventCenter := fsOperateEventCenter.NewFsOperateEventCenter()

	router := gin.Default()
	router.Use(corsMiddleware())

	router.GET("/query", api.QueryHandler(fsOperateEventCenter))
	router.GET("/get/*path", api.GetHandler)
	router.HEAD("/get/*path", api.GetHandler)
	router.POST("/mkdir/*path", api.MkdirHandler)
	router.POST("/upload/*path", api.UploadHandler)
	router.POST("/cut/*path", api.CutHandler(fsOperateEventCenter))
	router.POST("/copy/*path", api.CopyHandler(fsOperateEventCenter))
	router.POST("/rename/*path", api.RenameHandler(fsOperateEventCenter))
	router.POST("/delete/*path", api.DeleteHandler(fsOperateEventCenter))

	// 添加获取所有可用地址的API
	router.GET("/addresses", api.AddressesHandler(port))

	// 添加map相关API
	router.POST("/map/set/*key", api.MapSetHandler)
	router.GET("/map/get/*key", api.MapGetHandler)
	router.POST("/map/delete/*key", api.MapDeleteHandler)

	// Redirect from '/' to '/web/'
	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/web/")
	})

	// Serve static files from the embedded filesystem with gzip compression
	staticFS := http.FS(webFS)
	staticGroup := router.Group("/web")
	staticGroup.Use(gzip.Gzip(gzip.DefaultCompression))
	staticGroup.GET("/*filepath", func(c *gin.Context) {
		http.FileServer(staticFS).ServeHTTP(c.Writer, c.Request)
	})

	address := "[::]" + port
	printListeningAddresses(port)

	// 在非阻塞的goroutine中启动服务器
	go func() {
		if err := router.Run(address); err != nil {
			fmt.Printf("服务器启动失败: %v\n", err)
			os.Exit(1)
		}
	}()

	// 如果启用了webview，则启动webview窗口
	if useWebView {
		startWebView(port)
	} else {
		// 如果不使用webview，则阻塞主线程，保持服务器运行
		select {}
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Next()
	}
}

func printListeningAddresses(port string) {
	fmt.Printf("Listening on:\n")
	fmt.Printf("  ➜  Local:   http://localhost%s\n", port)
	for _, addr := range api.GetAllLocalIPs() {
		if strings.Contains(addr, ":") {
			// IPv6 address
			fmt.Printf("  ➜  Network: http://[%s]%s\n", addr, port)
		} else {
			// IPv4 address
			fmt.Printf("  ➜  Network: http://%s%s\n", addr, port)
		}
	}
}
