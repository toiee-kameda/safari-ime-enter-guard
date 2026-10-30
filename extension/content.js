// IME Enter Guard — content script
//
// 機能1: 日本語入力の「確定Enter」をサイトに届く前に止める（全サイト共通）
//   Safari では確定Enterの keydown で isComposing が false になるため、
//   isComposing だけで判定しているサイトが誤って送信してしまう。
//   確定Enterには keyCode 229 が付くので、それを目印に止める。
//
// 機能2: 登録したサイトだけ、Enter=改行 / ⌘・Ctrl+Enter=送信 にする
//   登録はツールバーのポップアップ（popup.html）から行い、storage.local の
//   "sites"（ホスト名の配列）に保存する。未設定のときは DEFAULT_SITES を使う。

(() => {
  'use strict';

  // テストページ（test/ime-test.html）で「拡張機能が効いているか」を表示するための目印。
  // 一般のサイトから拡張機能の有無を見分けられないよう、手元のページだけに付ける。
  const isLocalTestPage = location.protocol === 'file:' ||
    ['localhost', '127.0.0.1'].includes(location.hostname);
  if (isLocalTestPage && document.documentElement) {
    document.documentElement.dataset.imeEnterGuard = 'on';
  }

  // ---- サイト設定（機能2の対象） -------------------------------------
  // ホスト名で登録する。"claude.ai" を登録すると "www.claude.ai" なども対象。
  // popup.js にも同じ初期値があるので、変えるときは両方そろえる。
  const DEFAULT_SITES = ['claude.ai', 'chatgpt.com'];
  const api = globalThis.browser || globalThis.chrome;

  const matchesHost = (host, list) =>
    list.some((d) => host === d || host.endsWith('.' + d));

  // 保存値を読み終わるまでは初期値で判定する
  let siteOn = matchesHost(location.hostname, DEFAULT_SITES);
  const applySites = (list) => {
    siteOn = matchesHost(location.hostname, Array.isArray(list) ? list : DEFAULT_SITES);
  };
  try {
    api.storage.local.get('sites').then((r) => applySites(r.sites), () => {});
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.sites) applySites(changes.sites.newValue);
    });
    // ポップアップから「このタブのホスト名」を聞かれたら答える（最上位フレームのみ）
    if (window === window.top) {
      api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg && msg.type === 'getHost') sendResponse({ host: location.hostname });
      });
    }
  } catch (_) {
    // storage が使えない環境では初期値のまま動かす
  }

  // この拡張機能自身が作ったイベントを見分けるための印
  const ownEvents = new WeakSet();

  // ---- 調査用ログ（ふだんはオフ。調べるときだけ DEBUG を true にする） ----
  // 画面右下に、Enter と日本語変換の出来事を最新8件まで表示する
  const DEBUG = false;
  const debugLines = [];
  let debugBox = null;
  function debugLog(msg) {
    if (!DEBUG || window !== window.top) return;
    const t = new Date();
    const stamp = t.toLocaleTimeString() + '.' + String(t.getMilliseconds()).padStart(3, '0');
    debugLines.unshift(`${stamp} ${msg}`);
    debugLines.length = Math.min(debugLines.length, 8);
    if (!debugBox && document.body) {
      debugBox = document.createElement('div');
      debugBox.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:2147483647;' +
        'pointer-events:none;background:rgba(0,0,0,.8);color:#fff;font:12px/1.4 ui-monospace,monospace;' +
        'padding:6px 8px;border-radius:6px;white-space:pre;max-width:60vw;overflow:hidden;';
      document.body.appendChild(debugBox);
    }
    if (debugBox) debugBox.textContent = 'IME Enter Guard ログ（新しい順）\n' + debugLines.join('\n');
  }

  // compositionend 直後の Enter も確定Enterとみなす（保険）
  let lastCompositionEnd = 0;
  const COMPOSITION_GRACE_MS = 30;
  window.addEventListener('compositionstart', () => debugLog('変換開始'), true);
  window.addEventListener('compositionend', () => {
    lastCompositionEnd = performance.now();
    debugLog('変換終了');
  }, true);

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const t = (el.type || 'text').toLowerCase();
      return ['text', 'search', 'email', 'url', 'tel', 'password', ''].includes(t);
    }
    return false;
  }

  function isImeEnter(e) {
    return (
      e.isComposing ||
      e.keyCode === 229 ||
      performance.now() - lastCompositionEnd < COMPOSITION_GRACE_MS
    );
  }

  // 合成の Enter を送る。サイトが keydown を処理した（preventDefault した）なら true
  function dispatchEnter(target, { shift = false } = {}) {
    const init = {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
      shiftKey: shift, bubbles: true, cancelable: true, composed: true,
    };
    let handled = false;
    for (const type of ['keydown', 'keypress', 'keyup']) {
      const ev = new KeyboardEvent(type, init);
      ownEvents.add(ev);
      if (!target.dispatchEvent(ev) && type === 'keydown') handled = true;
    }
    return handled;
  }

  // 合成 Shift+Enter を誰も処理しなかったときに、改行を直接入れる。
  // Lexical（Perplexity の入力欄）は Safari では keydown ではなく
  // beforeinput(insertLineBreak) を見て改行するので、まずそれを送る。
  // それも処理されなければ（普通の textarea など）ブラウザの編集機能で入れる。
  function insertLineBreak(target) {
    const ev = new InputEvent('beforeinput', {
      inputType: 'insertLineBreak', bubbles: true, cancelable: true, composed: true,
    });
    if (!target.dispatchEvent(ev)) return 'beforeinput';
    if (target.isContentEditable) document.execCommand('insertLineBreak');
    else document.execCommand('insertText', false, '\n');
    return 'execCommand';
  }

  // 確定Enterを止めた代わりに「IMEが処理したキー」(key=Process) をサイトに渡す。
  // ProseMirror（claude.ai / ChatGPT の入力欄）は Safari 向けに
  // 「変換終了から500ms以内の最初の keydown は確定Enterとみなして無視する」処理を持つ。
  // 確定Enterを隠すだけだと、その直後に押した本当のEnterが無視されて改行されない。
  // このダミーで「最初の keydown」を消費させておく。
  function notifyImeKey(target) {
    const ev = new KeyboardEvent('keydown', {
      key: 'Process', keyCode: 229, which: 229,
      bubbles: true, cancelable: true, composed: true,
    });
    ownEvents.add(ev);
    target.dispatchEvent(ev);
  }

  window.addEventListener('keydown', (e) => {
    if (ownEvents.has(e)) return;          // 自分で作ったイベントは素通し
    if (e.key !== 'Enter') return;
    if (!isEditable(e.target)) return;

    const info = `Enter keyCode=${e.keyCode} 変換中=${e.isComposing} ` +
      `変換終了から${Math.round(performance.now() - lastCompositionEnd)}ms` +
      `${e.shiftKey ? ' +Shift' : ''}${e.metaKey ? ' +⌘' : ''}${e.ctrlKey ? ' +Ctrl' : ''}`;

    // 機能1: 確定Enterはサイトに渡さない（IMEの確定自体は妨げない）
    if (isImeEnter(e)) {
      e.stopImmediatePropagation();
      notifyImeKey(e.target);
      debugLog(`${info} → 確定Enterとして止めた`);
      return;
    }

    if (!siteOn) {                         // 機能2は登録サイトのみ
      debugLog(`${info} → そのまま通した（未登録サイト）`);
      return;
    }

    const send = e.metaKey || e.ctrlKey;
    if (send) {
      // ⌘/Ctrl+Enter → サイトには「普通のEnter」として渡して送信させる
      e.preventDefault();
      e.stopImmediatePropagation();
      dispatchEnter(e.target);
      debugLog(`${info} → 送信用Enterに変えた`);
    } else if (!e.shiftKey && !e.altKey) {
      // Enter → 改行（サイトには Shift+Enter として渡す）
      e.preventDefault();
      e.stopImmediatePropagation();
      if (dispatchEnter(e.target, { shift: true })) {
        debugLog(`${info} → 改行用Shift+Enterに変えた`);
      } else {
        const how = insertLineBreak(e.target);
        debugLog(`${info} → Shift+Enterが効かず、改行を直接入れた(${how})`);
      }
    } else {
      debugLog(`${info} → そのまま通した`);
    }
  }, true);
})();
