//go:generate goversioninfo -icon=./icon.ico
package main

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"miao-directory/api"
	"miao-directory/fsOperateEventCenter"
)

//go:embed all:web/*
var webFS embed.FS

func main() {
	gin.SetMode(gin.ReleaseMode)

	fsOperateEventCenter := fsOperateEventCenter.NewFsOperateEventCenter()

	router := gin.Default()
	router.Use(corsMiddleware())

	router.GET("/query", api.QueryHandler(fsOperateEventCenter))

	// 专为目录查询
	router.GET("/dir/*path", api.GetDirHandler)
	router.POST("/mkdir/*path", api.MkdirHandler)
	router.POST("/upload/*path", api.UploadHandler)
	router.POST("/cut/*path", api.CutHandler(fsOperateEventCenter))
	router.POST("/copy/*path", api.CopyHandler(fsOperateEventCenter))
	router.POST("/rename/*path", api.RenameHandler(fsOperateEventCenter))
	router.POST("/delete/*path", api.DeleteHandler(fsOperateEventCenter))

	// /file gzip 采用白名单策略：仅对文本类扩展启用压缩
	textExtWhitelist := map[string]struct{}{
		".js": {}, ".mjs": {}, ".cjs": {}, ".css": {}, ".json": {}, ".wasm": {}, ".svg": {}, ".txt": {}, ".xml": {}, ".csv": {}, ".md": {}, ".html": {},
	}
	gzipMW := gzip.Gzip(gzip.DefaultCompression)
	fileGroup := router.Group("/file")
	fileGroup.Use(func(c *gin.Context) {
		ext := strings.ToLower(path.Ext(c.Request.URL.Path))
		if _, ok := textExtWhitelist[ext]; ok {
			// 命中白名单时套用 gzip 中间件
			gzipMW(c)
			return
		}
		// 非白名单则直接继续，不启用 gzip
		c.Next()
	})
	fileGroup.GET("/*path", api.GetHandler)
	fileGroup.HEAD("/*path", api.GetHandler)

	// 添加获取所有可用地址的API
	router.GET("/addresses", api.AddressesHandler(api.Port))

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

	address := "[::]" + api.Port
	printListeningAddresses(api.Port)

	// 在非阻塞的goroutine中启动支持 HTTP/2 (h2c) 的服务器
	go func() {
		srv := &http.Server{
			Addr:    address,
			Handler: h2c.NewHandler(router, &http2.Server{}),
		}
		if err := srv.ListenAndServe(); err != nil {
			fmt.Printf("服务器启动失败: %v\n", err)
			os.Exit(1)
		}
	}()

	// 如果启用了webview，则启动webview窗口
	if useWebView {
		startWebView(api.Port)
	} else {
		// 如果不使用webview，则阻塞主线程，保持服务器运行
		select {}
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin")
		// 预检请求直接返回
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
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
