package api

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "os"
    "path/filepath"
    "io/ioutil"
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
                    "atimeMs": file.ModTime().UnixNano() / 1e6,
                    "birthtimeMs": file.ModTime().UnixNano() / 1e6,
                    "ctimeMs": file.ModTime().UnixNano() / 1e6,
                    "mtimeMs": file.ModTime().UnixNano() / 1e6,
                },
            })
        }
        if len(fileDetails) == 0 {
            c.JSON(http.StatusOK, []gin.H{})
        } else {
            c.JSON(http.StatusOK, fileDetails)
        }
    } else {
        c.File(decodedPath)
    }
}