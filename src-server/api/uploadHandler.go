package api

import (
    "github.com/gin-gonic/gin"
    "io"
    "net/http"
    "os"
    "path/filepath"
)

func UploadHandler(c *gin.Context) {
    fileName := c.PostForm("fileName")
    operateType := c.PostForm("operateType")
    if !isSafeName(fileName) {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": "invalid file name"})
        return
    }

    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    decodedPath, err := resolvePath(c.Param("path"))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Unable to access path"})
        return
    }

    savePath := filepath.Join(decodedPath, fileName)
    src, err := file.Open()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }
    defer src.Close()

    var dst *os.File
    if operateType == "write" {
        dst, err = os.OpenFile(savePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
    } else {
        dst, err = os.OpenFile(savePath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
    }
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }
    defer dst.Close()

    if _, err := io.Copy(dst, src); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}
