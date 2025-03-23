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

# 基础前缀
PREFIX="miao-directory"

# 基础构建产物
BASE_ARCHOS=(
  "amd64-win.exe"
  "amd64-win.upx.exe"
  "amd64-win.gui.exe"
  "amd64-win.gui.upx.exe"
  "amd64-linux"
  "amd64-linux.upx"
)

# 清理基础构建产物
for suffix in "${BASE_ARCHOS[@]}"; do
  [ -f "./$PREFIX-$suffix" ] && rm "./$PREFIX-$suffix"
done

# 如果是完整构建，清理额外架构产物
if [ "$FULL_BUILD" = true ]; then
  echo "完整构建模式，清理额外架构产物..."
  
  # 无需添加x-前缀的特殊版本
  SPECIAL_ARCHOS=(
    "arm64-linux"
    "arm64-linux.upx"
    "amd64-darwin"
    "amd64-darwin.upx"
    "arm64-darwin"
    "arm64-darwin.upx"
    "arm64-win.exe"
  )
  
  # 清理特殊版本产物
  for suffix in "${SPECIAL_ARCHOS[@]}"; do
    [ -f "./$PREFIX-$suffix" ] && rm "./$PREFIX-$suffix"
  done
  
  # 处理带x-前缀的不同系统和架构
  X_OS_ARCHS=(
    # FreeBSD系列
    "freebsd:amd64,arm64,386"
    # OpenBSD系列
    "openbsd:amd64,arm64,386"
    # Windows额外架构
    "win.exe:386"
    # Linux额外架构
    "linux:386,mips,mips64,mips64le,ppc64,ppc64le,riscv64,s390x"
  )
  
  # 清理带x-前缀的版本产物
  for os_arch in "${X_OS_ARCHS[@]}"; do
    # 分离操作系统和架构列表
    IFS=":" read -r os archs <<< "$os_arch"
    
    # 处理每个架构
    IFS="," read -ra arch_array <<< "$archs"
    for arch in "${arch_array[@]}"; do
      file="$PREFIX-x-$arch-$os"
      [ -f "./$file" ] && rm "./$file"
    done
  done
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
  
  # 备份resource.syso文件(如果存在)
  if [ -f "resource.syso" ]; then
    echo "备份resource.syso文件"
    mv resource.syso resource.syso.bak
  fi
  
  # 无需GUI和syso的构建批次
  export CGO_ENABLED=0
  
  # 定义操作系统和架构映射
  declare -A OS_ARCHS
  OS_ARCHS["linux"]="arm64 386 mips mips64 mips64le ppc64 ppc64le riscv64 s390x"
  OS_ARCHS["darwin"]="amd64 arm64"
  OS_ARCHS["windows"]="arm64 386"
  OS_ARCHS["freebsd"]="amd64 arm64 386"
  OS_ARCHS["openbsd"]="amd64 arm64 386"
  # OS_ARCHS["netbsd"]="amd64 arm64 386"
  
  # 遍历操作系统和架构进行构建
  for os in "${!OS_ARCHS[@]}"; do
    echo "构建 ${os^} 系列版本..."
    go env -w GOOS=$os
    
    # 获取当前操作系统支持的架构列表
    archs=${OS_ARCHS[$os]}
    
    for arch in $archs; do
      # 设置输出文件名后缀
      suffix=""
      if [ "$os" = "windows" ]; then
        suffix=".exe"
      fi
      
      echo "构建 ${os^} ${arch^^} 版本"
      go env -w GOARCH=$arch
      
      # 根据条件设置不同的输出文件名格式
      if [[ "$os" == "darwin" || ("$os" == "linux" && "$arch" == "arm64") || ("$os" == "windows" && "$arch" == "arm64") ]]; then
        output_file="../miao-directory-${arch}-${os}${suffix}"
      else
        output_file="../miao-directory-x-${arch}-${os}${suffix}"
      fi
      
      go build -ldflags="-s -w" -o "$output_file"
    done
  done
  
  # 恢复resource.syso文件
  if [ -f "resource.syso.bak" ]; then
    echo "恢复resource.syso文件"
    mv resource.syso.bak resource.syso
  fi
  
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
    
    # # 压缩macOS AMD64版本
    # echo "正在压缩macOS AMD64版本"
    # upx $COMPRESSION_LEVEL -o ../miao-directory-amd64-darwin.upx ../miao-directory-amd64-darwin
    
    # # 压缩macOS ARM64版本
    # echo "正在压缩macOS ARM64版本"
    # upx $COMPRESSION_LEVEL -o ../miao-directory-arm64-darwin.upx ../miao-directory-arm64-darwin
  fi
  
  echo "所有压缩完成"
fi

echo "构建完成"
echo "构建模式: $([ "$FULL_BUILD" = true ] && echo "完整构建" || echo "基础构建")"
echo "压缩模式: $([ "$FAST_COMPRESSION" = true ] && echo "快速压缩" || echo "极限压缩")"