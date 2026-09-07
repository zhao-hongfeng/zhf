// LinkHub 前端逻辑
const $ = (id) => document.getElementById(id);

const state = { bookmarks: [], keyword: '', category: '全部', editingId: null };

const gridEl = $('grid');
const chipsEl = $('chips');
const countEl = $('count');
const emptyEl = $('empty');
const emptyTitleEl = $('empty-title');
const emptyTextEl = $('empty-text');
const overlayEl = $('overlay');
const toastEl = $('toast');
const formEl = $('form');

// 字母头像的渐变色组,按标题哈希取用
const GRADIENTS = [
  ['#6366f1', '#22d3ee'], ['#f472b6', '#fb923c'], ['#34d399', '#22d3ee'],
  ['#a78bfa', '#f472b6'], ['#fbbf24', '#f87171'], ['#38bdf8', '#818cf8'],
];

const deleteTimers = new Map();

/* ---------- 工具函数 ---------- */

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return ''; }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let msg = '请求失败';
    try { msg = (await res.json()).detail || msg; } catch { /* 忽略 */ }
    throw new Error(msg);
  }
  return res.json();
}

let toastTimer = null;
function toast(msg, type = 'ok') {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

/* ---------- 渲染 ---------- */

function filtered() {
  const kw = state.keyword.trim().toLowerCase();
  return state.bookmarks.filter((b) => {
    const okCat = state.category === '全部' || b.category === state.category;
    const okKw = !kw || [b.title, b.url, b.note, b.category]
      .some((v) => (v || '').toLowerCase().includes(kw));
    return okCat && okKw;
  });
}

function render() {
  // 分类统计
  const cats = {};
  state.bookmarks.forEach((b) => { cats[b.category] = (cats[b.category] || 0) + 1; });
  const names = ['全部', ...Object.keys(cats)];

  chipsEl.innerHTML = names.map((c) => `
    <button class="chip ${c === state.category ? 'active' : ''}" data-cat="${escapeHtml(c)}">
      ${escapeHtml(c)}<span class="n">${c === '全部' ? state.bookmarks.length : cats[c]}</span>
    </button>`).join('');

  const list = filtered();
  countEl.textContent = (state.category === '全部' && !state.keyword.trim())
    ? `共 ${state.bookmarks.length} 个网址`
    : `显示 ${list.length} / ${state.bookmarks.length} 个网址`;

  gridEl.innerHTML = list.map((b, i) => {
    const letter = (b.title || hostOf(b.url) || '?').trim().charAt(0).toUpperCase();
    return `
      <a class="card" style="animation-delay:${Math.min(i * 40, 400)}ms"
         href="${escapeHtml(b.url)}" target="_blank" rel="noopener">
        <div class="card-row">
          <div class="favicon" data-domain="${escapeHtml(hostOf(b.url))}" data-letter="${escapeHtml(letter)}"></div>
          <div class="card-head">
            <h3 class="card-title">${escapeHtml(b.title)}</h3>
            <p class="card-host">${escapeHtml(hostOf(b.url))}</p>
          </div>
          <div class="card-actions">
            <button class="act-btn edit-btn" data-id="${b.id}" title="编辑">✎</button>
            <button class="act-btn del-btn" data-id="${b.id}" title="删除">✕</button>
          </div>
        </div>
        ${b.note ? `<p class="card-note">${escapeHtml(b.note)}</p>` : ''}
        <span class="cat-tag">${escapeHtml(b.category)}</span>
      </a>`;
  }).join('');

  // 空状态
  emptyEl.hidden = list.length > 0;
  if (!list.length) {
    if (state.bookmarks.length === 0) {
      emptyTitleEl.textContent = '还没有收藏任何网址';
      emptyTextEl.textContent = '点击「添加网址」,开始收藏你常去的网站吧';
    } else {
      emptyTitleEl.textContent = '没有匹配的网址';
      emptyTextEl.textContent = '换个关键词或分类试试';
    }
  }

  gridEl.querySelectorAll('.favicon').forEach(loadFavicon);
}

/* ---------- 网站图标(多源回退 → 字母头像) ---------- */

function loadFavicon(el) {
  const domain = el.dataset.domain;
  if (!domain) { showLetter(el); return; }
  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://${domain}/favicon.ico`,
  ];
  let i = 0;
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.onload = () => { el.replaceChildren(img); };
  img.onerror = () => { if (++i < sources.length) img.src = sources[i]; else showLetter(el); };
  img.src = sources[0];
}

function showLetter(el) {
  const ch = el.dataset.letter;
  let hash = 0;
  for (const c of ch) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = GRADIENTS[hash % GRADIENTS.length];
  el.style.background = `linear-gradient(135deg, ${a}, ${b})`;
  el.classList.add('letter');
  el.textContent = ch;
}

/* ---------- 弹窗 ---------- */

function openModal(bookmark = null) {
  state.editingId = bookmark ? bookmark.id : null;
  $('modal-title').textContent = bookmark ? '编辑网址' : '添加网址';
  $('f-url').value = bookmark ? bookmark.url : '';
  $('f-title').value = bookmark ? bookmark.title : '';
  $('f-category').value = bookmark ? bookmark.category : '';
  $('f-note').value = bookmark ? bookmark.note : '';
  refreshDatalist();
  overlayEl.hidden = false;
  requestAnimationFrame(() => overlayEl.classList.add('show'));
  setTimeout(() => $('f-url').focus(), 120);
}

function closeModal() {
  overlayEl.classList.remove('show');
  setTimeout(() => { overlayEl.hidden = true; }, 250);
}

function refreshDatalist() {
  const cats = [...new Set(state.bookmarks.map((b) => b.category))];
  $('cat-list').innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
}

/* ---------- 事件绑定 ---------- */

// 添加 / 编辑提交
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    url: $('f-url').value.trim(),
    title: $('f-title').value.trim(),
    category: $('f-category').value.trim() || '未分类',
    note: $('f-note').value.trim(),
  };
  if (!payload.url) { toast('请填写网址', 'err'); return; }
  try {
    if (state.editingId) {
      await api(`/api/bookmarks/${state.editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('已更新 ✓');
    } else {
      await api('/api/bookmarks', { method: 'POST', body: JSON.stringify(payload) });
      toast('已收藏 ✓');
    }
    closeModal();
    await loadBookmarks();
  } catch (err) { toast(err.message, 'err'); }
});

// 卡片上的编辑 / 删除按钮
gridEl.addEventListener('click', (e) => {
  const delBtn = e.target.closest('.del-btn');
  if (delBtn) {
    e.preventDefault();
    e.stopPropagation();
    const id = delBtn.dataset.id;
    if (!delBtn.classList.contains('confirming')) {
      // 第一次点击进入确认状态,2.5 秒后自动还原
      delBtn.classList.add('confirming');
      delBtn.textContent = '确认删除?';
      const timer = setTimeout(() => {
        delBtn.classList.remove('confirming');
        delBtn.textContent = '✕';
        deleteTimers.delete(id);
      }, 2500);
      deleteTimers.set(id, timer);
      return;
    }
    clearTimeout(deleteTimers.get(id));
    deleteTimers.delete(id);
    deleteBookmark(id);
    return;
  }

  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();
    const bm = state.bookmarks.find((b) => b.id === editBtn.dataset.id);
    if (bm) openModal(bm);
  }
});

async function deleteBookmark(id) {
  try {
    await api(`/api/bookmarks/${id}`, { method: 'DELETE' });
    toast('已删除');
    await loadBookmarks();
  } catch (err) { toast(err.message, 'err'); }
}

// 搜索与分类筛选
$('search').addEventListener('input', (e) => {
  state.keyword = e.target.value;
  render();
});

chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.category = chip.dataset.cat;
  render();
});

// 弹窗开关
$('btn-add').addEventListener('click', () => openModal());
$('btn-add-empty').addEventListener('click', () => openModal());
$('btn-cancel').addEventListener('click', closeModal);
$('modal-close').addEventListener('click', closeModal);
overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlayEl.hidden) closeModal();
});

/* ---------- 启动 ---------- */

async function loadBookmarks() {
  state.bookmarks = await api('/api/bookmarks');
  render();
}

loadBookmarks().catch((err) => toast(`加载失败:${err.message}`, 'err'));
