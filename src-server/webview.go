//go:build webview
// +build webview

package main

import (
	"fmt"

	"github.com/jchv/go-webview2"
)

// 启动WebView窗口
func startWebView(port string) {
	// 构建本地服务URL
	serverURL := fmt.Sprintf("http://localhost%s", port)

	// 创建webview窗口
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  "MiaoDirectory Server",
			Width:  1024,
			Height: 768,
			Center: true,
		},
	})
	defer w.Destroy()

	// 导航到本地服务器
	w.Navigate(serverURL)

	// 启动webview窗口
	w.Run()
}

// 定义是否使用WebView的变量
var useWebView = true
