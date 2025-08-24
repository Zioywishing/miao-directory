package api

import (
    // "fmt"
    "miao-directory/fsOperateEventCenter"
    "net/http"
    "os"

    "github.com/gin-gonic/gin"
)

func DeleteHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
    return func(c *gin.Context) {
        decodedPath, err := resolvePath(c.Param("path"))
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
