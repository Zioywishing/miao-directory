package api

import (
    "crypto/md5"
    "encoding/hex"
    "io"
    "net/http"
    "os"
    "path/filepath"

    "github.com/gin-gonic/gin"
)

// 内存存储
var memoryStorage = make(map[string][]byte)

// MapSetHandler 处理 /map/set/*key 请求
func MapSetHandler(c *gin.Context) {
    key := c.Param("key")
    if key == "" || key == "/" {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": "Key is required"})
        return
    }
    key = key[1:] // 移除开头的"/"

    // 获取disk参数
    diskParam := c.DefaultQuery("disk", "0")

    // 读取请求体数据
    data, err := io.ReadAll(c.Request.Body)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": "Failed to read request body"})
        return
    }

    if diskParam == "1" {
        // 保存到文件系统
        cachePath, err := resolvePath(".miaodir_cache")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to resolve cache path"})
            return
        }

        // 确保缓存目录存在
        if err := os.MkdirAll(cachePath, os.ModePerm); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to create cache directory"})
            return
        }

        // 生成文件名
        hasher := md5.New()
        hasher.Write([]byte(key))
        filename := hex.EncodeToString(hasher.Sum(nil))

        // 写入文件
        filePath := filepath.Join(cachePath, filename)
        if err := os.WriteFile(filePath, data, 0644); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to write file"})
            return
        }
    } else {
        // 保存到内存
        memoryStorage[key] = data
    }

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}

// MapGetHandler 处理 /map/get/*key 请求
func MapGetHandler(c *gin.Context) {
    key := c.Param("key")
    if key == "" || key == "/" {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": "Key is required"})
        return
    }
    key = key[1:] // 移除开头的"/"

    // 获取disk参数
    diskParam := c.DefaultQuery("disk", "0")

    var data []byte
    var err error

    if diskParam == "1" {
        // 从文件系统获取
        cachePath, err2 := resolvePath(".miaodir_cache")
        if err2 != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to resolve cache path"})
            return
        }

        // 生成文件名
        hasher := md5.New()
        hasher.Write([]byte(key))
        filename := hex.EncodeToString(hasher.Sum(nil))

        // 读取文件
        filePath := filepath.Join(cachePath, filename)
        data, err = os.ReadFile(filePath)
        if err != nil {
            c.JSON(http.StatusNotFound, gin.H{"message": "failed", "error": "Key not found"})
            return
        }
    } else {
        // 从内存获取
        var exists bool
        data, exists = memoryStorage[key]
        if !exists {
            c.JSON(http.StatusNotFound, gin.H{"message": "failed", "error": "Key not found"})
            return
        }
    }

    c.Data(http.StatusOK, "application/octet-stream", data)
}

// MapDeleteHandler 处理 /map/delete/*key 请求
func MapDeleteHandler(c *gin.Context) {
    key := c.Param("key")
    if key == "" || key == "/" {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": "Key is required"})
        return
    }
    key = key[1:] // 移除开头的"/"

    // 获取disk参数
    diskParam := c.DefaultQuery("disk", "0")

    if diskParam == "1" {
        // 从文件系统删除
        cachePath, err := resolvePath(".miaodir_cache")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to resolve cache path"})
            return
        }

        // 生成文件名
        hasher := md5.New()
        hasher.Write([]byte(key))
        filename := hex.EncodeToString(hasher.Sum(nil))

        // 删除文件
        filePath := filepath.Join(cachePath, filename)
        if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Failed to delete file"})
            return
        }
    } else {
        // 从内存删除
        delete(memoryStorage, key)
    }

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}
