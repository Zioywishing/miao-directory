package fsOperateEventCenter

import (
	// "fmt"
	"math/rand"
	"sync"
	"time"
)

type FsOperateEventStatus string

const (
	FsOperateEventStatusProgress FsOperateEventStatus = "progress"
	FsOperateEventStatusSuccess  FsOperateEventStatus = "success"
	FsOperateEventStatusFailed   FsOperateEventStatus = "failed"
	FsOperateEventStatusUnknown  FsOperateEventStatus = "unknown"
)

type FsOperateEvent struct {
	Status      FsOperateEventStatus `json:"status"`
	FailedEvent error                `json:"failedEvent"`
	UID         int32                `json:"uid"`
}

type FsOperateEventCenter struct {
	eventMap sync.Map
}

func NewFsOperateEventCenter() *FsOperateEventCenter {
	return &FsOperateEventCenter{}
}

func (c *FsOperateEventCenter) Push(event func() error) int32 {
	ev := &FsOperateEvent{
		Status: FsOperateEventStatusProgress,
		UID:    generateId(),
	}

	wrapper := &eventWrapper{
		event: ev,
		timer: time.AfterFunc(time.Hour, func() {
			c.Query(ev.UID)
		}),
	}

	c.eventMap.Store(ev.UID, wrapper)

	go func() {
		if err := event(); err != nil {
			wrapper.event.Status = FsOperateEventStatusFailed
			wrapper.event.FailedEvent = err
		} else {
			wrapper.event.Status = FsOperateEventStatusSuccess
		}
	}()

	return ev.UID
}

type eventWrapper struct {
	event *FsOperateEvent
	timer *time.Timer
}

func (c *FsOperateEventCenter) Query(id int32) *FsOperateEvent {
	val, ok := c.eventMap.Load(id)
	// fmt.Printf("Query ID: %d; ok: %t; val: %v\n", id, ok, val)

	// c.eventMap.Range(func(key, value interface{}) bool {
	// 	fmt.Printf("key: %d (type: %T), id: %d (type: %T), bool: %t\n", key, key, id, id, id == key)
	// 	event := value.(*eventWrapper).event
	// 	fmt.Printf("Event UID: %d, Status: %s\n", event.UID, event.Status)
	// 	return true
	// })

	if !ok {
		return &FsOperateEvent{
			Status: FsOperateEventStatusUnknown,
		}
	}

	wrapper := val.(*eventWrapper)
	if wrapper.event.Status == FsOperateEventStatusSuccess || wrapper.event.Status == FsOperateEventStatusFailed {
		wrapper.timer.Stop()
		c.eventMap.Delete(id)
	}

	return wrapper.event
}

func generateId() int32 {
	return rand.Int31()
}
