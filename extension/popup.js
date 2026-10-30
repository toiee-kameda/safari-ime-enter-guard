// IME Enter Guard — ツールバーのポップアップ
// 機能2（Enter=改行 / ⌘+Enter=送信）を使うサイトを登録・解除する。
// 保存先: storage.local の "sites"（ホスト名の配列）。content.js が読む。

(() => {
  'use strict';

  // content.js の DEFAULT_SITES と同じ値にしておく
  const DEFAULT_SITES = ['claude.ai', 'chatgpt.com'];
  const api = globalThis.browser || globalThis.chrome;

  const hostEl = document.getElementById('host');
  const toggleEl = document.getElementById('toggle');
  const toggleLabelEl = document.getElementById('toggleLabel');
  const listEl = document.getElementById('list');
  const countEl = document.getElementById('count');

  let sites = [];
  let currentHost = null;

  // "www." は外して登録する（www あり・なしの両方に効くように）
  const normalize = (host) => host.replace(/^www\./, '');
  const matchesHost = (host, list) =>
    list.some((d) => host === d || host.endsWith('.' + d));

  async function loadSites() {
    const r = await api.storage.local.get('sites');
    sites = Array.isArray(r.sites) ? r.sites : DEFAULT_SITES.slice();
  }

  async function saveSites() {
    await api.storage.local.set({ sites });
    render();
  }

  function render() {
    if (currentHost) toggleEl.checked = matchesHost(currentHost, sites);
    toggleLabelEl.textContent = toggleEl.checked ? 'オン' : 'オフ';
    countEl.textContent = sites.length;
    listEl.textContent = '';
    if (sites.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'まだありません';
      listEl.appendChild(li);
      return;
    }
    for (const d of sites) {
      const li = document.createElement('li');
      // いま開いているサイトに当てはまる行は色を付ける
      if (currentHost && matchesHost(currentHost, [d])) li.className = 'current';
      const name = document.createElement('span');
      name.textContent = d;
      const del = document.createElement('button');
      del.className = 'remove';
      del.textContent = '×';
      del.title = '解除';
      del.setAttribute('aria-label', d + ' を解除');
      del.addEventListener('click', () => {
        sites = sites.filter((s) => s !== d);
        saveSites();
      });
      li.append(name, del);
      listEl.appendChild(li);
    }
  }

  // 今のタブのホスト名を content.js に聞く（タブのURLを読む権限が不要になる）
  async function getCurrentHost() {
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (!tab) return null;
      const res = await api.tabs.sendMessage(tab.id, { type: 'getHost' });
      return res && res.host ? res.host : null;
    } catch (_) {
      return null;  // 設定画面や新規タブなど、content.js が動いていないページ
    }
  }

  toggleEl.addEventListener('change', () => {
    if (!currentHost) return;
    if (toggleEl.checked) {
      const d = normalize(currentHost);
      if (!sites.includes(d)) sites = [...sites, d];
    } else {
      // このサイトに当てはまる登録をすべて外す（例: claude.ai を外す）
      sites = sites.filter((d) => !matchesHost(currentHost, [d]));
    }
    saveSites();
  });

  (async () => {
    await loadSites();
    currentHost = await getCurrentHost();
    if (currentHost) {
      hostEl.textContent = currentHost;
    } else {
      document.getElementById('current').hidden = true;
      document.getElementById('unavailable').hidden = false;
    }
    render();
  })();
})();
