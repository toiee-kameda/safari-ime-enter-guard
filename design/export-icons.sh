#!/bin/sh
# design/*.svg から、拡張機能・ツールバー・App Store 用の PNG を書き出す
# 使い方: sh design/export-icons.sh（リポジトリのルートで実行。Xcode のコマンドラインツールが必要）
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
swiftc -O design/render.swift -o "$tmp/render"
for s in 48 96 128 256 512; do "$tmp/render" design/icon.svg "extension/images/icon-$s.png" "$s"; done
for s in 16 32; do "$tmp/render" design/toolbar-icon.svg "extension/images/toolbar-icon-$s.png" "$s"; done
"$tmp/render" design/icon.svg design/app-icon-1024.png 1024
rm -rf "$tmp"
echo "書き出しました"
