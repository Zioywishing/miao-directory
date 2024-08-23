package api

import (
	// "fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"my-go-project/fsOperateEventCenter"
)

func CutHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			NewPath string `json:"newPath"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		decodedPath, err := filepath.Abs(filepath.Join(staticPath, c.Param("path")))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to access path"})
			return
		}

		newPath := filepath.Join(staticPath, req.NewPath, filepath.Base(decodedPath))
		eventId := fsOperateEventCenter.Push(func() error {
			return os.Rename(decodedPath, newPath)
		})
		c.JSON(http.StatusOK, gin.H{"eventId": eventId})
	}
}