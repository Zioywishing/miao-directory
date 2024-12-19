package api

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "os"
    "path/filepath"
    "io/ioutil"
)

func UploadHandler(c *gin.Context) {
    fileName := c.PostForm("fileName")
    operateType := c.PostForm("operateType")
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    decodedPath, err := filepath.Abs(filepath.Join(staticPath, c.Param("path")))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": "Unable to access path"})
        return
    }

    savePath := filepath.Join(decodedPath, fileName)
    fileData, err := file.Open()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }
    defer fileData.Close()

    data, err := ioutil.ReadAll(fileData)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    if operateType == "write" {
        err = ioutil.WriteFile(savePath, data, 0644)
    } else {
        f, err := os.OpenFile(savePath, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0644)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
            return
        }
        defer f.Close()
        _, err = f.Write(data)
    }

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"message": "failed", "error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "success"})
}
