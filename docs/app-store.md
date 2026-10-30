# App Store 公開までの手順（計画）

公開までの順番と、決めておくことのメモです。

## 1. 公開前に用意するもの
- [x] アイコン（拡張機能用: 48 / 96 / 128 / 256 / 512px、アプリ用: `design/app-icon-1024.png`）
- [x] ツールバー用アイコン（16 / 32px、単色）
  元データは `design/*.svg`。直したら `sh design/export-icons.sh` で書き出し直す。
- [ ] 拡張機能の名前と説明の英語・日本語化（`extension/_locales/`）
- [ ] アプリを開いたときの画面（`Resources/Base.lproj/Main.html`）の日本語化
- [ ] App Store の説明文・スクリーンショット
- [ ] プライバシーポリシーの公開 URL（[PRIVACY.md](../PRIVACY.md) を GitHub 上で公開して使う）
- [ ] サポート用 URL（GitHub の Issues など）

## 2. Xcode プロジェクト（作成済み）
Safari の拡張機能は、Mac アプリに入れて配布します。`xcode/IME Enter Guard/` に、次のコマンドで作りました。

```bash
xcrun safari-web-extension-converter extension --project-location xcode --app-name "IME Enter Guard" \
  --bundle-identifier jp.toiee.ImeEnterGuard --swift --macos-only --no-open --no-prompt
```

| 項目 | 値 |
|---|---|
| アプリの Bundle ID | `jp.toiee.ImeEnterGuard` |
| 拡張機能の Bundle ID | `jp.toiee.ImeEnterGuard.Extension` |
| 対応 macOS | 12.0 以降（12〜26 での動作は未確認） |
| バージョン | `MARKETING_VERSION` を `manifest.json` の `version` とそろえる |

- Xcode は `extension/` のファイルを**直接参照**しています（コピーしていません）。
  `extension/` のファイルを直せば、そのまま Xcode でのビルドにも反映されます。
- `extension/` に**新しいファイルを足したとき**は、Xcode の拡張機能ターゲットの Resources にも追加が必要です。
- アプリのアイコンも `sh design/export-icons.sh` で書き出されます。

### 自分の Mac で使う（App Store を通さずに）
1. Xcode で `xcode/IME Enter Guard/IME Enter Guard.xcodeproj` を開きます。
2. Xcode の「設定」>「Accounts」で Apple ID を追加します（無料の Apple ID で可）。
3. 左の一覧でプロジェクトを選び、2つのターゲット（アプリと Extension）の「Signing & Capabilities」で Team に自分を選びます。
4. ⌘R で実行すると、アプリが起動し、Safari の拡張機能に「IME Enter Guard」が追加されます。
5. Safari の「設定」>「拡張機能」で有効にします。一時的な拡張機能は外しておきます（同じ機能が2つ動かないように）。

- 署名しないでビルドした場合は、Safari の「デベロッパ」設定で「未署名の拡張機能を許可」をオンにする必要があります（Safari を終了すると戻ります）。

## 3. 配布
- Apple Developer Program（有料）への登録が必要です。
- Xcode でアーカイブし、App Store Connect にアップロードして審査に出します。
- 審査では、すべてのサイトへのアクセスを求める理由を説明します（Enter キーを処理するため）。

## 4. 公開版にする前の確認
- [ ] `content.js` の `DEBUG` が `false` になっている
- [ ] `manifest.json` の `version` と CHANGELOG がそろっている
- [ ] [docs/testing.md](testing.md) の手順で、主なサイトを確認した
