# 仕組みと技術メモ

## 全体の流れ

`extension/content.js` は全サイト・全フレームに `document_start` で読み込まれ、
`window` のキャプチャ段階で `keydown` を受け取ります。サイト自身のハンドラより先に動くためです。

Enter の keydown は、次の順に判定します。

1. 拡張機能が自分で作ったイベント → そのまま通す
2. 確定 Enter（機能1）→ サイトに渡さない
3. 登録サイトでなければ → そのまま通す
4. ⌘/Ctrl+Enter → 本物の Enter を止め、合成の Enter（修飾キーなし）を送って送信させる
5. Enter（修飾キーなし）→ 本物の Enter を止め、改行を入れる（後述の3段構え）

## 機能1: 確定 Enter の見分け方

Safari では、日本語変換を確定する Enter の keydown で `isComposing` が `false` になります。
`isComposing` だけで判定するサイトは、確定しただけで送信してしまいます。

確定 Enter には `keyCode === 229` が付くので、これを目印にします（Safari 27 で確認）。
保険として、`isComposing === true` と、`compositionend` から 30ms 以内の Enter も確定 Enter とみなします。

確定 Enter は `stopImmediatePropagation()` でサイトに届かないようにします。
`preventDefault()` はしないので、IME の確定そのものは妨げません。

### 確定 Enter の代わりに渡すダミーキー

確定 Enter を止めたあと、代わりに `key: 'Process'`（`keyCode: 229`）の合成 keydown をサイトに渡します。

理由: ProseMirror（claude.ai / ChatGPT の入力欄）は Safari 向けに、
「`compositionend` から 500ms 以内の最初の keydown は確定 Enter とみなして無視する」処理を持っています。
確定 Enter を隠すだけだと、その直後に押した **本物の Enter** が無視され、改行されません。
ダミーキーで「最初の keydown」を消費させておくと、次の Enter が正しく処理されます。

`key: 'Process'` は「IME が処理したキー」を表す標準の値で、ふつうのサイトは反応しません。

## 機能2: Enter で改行を入れる3段構え

入力欄の作りはサイトごとに違うため、次の順に試します。

1. **合成 Shift+Enter を送る。** サイトがこれを処理（`preventDefault`）すれば完了。
   ProseMirror（claude.ai / ChatGPT）はここで改行します。
2. **`beforeinput`（`inputType: 'insertLineBreak'`）を送る。** 処理されれば完了。
   Lexical（Perplexity）は Safari では keydown の Enter を処理せず、
   ブラウザが出す `beforeinput` を見て改行します。合成 keydown では `beforeinput` が出ないため、直接送ります。
3. **`document.execCommand` で改行を入れる。** 普通の `textarea` や `contenteditable` 向け。

## サイトの登録

- 登録はツールバーのポップアップ（`popup.html` / `popup.js`）から行います。
- `storage.local` の `sites` に、ホスト名の配列で保存します。`www.` は外して保存します。
- `claude.ai` を登録すると、`claude.ai` と、その下のサブドメインが対象になります。
- 未設定のときの初期値は `DEFAULT_SITES`（`content.js` と `popup.js` の両方にあり、そろえておく必要があります）。
- ポップアップは今のタブの URL を読まず、`content.js` にホスト名を問い合わせます（タブ権限を求めないため）。

## 調査用ログ

`content.js` の `DEBUG` を `true` にすると、画面右下に Enter と変換の出来事が表示されます。
Web インスペクタを開かずに、スクリーンショットだけで挙動を調べられます。公開版では `false` にしておきます。

## 既知の課題

- 合成イベント（`isTrusted === false`）を無視するサイトでは、⌘+Enter の送信が効かない可能性があります。
  その場合は、送信ボタンをクリックする方式をサイト別に用意する必要があります。
- keyup で送信するサイトは、機能1だけでは防げない可能性があります。
- claude.ai と Perplexity は、拡張機能がなくても確定 Enter で送信されません（サイト側で対策済み）。
