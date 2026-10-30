# App Store 公開までの手順（計画）

まだ実施していません。順番と、決めておくことのメモです。

## 1. 公開前に用意するもの
- [x] アイコン（拡張機能用: 48 / 96 / 128 / 256 / 512px、アプリ用: `design/app-icon-1024.png`）
- [x] ツールバー用アイコン（16 / 32px、単色）
  元データは `design/*.svg`。直したら `sh design/export-icons.sh` で書き出し直す。
- [ ] 拡張機能の名前と説明の英語・日本語化（`extension/_locales/`）
- [ ] App Store の説明文・スクリーンショット
- [ ] プライバシーポリシーの公開 URL（[PRIVACY.md](../PRIVACY.md) を GitHub 上で公開して使う）
- [ ] サポート用 URL（GitHub の Issues など）

## 2. Xcode プロジェクトを作る
Safari の拡張機能は、Mac アプリに入れて配布します。Apple のツールで、`extension/` から Xcode プロジェクトを作ります。

```bash
xcrun safari-web-extension-converter extension --project-location xcode --app-name "IME Enter Guard" --macos-only --copy-resources
```

- 作ったプロジェクトは `xcode/` に置き、git で管理します（`xcuserdata/` などは `.gitignore` 済み）。
- `--copy-resources` を付けない場合、Xcode は `extension/` を直接参照します。
  どちらにするかは、作るときに決めます（参照にすると、ファイルが1か所で済みます）。
- Bundle Identifier（例: `jp.toiee.ime-enter-guard`）を決める必要があります。

## 3. 配布
- Apple Developer Program（有料）への登録が必要です。
- Xcode でアーカイブし、App Store Connect にアップロードして審査に出します。
- 審査では、すべてのサイトへのアクセスを求める理由を説明します（Enter キーを処理するため）。

## 4. 公開版にする前の確認
- [ ] `content.js` の `DEBUG` が `false` になっている
- [ ] `manifest.json` の `version` と CHANGELOG がそろっている
- [ ] [docs/testing.md](testing.md) の手順で、主なサイトを確認した
