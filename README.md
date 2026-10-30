# IME Enter Guard

Safari（macOS）で日本語を入力するときの「Enter キーの困りごと」を解消する拡張機能です。

- **変換を確定する Enter で、勝手に送信されない**（すべてのサイト）
- **Enter＝改行、⌘+Enter＝送信 に切り替えられる**（登録したサイトだけ）

> English summary: A Safari Web Extension for Japanese (IME) users.
> It stops the IME confirmation Enter from submitting forms, and on sites you choose,
> makes Enter insert a newline and ⌘/Ctrl+Enter send.

## なぜ必要か

Safari では、日本語変換を確定する Enter を押したときに、Web ページ側には「変換中ではない普通の Enter」に見えてしまうことがあります。
そのため、チャットや検索欄で **変換を確定しただけで送信される** サイトがあります。

また、AI チャットのように長い文章を書くサイトでは、Enter で送信されると困ることがあります。
Enter で改行し、⌘+Enter で送信できると、書きやすくなります。

## 機能

### 1. 確定 Enter で送信しない（全サイト）
日本語変換の確定に使った Enter は、サイトに届く前に止めます。変換そのものは普通に確定します。

### 2. Enter＝改行、⌘+Enter＝送信（登録サイトのみ）
ツールバーの「IME Enter Guard」ボタンから、サイトごとにオン／オフを切り替えられます。
最初から `claude.ai` と `chatgpt.com` が登録されています。

| 操作 | 登録サイト | 登録していないサイト |
|---|---|---|
| 変換確定の Enter | 何もしない（確定だけ） | 何もしない（確定だけ） |
| Enter | 改行 | サイトのまま（多くは送信） |
| ⌘+Enter / Ctrl+Enter | 送信 | サイトのまま |

## 動作確認済みのサイト

| サイト | 確定 Enter で送信しない | Enter で改行 | ⌘+Enter で送信 |
|---|---|---|---|
| claude.ai | ✅ | ✅ | ✅ |
| Perplexity | ✅ | ✅ | ✅ |
| ChatGPT | 未確認 | 未確認 | 未確認 |

確認環境: macOS / Safari 27 / macOS 標準の日本語入力。詳しくは [docs/testing.md](docs/testing.md)。

## インストール

### App Store から（準備中）
Mac App Store での配布を予定しています。

### Xcode でビルドする
[docs/app-store.md](docs/app-store.md) の「自分の Mac で使う」をご覧ください。Safari を終了しても外れません。

### ソースから試す（Xcode 不要・一時的）
1. Safari の「設定」>「詳細」で「Web デベロッパ用の機能を表示」をオンにします。
2. 「設定」>「デベロッパ」タブの「一時的な拡張機能を追加」から、このリポジトリの `extension` フォルダを選びます。
3. 「設定」>「拡張機能」で IME Enter Guard を有効にし、サイトへのアクセスを許可します。

一時的な拡張機能は、Safari を終了すると外れます。

## プライバシー

この拡張機能は、入力した文字や閲覧履歴を集めたり、外部に送ったりしません。
保存するのは「Enter＝改行にするサイトの一覧」だけで、お使いの Mac の中に保存されます。
詳しくは [PRIVACY.md](PRIVACY.md) をご覧ください。

## フォルダ構成

```
extension/   拡張機能の本体（Safari に読み込むのはこのフォルダ）
  manifest.json   拡張機能の設定
  content.js      Enter キーを処理する本体
  popup.html/js   ツールバーのボタンを押したときの画面
  images/         アイコン
design/      アイコンの元データ（SVG）と書き出しスクリプト
xcode/       Mac アプリ（App Store 用）の Xcode プロジェクト
test/        動作確認用のテストページ
docs/        技術メモ・テスト手順・公開手順
```

## 開発者向け

- 仕組みと、サイトごとの対応内容: [docs/how-it-works.md](docs/how-it-works.md)
- テスト手順: [docs/testing.md](docs/testing.md)
- App Store 公開までの手順: [docs/app-store.md](docs/app-store.md)
- 外部ライブラリやビルドツールは使わず、素の JavaScript だけで書いています。

不具合の報告やサイトの追加要望は、GitHub の Issues へどうぞ。
報告のときは、サイトの URL と、何を押してどうなったかを書いてください。

## ライセンス

[MIT License](LICENSE)
