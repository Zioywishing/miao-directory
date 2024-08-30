//go:generate goversioninfo -icon=./icon.ico
package main

import (
	"embed"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"

	"miao-directory/api"
	"miao-directory/fsOperateEventCenter"
)

//go:embed web/*
var webFS embed.FS

var port = ":17705"

func main() {
	// gin.SetMode(gin.ReleaseMode)

	fsOperateEventCenter := fsOperateEventCenter.NewFsOperateEventCenter()

	router := gin.Default()
	router.Use(corsMiddleware())

	router.GET("/query", api.QueryHandler(fsOperateEventCenter))
	router.GET("/get/*path", api.GetHandler)
	router.POST("/mkdir/*path", api.MkdirHandler)
	router.POST("/upload/*path", api.UploadHandler)
	router.POST("/cut/*path", api.CutHandler(fsOperateEventCenter))
	router.POST("/copy/*path", api.CopyHandler(fsOperateEventCenter))
	router.POST("/rename/*path", api.RenameHandler(fsOperateEventCenter))
	router.POST("/delete/*path", api.DeleteHandler(fsOperateEventCenter))

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
	router.Run(address)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Next()
	}
}

func printListeningAddresses(port string) {
	host, _ := os.Hostname()
	addrs, _ := net.LookupHost(host)

	fmt.Printf("Listening on:\n")
	fmt.Printf("  ➜  Local:   http://localhost%s\n", port)
	for _, addr := range addrs {
		if strings.Contains(addr, "%") {
			addr = strings.Split(addr, "%")[0]
		}
		if strings.Contains(addr, ":") {
			// IPv6 address
			fmt.Printf("  ➜  Network: http://[%s]%s\n", addr, port)
		} else {
			// IPv4 address
			fmt.Printf("  ➜  Network: http://%s%s\n", addr, port)
		}
	}
}
