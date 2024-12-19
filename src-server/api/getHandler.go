package api

import (
	"io/ioutil"
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

	if fileInfo.IsDir() {
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
		} else {
			c.JSON(http.StatusOK, fileDetails)
		}
	} else {
		if strings.HasSuffix(decodedPath, "index.html") {
			f, err := os.Open(decodedPath)
			if err != nil {
				c.Writer.WriteHeader(http.StatusInternalServerError)
				c.Writer.Write([]byte("Internal Server Error"))
				return
			}
			http.ServeContent(c.Writer, c.Request, "index.html", time.Now(), f)
		} else {
			// if c.Query("import") != "" {
			// 	c.Writer.Header().Set("Content-Type", "application/javascript")
			// }
			ext := filepath.Ext(decodedPath)
			switch ext {
			case ".js":
			case ".cjs":
				c.Writer.Header().Set("Content-Type", "application/javascript")
			case ".css":
				c.Writer.Header().Set("Content-Type", "text/css")
			case ".html":
				c.Writer.Header().Set("Content-Type", "text/html")
			case ".json":
				c.Writer.Header().Set("Content-Type", "application/json")
			default:
				c.Writer.Header().Set("Content-Type", "application/octet-stream")
			}
			c.File(decodedPath)
		}
	}
}
