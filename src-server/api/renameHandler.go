package api

import (
	// "fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"miao-directory/fsOperateEventCenter"
)

func RenameHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			NewName string `json:"newName"`
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

		newTargetPath := filepath.Join(filepath.Dir(decodedPath), req.NewName)
		eventId := fsOperateEventCenter.Push(func() error {
			return os.Rename(decodedPath, newTargetPath)
		})
		c.JSON(http.StatusOK, gin.H{"eventId": eventId})
	}
}
