#!/bin/bash

# 解析命令行参数
FULL_BUILD=false
FAST_COMPRESSION=false

for arg in "$@"; do
  case $arg in
    -full)
      FULL_BUILD=true
      ;;
    -fast)
      FAST_COMPRESSION=true
      ;;
  esac
done

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

# 清理已有构建产物
echo "清理已有构建产物..."
[ -f "./miao-directory-amd64-win.exe" ] && rm ./miao-directory-amd64-win.exe
[ -f "./miao-directory-amd64-win.upx.exe" ] && rm ./miao-directory-amd64-win.upx.exe
[ -f "./miao-directory-amd64-win.gui.exe" ] && rm ./miao-directory-amd64-win.gui.exe
[ -f "./miao-directory-amd64-win.gui.upx.exe" ] && rm ./miao-directory-amd64-win.gui.upx.exe
[ -f "./miao-directory-amd64-linux" ] && rm ./miao-directory-amd64-linux
[ -f "./miao-directory-amd64-linux.upx" ] && rm ./miao-directory-amd64-linux.upx

# 如果是完整构建，清理额外架构产物
if [ "$FULL_BUILD" = true ]; then
  echo "完整构建模式，清理额外架构产物..."
  [ -f "./miao-directory-arm64-linux" ] && rm ./miao-directory-arm64-linux
  [ -f "./miao-directory-arm64-linux.upx" ] && rm ./miao-directory-arm64-linux.upx
  [ -f "./miao-directory-amd64-darwin" ] && rm ./miao-directory-amd64-darwin
  [ -f "./miao-directory-amd64-darwin.upx" ] && rm ./miao-directory-amd64-darwin.upx
  [ -f "./miao-directory-arm64-darwin" ] && rm ./miao-directory-arm64-darwin
  [ -f "./miao-directory-arm64-darwin.upx" ] && rm ./miao-directory-arm64-darwin.upx
fi

echo "构建前端..."
pnpm run build

echo "复制前端文件到服务端..."
rm -rf ./src-server/web/*
mkdir -p ./src-server/web/
cp -r ./dist/* ./src-server/web/

cd ./src-server

# ===== 构建阶段 =====
echo "===== 开始构建阶段 ====="

# 基础构建 - 始终构建的版本
echo "构建基础版本..."

# Windows AMD64 无GUI
echo "构建 Windows AMD64 无GUI 版本"
go env -w GOOS=windows GOARCH=amd64
go build -ldflags="-s -w" -o ../miao-directory-amd64-win.exe

# Linux AMD64 无GUI
echo "构建 Linux AMD64 无GUI 版本"
go env -w GOOS=linux GOARCH=amd64
export CGO_ENABLED=0
go build -ldflags="-s -w" -o ../miao-directory-amd64-linux
export CGO_ENABLED=1

# Windows AMD64 GUI
echo "构建 Windows AMD64 GUI 版本"
go env -w GOOS=windows GOARCH=amd64
go build -tags webview -ldflags="-s -w -H=windowsgui" -o ../miao-directory-amd64-win.gui.exe

# 完整构建 - 额外的系统和架构
if [ "$FULL_BUILD" = true ]; then
  echo "构建额外架构版本..."
  
  # Linux ARM64
  echo "构建 Linux ARM64 版本"
  go env -w GOOS=linux GOARCH=arm64
  export CGO_ENABLED=0
  go build -ldflags="-s -w" -o ../miao-directory-arm64-linux
  export CGO_ENABLED=1
  
  # macOS AMD64
  echo "构建 macOS AMD64 版本"
  go env -w GOOS=darwin GOARCH=amd64
  export CGO_ENABLED=0
  go build -ldflags="-s -w" -o ../miao-directory-amd64-darwin
  export CGO_ENABLED=1
  
  # macOS ARM64 (Apple Silicon)
  echo "构建 macOS ARM64 版本"
  go env -w GOOS=darwin GOARCH=arm64
  export CGO_ENABLED=0
  go build -ldflags="-s -w" -o ../miao-directory-arm64-darwin
  export CGO_ENABLED=1
fi

# ===== 压缩阶段 =====
echo "===== 开始压缩阶段 ====="

# 检查是否可以进行UPX压缩
if check_upx; then
  echo "开始压缩所有可执行文件..."
  
  # 设置压缩级别
  COMPRESSION_LEVEL="--ultra-brute"
  if [ "$FAST_COMPRESSION" = true ]; then
    echo "使用快速压缩模式"
    COMPRESSION_LEVEL="--fast"
  else
    echo "使用极限压缩模式"
  fi
  
  # 压缩基础版本
  echo "压缩基础版本..."
  
  # 压缩Windows无GUI版本
  echo "正在压缩Windows AMD64无GUI版本"
  upx $COMPRESSION_LEVEL -o ../miao-directory-amd64-win.upx.exe ../miao-directory-amd64-win.exe
  
  # 压缩Linux AMD64版本
  echo "正在压缩Linux AMD64版本"
  upx $COMPRESSION_LEVEL -o ../miao-directory-amd64-linux.upx ../miao-directory-amd64-linux
  
  # 压缩Windows GUI版本
  echo "正在压缩Windows AMD64 GUI版本"
  upx $COMPRESSION_LEVEL -o ../miao-directory-amd64-win.gui.upx.exe ../miao-directory-amd64-win.gui.exe
  
  # 压缩额外架构版本
  if [ "$FULL_BUILD" = true ]; then
    echo "压缩额外架构版本..."
    
    # 压缩Linux ARM64版本
    echo "正在压缩Linux ARM64版本"
    upx $COMPRESSION_LEVEL -o ../miao-directory-arm64-linux.upx ../miao-directory-arm64-linux
    
    # 压缩macOS AMD64版本
    echo "正在压缩macOS AMD64版本"
    upx $COMPRESSION_LEVEL -o ../miao-directory-amd64-darwin.upx ../miao-directory-amd64-darwin
    
    # 压缩macOS ARM64版本
    echo "正在压缩macOS ARM64版本"
    upx $COMPRESSION_LEVEL -o ../miao-directory-arm64-darwin.upx ../miao-directory-arm64-darwin
  fi
  
  echo "所有压缩完成"
fi

echo "构建完成"
echo "构建模式: $([ "$FULL_BUILD" = true ] && echo "完整构建" || echo "基础构建")"
echo "压缩模式: $([ "$FAST_COMPRESSION" = true ] && echo "快速压缩" || echo "极限压缩")"