package api

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "os"
)

func GetDirHandler(c *gin.Context) {
    decodedPath, err := resolvePath(c.Param("path"))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to access path"})
        return
    }

    fileInfo, err := os.Stat(decodedPath)
    if os.IsNotExist(err) {
        c.JSON(http.StatusNotFound, gin.H{"error": "Path not found"})
        return
    }

    // 当请求路径为文件时，返回404
    if !fileInfo.IsDir() {
        c.JSON(http.StatusNotFound, gin.H{"error": "Path is not a directory"})
        return
    }

    // 使用os.ReadDir读取目录内容
    entries, err := os.ReadDir(decodedPath)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read directory"})
        return
    }

    var fileList []map[string]interface{}
    for _, entry := range entries {
        info, err := entry.Info()
        if err != nil {
            continue
        }
        fileList = append(fileList, map[string]interface{}{
            "name":  entry.Name(),
            "isDir": entry.IsDir(),
            "time":  info.ModTime().Unix(),
            "size":  info.Size(),
        })
    }

    c.JSON(http.StatusOK, gin.H{"fileList": fileList})
}