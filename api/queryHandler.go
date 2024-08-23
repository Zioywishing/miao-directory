package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"my-go-project/fsOperateEventCenter"
)

func QueryHandler(fsOperateEventCenter *fsOperateEventCenter.FsOperateEventCenter) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Query("id")
		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
			return
		}

		event := fsOperateEventCenter.Query(int32(id))
		c.JSON(http.StatusOK, event)
	}
}
