//go:build !webview
// +build !webview

package main

// 定义是否使用WebView的变量
var useWebView = false

// 空函数，在非webview版本中不执行任何操作
func startWebView(port string) {
	// 在非webview版本中不做任何事情
}
