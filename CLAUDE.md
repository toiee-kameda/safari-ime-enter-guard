# IME Enter Guard（Safari 拡張機能）

Safari（macOS）を日本語入力で使うときの Enter キーの不便を解消する拡張機能。オープンソース（MIT）で、Mac App Store でも配布する予定。

1. **確定 Enter で送信しない（全サイト）**: 変換確定の Enter（`keyCode === 229`）をサイトに届く前に止める。
2. **Enter＝改行、⌘/Ctrl+Enter＝送信（登録サイトのみ）**: ツールバーのポップアップでサイトを登録する。

仕組みとサイトごとの対応は [docs/how-it-works.md](docs/how-it-works.md)、テスト手順と確認結果は [docs/testing.md](docs/testing.md) にある。

## 構成
- `extension/` … Web Extension 本体（Manifest V3）。App Store 版もここを元にする
  - `content.js` … 本体（document_start / 全フレーム / キャプチャ段階で keydown を処理）
  - `popup.html` / `popup.js` … サイトの登録・解除（`storage.local` の `sites`）
- `test/ime-test.html` … 機能1を確認するテストページ
- `docs/` … 技術メモ、テスト手順、App Store 公開手順、Claude Code 用プロンプト例
- `xcode/` … （予定）`safari-web-extension-converter` で作る Xcode プロジェクト

## 開発ルール
- 外部ライブラリやビルドツールは使わない（素の JavaScript のみ）。
- 機能2の初期登録サイトは `content.js` と `popup.js` の `DEFAULT_SITES`（両方そろえる）。
  サイト固有の特別な処理が必要になったら `content.js` にまとめ、docs/how-it-works.md に理由を書く。
- 動作が未確認の箇所は「未確認」と明記する。推測で「動く」と言わない。
  実機で確認したら docs/testing.md の「確認結果」を更新する。
- 新しいサイトの不具合調査は、`content.js` の `DEBUG` を `true` にして画面右下のログを読む。
  コミット・公開の前に `false` に戻す。
- 一般のサイトに目印や痕跡を残さない（プライバシー。PRIVACY.md の内容と矛盾させない）。
- 利用者向けの変更は CHANGELOG.md に書く。

## 未確認事項
- chatgpt.com での機能2
- 合成イベント（isTrusted=false）を無視するサイトで、⌘+Enter 送信が効くか
- keyup で送信するサイトで、機能1が効くか
- アイコン未作成
