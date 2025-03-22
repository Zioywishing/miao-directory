#!/bin/bash

# 检查UPX是否存在
check_upx() {
  if command -v upx &> /dev/null; then
    echo "UPX已找到，将执行可执行文件压缩"
    return 0
  else
    echo "UPX未找到，跳过压缩步骤"
    return 1
  fi
}

rm ./miao-directory-amd64-win.exe
rm ./miao-directory-amd64-win.upx.exe
rm ./miao-directory-amd64-win.gui.exe
rm ./miao-directory-amd64-win.gui.upx.exe
rm ./miao-directory-amd64-linux

pnpm run build

rm -rf ./src-server/web/*

cp -r ./dist/* ./src-server/web/

cd ./src-server

# 构建不带GUI版本（Windows）
echo "building amd64 win (no GUI)"
go env -w GOOS=windows GOARCH=amd64
go build -ldflags="-s -w" -o ../miao-directory-amd64-win.exe

# 尝试UPX压缩Windows无GUI版本
if check_upx; then
  echo "正在压缩Windows无GUI版本"
  upx --ultra-brute -o ../miao-directory-amd64-win.upx.exe ../miao-directory-amd64-win.exe
fi

# 构建不带GUI版本（Linux）
echo "building amd64 linux (no GUI)"
go env -w GOOS=linux GOARCH=amd64
go build -ldflags="-s -w" -o ../miao-directory-amd64-linux

# 构建带GUI版本（仅Windows，go-webview2主要针对Windows平台）
echo "building amd64 win with GUI"
go env -w GOOS=windows GOARCH=amd64
go build -tags webview -ldflags="-s -w -H=windowsgui" -o ../miao-directory-amd64-win.gui.exe

# 尝试UPX压缩Windows GUI版本
if check_upx; then
  echo "正在压缩Windows GUI版本"
  upx --ultra-brute -o ../miao-directory-amd64-win.gui.upx.exe ../miao-directory-amd64-win.gui.exe
fi

# 如果需要为Linux构建带GUI版本，需要系统安装相应的依赖
# echo "building amd64 linux with GUI"
# go env -w GOOS=linux GOARCH=amd64
# go build -tags webview -ldflags="-s -w" -o ../miao-directory-gui-amd64-linux

# 可选：ARM64 Linux版本
# go env -w GOOS=linux GOARCH=arm64
# go build -ldflags="-s -w" -o ../miao-directory-arm64-linux

echo "build finish"