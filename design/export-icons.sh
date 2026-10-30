#!/bin/sh
# design/*.svg から、拡張機能・ツールバー・Mac アプリ・App Store 用の PNG を書き出す
# 使い方: sh design/export-icons.sh（Xcode のコマンドラインツールが必要）
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
swiftc -O design/render.swift -o "$tmp/render"
r="$tmp/render"

# 拡張機能（Safari の設定画面など）とツールバー
for s in 48 96 128 256 512; do "$r" design/icon.svg "extension/images/icon-$s.png" "$s"; done
for s in 16 32; do "$r" design/toolbar-icon.svg "extension/images/toolbar-icon-$s.png" "$s"; done

# App Store 用
"$r" design/icon.svg design/app-icon-1024.png 1024

# Mac アプリ（Xcode プロジェクト）
app="xcode/IME Enter Guard/IME Enter Guard"
set_dir="$app/Assets.xcassets/AppIcon.appiconset"
for s in 16 32 128 256 512; do
  "$r" design/icon.svg "$set_dir/mac-icon-$s@1x.png" "$s"
  "$r" design/icon.svg "$set_dir/mac-icon-$s@2x.png" $((s * 2))
done
"$r" design/icon.svg "$app/Resources/Icon.png" 256

rm -rf "$tmp"
echo "書き出しました"
