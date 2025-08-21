#!/bin/bash
set -Eeuo pipefail
IFS=$'\n\t'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$1 未找到，请安装后再试"
    exit 1
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
require_cmd pnpm
require_cmd go
pnpm run build

echo "复制前端文件到服务端..."
rm -rf ./src-server/web/*
mkdir -p ./src-server/web/
if compgen -G "./dist/*" > /dev/null; then
  cp -r ./dist/* ./src-server/web/
fi

cd "$SCRIPT_DIR/src-server"

# ===== 构建阶段 =====
echo "===== 开始构建阶段 ====="

# 基础构建 - 始终构建的版本
echo "构建基础版本..."

# Windows AMD64 无GUI
echo "构建 Windows AMD64 无GUI 版本"
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$SCRIPT_DIR/miao-directory-amd64-win.exe"

# Linux AMD64 无GUI
echo "构建 Linux AMD64 无GUI 版本"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$SCRIPT_DIR/miao-directory-amd64-linux"
chmod +x "$SCRIPT_DIR/miao-directory-amd64-linux"

# Windows AMD64 GUI
echo "构建 Windows AMD64 GUI 版本"
GOOS=windows GOARCH=amd64 go build -tags webview -ldflags="-s -w -H=windowsgui" -o "$SCRIPT_DIR/miao-directory-amd64-win.gui.exe"

# 完整构建 - 额外的系统和架构
if [ "$FULL_BUILD" = true ]; then
  echo "构建额外架构版本..."
  
  # 备份resource.syso文件(如果存在)
  if [ -f "resource.syso" ]; then
    echo "备份resource.syso文件"
    mv resource.syso resource.syso.bak
  fi
  
  : # CGO 在每次构建调用中禁用，无需全局 export
  
  # 定义操作系统和架构映射
  # 在工具函数处增加大小写格式化，避免使用 Bash 4 的 ${var^}/${var^^}
  uc_first() {
    local s="$1"
    local first="${s:0:1}"
    local rest="${s:1}"
    printf "%s%s" "$(printf "%s" "$first" | tr '[:lower:]' '[:upper:]')" "$rest"
  }
  
  to_upper() {
    printf "%s" "$1" | tr '[:lower:]' '[:upper:]'
  }
  OS_LIST="linux darwin windows freebsd openbsd"
  for os in $OS_LIST; do
    echo "构建 $(uc_first "$os") 系列版本..."
    case "$os" in
      linux) archs="arm64 386 mips mips64 mips64le ppc64 ppc64le riscv64 s390x" ;;
      darwin) archs="amd64 arm64" ;;
      windows) archs="arm64 386" ;;
      freebsd) archs="amd64 arm64 386" ;;
      openbsd) archs="amd64 arm64 386" ;;
      *) archs="" ;;
    esac

    for arch in $archs; do
      # 设置输出文件名后缀
      suffix=""
      if [ "$os" = "windows" ]; then
        suffix=".exe"
      fi

      echo "构建 $(uc_first "$os") $(to_upper "$arch") 版本"

      # 根据条件设置不同的输出文件名格式
      if [[ "$os" == "darwin" || ("$os" == "linux" && "$arch" == "arm64") || ("$os" == "windows" && "$arch" == "arm64") ]]; then
        output_file="$SCRIPT_DIR/miao-directory-${arch}-${os}${suffix}"
      else
        output_file="$SCRIPT_DIR/miao-directory-x-${arch}-${os}${suffix}"
      fi

      CGO_ENABLED=0 GOOS="$os" GOARCH="$arch" go build -ldflags="-s -w" -o "$output_file"
      if [ "$os" != "windows" ]; then
        chmod +x "$output_file"
      fi
    done
  done
  
  # 恢复resource.syso文件
  if [ -f "resource.syso.bak" ]; then
    echo "恢复resource.syso文件"
    mv resource.syso.bak resource.syso
  fi
  
  : # 无需恢复 CGO，全程使用内联变量
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
  upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-amd64-win.upx.exe" "$SCRIPT_DIR/miao-directory-amd64-win.exe"
  
  # 压缩Linux AMD64版本
  echo "正在压缩Linux AMD64版本"
  upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-amd64-linux.upx" "$SCRIPT_DIR/miao-directory-amd64-linux"
  
  # 压缩Windows GUI版本
  echo "正在压缩Windows AMD64 GUI版本"
  upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-amd64-win.gui.upx.exe" "$SCRIPT_DIR/miao-directory-amd64-win.gui.exe"
  
  # 压缩额外架构版本
  if [ "$FULL_BUILD" = true ]; then
    echo "压缩额外架构版本..."
    
    # 压缩Linux ARM64版本
    echo "正在压缩Linux ARM64版本"
    upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-arm64-linux.upx" "$SCRIPT_DIR/miao-directory-arm64-linux"
    
    # # 压缩macOS AMD64版本
    # echo "正在压缩macOS AMD64版本"
    # upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-amd64-darwin.upx" "$SCRIPT_DIR/miao-directory-amd64-darwin"
    
    # # 压缩macOS ARM64版本
    # echo "正在压缩macOS ARM64版本"
    # upx $COMPRESSION_LEVEL -o "$SCRIPT_DIR/miao-directory-arm64-darwin.upx" "$SCRIPT_DIR/miao-directory-arm64-darwin"
  fi
  
  echo "所有压缩完成"
fi

echo "构建完成"
echo "构建模式: $([ "$FULL_BUILD" = true ] && echo "完整构建" || echo "基础构建")"
echo "压缩模式: $([ "$FAST_COMPRESSION" = true ] && echo "快速压缩" || echo "极限压缩")"