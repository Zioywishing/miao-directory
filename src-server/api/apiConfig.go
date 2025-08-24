package api

import (
    "path/filepath"
)

// Static configuration for API module
var Port = ":17705"

var staticPath = "./"
var staticAbsPath string

func init() {
    abs, err := filepath.Abs(staticPath)
    if err == nil {
        staticAbsPath = filepath.Clean(abs)
    } else {
        staticAbsPath = filepath.Clean(staticPath)
    }
}