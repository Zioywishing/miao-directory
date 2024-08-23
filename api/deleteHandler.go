package api

import (
	// "fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"my-go-project/fsOperateEventCenter"
)

func DeleteHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
	return func(c *gin.Context) {
		decodedPath, err := filepath.Abs(filepath.Join(staticPath, c.Param("path")))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to access path"})
			return
		}

		eventId := fsOperateEventCenter.Push(func() error {
			return os.RemoveAll(decodedPath)
		})
		c.JSON(http.StatusOK, gin.H{"eventId": eventId})
	}
}