package api

import (
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// GetDirHandler 专门用于处理目录请求：
// - 若为目录则返回目录下的文件/文件夹信息（与原 /get 目录逻辑一致）
// - 若为文件则返回 404
func GetDirHandler(c *gin.Context) {
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

	if !fileInfo.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "Path is a file"})
		return
	}

	files, err := ioutil.ReadDir(decodedPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to scan directory"})
		return
	}

	var fileDetails []gin.H
	for _, file := range files {
		fileDetails = append(fileDetails, gin.H{
			"name": file.Name(),
			"size": file.Size(),
			"type": func() string {
				if file.IsDir() {
					return "directory"
				}
				return "file"
			}(),
			"stats": gin.H{
				"atimeMs":     file.ModTime().UnixNano() / 1e6,
				"birthtimeMs": file.ModTime().UnixNano() / 1e6,
				"ctimeMs":     file.ModTime().UnixNano() / 1e6,
				"mtimeMs":     file.ModTime().UnixNano() / 1e6,
			},
		})
	}
	if len(fileDetails) == 0 {
		c.JSON(http.StatusOK, []gin.H{})
		return
	}
	c.JSON(http.StatusOK, fileDetails)
}