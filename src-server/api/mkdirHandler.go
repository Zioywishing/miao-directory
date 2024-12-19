package api

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "os"
    "path/filepath"
)

func MkdirHandler(c *gin.Context) {
    var request struct {
        FolderName string `json:"folderName"`
    }

    if err := c.ShouldBindJSON(&request); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    decodedPath, err := filepath.Abs(filepath.Join(staticPath, c.Param("path")))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Unable to access path"})
        return
    }

    mkdirPath := filepath.Join(decodedPath, request.FolderName)

    if err := os.MkdirAll(mkdirPath, os.ModePerm); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}
