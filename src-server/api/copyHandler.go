package api

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"miao-directory/fsOperateEventCenter"
)

func CopyHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
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
			// 检查源路径是文件还是目录
			fileInfo, err := os.Stat(decodedPath)
			if err != nil {
				return err
			}

			if fileInfo.IsDir() {
				return copyDir(decodedPath, newPath)
			}
			return copyFile(decodedPath, newPath)
		})
		c.JSON(http.StatusOK, gin.H{"eventId": eventId})
	}
}

func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	return destFile.Sync()
}

// 复制目录及其内容
func copyDir(src, dst string) error {
	// 获取源目录信息
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	// 创建目标目录
	if err = os.MkdirAll(dst, srcInfo.Mode()); err != nil {
		return err
	}

	// 读取源目录内容
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	// 遍历并复制每个条目
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			// 递归复制子目录
			if err = copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			// 复制文件
			if err = copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}
