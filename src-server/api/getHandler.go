package api

import (
	// removed ioutil
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func GetHandler(c *gin.Context) {
	decodedPath, err := filepath.Abs(filepath.Join(staticPath, c.Param("path")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to access path"})
		return
	}

	fileInfo, err := os.Stat(decodedPath)
	if os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Path not found"})
		return
	}

	// 当请求路径为文件夹时，返回404
	if fileInfo.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "Path is a directory"})
		return
	}

	// 仅处理文件：保持原有文件返回行为
	if strings.HasSuffix(decodedPath, "index.html") {
		f, err := os.Open(decodedPath)
		if err != nil {
			c.Writer.WriteHeader(http.StatusInternalServerError)
			c.Writer.Write([]byte("Internal Server Error"))
			return
		}
		http.ServeContent(c.Writer, c.Request, "index.html", time.Now(), f)
		return
	}

	ext := filepath.Ext(decodedPath)
	switch ext {
	case ".js":
	case ".cjs":
	case ".mjs":
		c.Writer.Header().Set("Content-Type", "application/javascript")
	case ".css":
		c.Writer.Header().Set("Content-Type", "text/css")
	case ".html":
		c.Writer.Header().Set("Content-Type", "text/html")
	case ".json":
		c.Writer.Header().Set("Content-Type", "application/json")
	case ".wasm":
		c.Writer.Header().Set("Content-Type", "application/wasm")
	default:
		c.Writer.Header().Set("Content-Type", "application/octet-stream")
	}
	c.File(decodedPath)
}
