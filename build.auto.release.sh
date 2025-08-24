#!/bin/bash
set -Eeuo pipefail
IFS=$'\n\t'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/output"

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
mkdir -p "$OUT_DIR"

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
  [ -f "$OUT_DIR/$PREFIX-$suffix" ] && rm -f "$OUT_DIR/$PREFIX-$suffix"
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
    [ -f "$OUT_DIR/$PREFIX-$suffix" ] && rm -f "$OUT_DIR/$PREFIX-$suffix"
  done
  
  # 处理带x-前缀的不同系统和架构
  X_OS_ARCHS=(
    "freebsd:amd64,arm64,386"
    "openbsd:amd64,arm64,386"
    "windows:arm64"
    "linux:386,mips,mips64,mips64le,ppc64,ppc64le,riscv64,s390x"
  )
  
  # 清理带x-前缀的版本产物
  for os_arch in "${X_OS_ARCHS[@]}"; do
    IFS=":" read -r os archs <<< "$os_arch"
    IFS="," read -ra arch_array <<< "$archs"
    for arch in "${arch_array[@]}"; do
      file="$PREFIX-x-$arch-$os"
      [ -f "$OUT_DIR/$file" ] && rm -f "$OUT_DIR/$file"
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

# ===== 阶段1: 收集需要构建和进行upx压缩的目录列表 =====
echo "===== 阶段1: 收集构建和压缩目标 ====="

declare -a win_amd64_build_targets
declare -a other_build_targets
declare -a upx_targets

# 格式: "GOOS:GOARCH:OUTPUT_PATH:TAGS:LDFLAGS_EXTRA"
win_amd64_build_targets+=( "windows:amd64:$OUT_DIR/miao-directory-amd64-win.exe::" )
win_amd64_build_targets+=( "windows:amd64:$OUT_DIR/miao-directory-amd64-win.gui.exe:webview:-H=windowsgui" )

other_build_targets+=( "linux:amd64:$OUT_DIR/miao-directory-amd64-linux::" )

# 格式: "INPUT_PATH:OUTPUT_PATH"
upx_targets+=( "$OUT_DIR/miao-directory-amd64-win.exe:$OUT_DIR/miao-directory-amd64-win.upx.exe" )
upx_targets+=( "$OUT_DIR/miao-directory-amd64-win.gui.exe:$OUT_DIR/miao-directory-amd64-win.gui.upx.exe" )
upx_targets+=( "$OUT_DIR/miao-directory-amd64-linux:$OUT_DIR/miao-directory-amd64-linux.upx" )

if [ "$FULL_BUILD" = true ]; then
  # linux
  other_build_targets+=( "linux:arm64:$OUT_DIR/miao-directory-arm64-linux::" )
  other_build_targets+=( "linux:386:$OUT_DIR/miao-directory-x-386-linux::" )
  other_build_targets+=( "linux:mips:$OUT_DIR/miao-directory-x-mips-linux::" )
  other_build_targets+=( "linux:mips64:$OUT_DIR/miao-directory-x-mips64-linux::" )
  other_build_targets+=( "linux:mips64le:$OUT_DIR/miao-directory-x-mips64le-linux::" )
  other_build_targets+=( "linux:ppc64:$OUT_DIR/miao-directory-x-ppc64-linux::" )
  other_build_targets+=( "linux:ppc64le:$OUT_DIR/miao-directory-x-ppc64le-linux::" )
  other_build_targets+=( "linux:riscv64:$OUT_DIR/miao-directory-x-riscv64-linux::" )
  other_build_targets+=( "linux:s390x:$OUT_DIR/miao-directory-x-s390x-linux::" )
  # darwin
  other_build_targets+=( "darwin:amd64:$OUT_DIR/miao-directory-amd64-darwin::" )
  other_build_targets+=( "darwin:arm64:$OUT_DIR/miao-directory-arm64-darwin::" )
  # windows
  other_build_targets+=( "windows:arm64:$OUT_DIR/miao-directory-arm64-win.exe::" )
  # freebsd
  other_build_targets+=( "freebsd:amd64:$OUT_DIR/miao-directory-x-amd64-freebsd::" )
  other_build_targets+=( "freebsd:arm64:$OUT_DIR/miao-directory-x-arm64-freebsd::" )
  other_build_targets+=( "freebsd:386:$OUT_DIR/miao-directory-x-386-freebsd::" )
  # openbsd
  other_build_targets+=( "openbsd:amd64:$OUT_DIR/miao-directory-x-amd64-openbsd::" )
  other_build_targets+=( "openbsd:arm64:$OUT_DIR/miao-directory-x-arm64-openbsd::" )
  other_build_targets+=( "openbsd:386:$OUT_DIR/miao-directory-x-386-openbsd::" )

  upx_targets+=( "$OUT_DIR/miao-directory-arm64-linux:$OUT_DIR/miao-directory-arm64-linux.upx" )
fi

# ===== 阶段2: 并行执行所有版本的构建任务 =====
echo "===== 阶段2: 并行构建 ====="

build_target() {
  local target_info=($1)
  IFS=":" read -r goos goarch output tags ldflags_extra <<< "$target_info"
  
  echo "开始构建: $output"
  
  local ldflags="-s -w ${ldflags_extra-}"
  local build_cmd="GOOS=$goos GOARCH=$goarch go build -ldflags='$ldflags'"
  
  if [ -n "$tags" ]; then
    build_cmd+=" -tags '$tags'"
  fi
  
  build_cmd+=" -o '$output'"
  
  eval "$build_cmd"
  
  if [ "$goos" != "windows" ]; then
    chmod +x "$output"
  fi
  
  echo "完成构建: $output"
}

# 构建需要 resource.syso 的版本 (Win AMD64)
echo "--- 开始构建 Windows AMD64 版本 ---"
for target in "${win_amd64_build_targets[@]}"; do
  build_target "$target" &
done
wait
echo "--- Windows AMD64 版本构建完成 ---"

# 为其他版本构建做准备
if [ -f "resource.syso" ]; then
  echo "备份 resource.syso 文件"
  mv resource.syso resource.syso.bak
fi

# 构建其他所有版本
echo "--- 开始构建其他版本 ---"
for target in "${other_build_targets[@]}"; do
  CGO_ENABLED=0 build_target "$target" &
done
wait
echo "--- 其他版本构建完成 ---"

# 恢复 resource.syso
if [ -f "resource.syso.bak" ]; then
  echo "恢复 resource.syso 文件"
  mv resource.syso.bak resource.syso
fi

# ===== 阶段3: 并行执行所有版本的upx压缩处理 =====
echo "===== 阶段3: 并行UPX压缩 ====="

if check_upx; then
  COMPRESSION_LEVEL="--best"
  if [ "$FAST_COMPRESSION" = true ]; then
    echo "使用快速压缩模式"
    COMPRESSION_LEVEL="--fast"
  else
    echo "使用极限压缩模式"
  fi

  compress_target() {
    local target_info=($1)
    IFS=":" read -r input_file output_file <<< "$target_info"
    if [ -f "$input_file" ]; then
      echo "开始压缩: $input_file"
      upx "$COMPRESSION_LEVEL" -o "$output_file" "$input_file"
      echo "完成压缩: $output_file"
    else
      echo "警告: 找不到文件 $input_file，跳过压缩"
    fi
  }

  for target in "${upx_targets[@]}"; do
    compress_target "$target" &
  done
  wait
  echo "--- 所有压缩任务完成 ---"
fi

echo "构建完成"
echo "构建模式: $([ "$FULL_BUILD" = true ] && echo "完整构建" || echo "基础构建")"
echo "压缩模式: $([ "$FAST_COMPRESSION" = true ] && echo "快速压缩" || echo "极限压缩")"