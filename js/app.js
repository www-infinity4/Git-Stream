/**
 * Git-Stream App — Main Entry Point
 */

import { loadCategory, relativeTime, EXPLORE_FEEDS } from './feed.js';
import {
  openImportModal,
  openExtractModal,
  openMediaModal,
  openMusicModal,
  openVisualizerModal,
  openUpdateModal,
  openTokenModal,
  openEncodeModal,
  openDoubleModal,
  openArtModal,
  openEditModal,
} from './features.js';

/* ============================================================
   Category definitions
   ============================================================ */
const CATEGORIES = [
  { key: 'ai',     icon: '🤖', label: 'AI / ML' },
  { key: 'tools',  icon: '🔧', label: 'Dev Tools' },
  { key: 'os',     icon: '💻', label: 'OS' },
  { key: 'games',  icon: '🎮', label: 'Games' },
  { key: 'web',    icon: '🌐', label: 'Web' },
  { key: 'mobile', icon: '📱', label: 'Mobile' },
  { key: 'crypto', icon: '₿',  label: 'Crypto' },
  { key: 'music',  icon: '🎵', label: 'Music' },
  { key: 'art',    icon: '🎨', label: 'Art' },
];

// Maps each category to a related one for the 🍄 Double feed feature
const RELATED_CATEGORY = {
  ai:     'ml',
  ml:     'ai',
  tools:  'web',
  os:     'tools',
  games:  'mobile',
  web:    'tools',
  mobile: 'games',
  crypto: 'web',
  music:  'art',
  art:    'music',
};

/* ============================================================
   Emoji action bar definition
   ============================================================ */
const EMOJI_ACTIONS = [
  { icon: '🟥', label: 'Menu',     action: 'toggleSidebar' },
  { icon: '🟦', label: 'Import',   action: 'import' },
  { icon: '🟨', label: 'Extract',  action: 'extract' },
  { icon: '🎷', label: 'Media',    action: 'media' },
  { icon: '🎵', label: 'Music',    action: 'music' },
  { icon: '😎', label: 'Viz',      action: 'visualizer' },
  { icon: '⭐', label: 'Update',   action: 'update' },
  { icon: '🟡', label: 'Token',    action: 'token' },
  { icon: '🧱', label: 'Encode',   action: 'encode' },
  { icon: '🍄', label: 'Double',   action: 'double' },
  { icon: '🎨', label: 'Art',      action: 'art' },
  { icon: '🔥', label: 'Edit',     action: 'edit' },
];

/* ============================================================
   State
   ============================================================ */
let currentCat = 'ai';
let allItems   = [];
let doubling   = false;

/* ============================================================
   DOM refs (populated after DOMContentLoaded)
   ============================================================ */
let feedEl, catTabsEl, sidebarEl, sidebarOverlay, emojiBar;
let searchBar, searchInput, hamburgerBtn;

/* ============================================================
   Boot
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  feedEl         = document.getElementById('feed');
  catTabsEl      = document.getElementById('cat-tabs');
  sidebarEl      = document.getElementById('sidebar');
  sidebarOverlay = document.getElementById('sidebar-overlay');
  emojiBar       = document.getElementById('emoji-bar');
  searchBar      = document.getElementById('search-bar');
  searchInput    = document.getElementById('search-input');
  hamburgerBtn   = document.getElementById('hamburger-btn');

  buildCategoryTabs();
  buildEmojiBar();
  bindGlobalHandlers();
  checkUrlParams();
  loadFeed(currentCat);
  registerSW();
  exposeGlobals();
});

/* ============================================================
   Category Tabs
   ============================================================ */
function buildCategoryTabs() {
  if (!catTabsEl) return;
  catTabsEl.innerHTML = CATEGORIES.map((c) =>
    `<button class="cat-tab${c.key === currentCat ? ' active' : ''}" data-cat="${c.key}">
       <span class="cat-icon">${c.icon}</span>${c.label}
     </button>`
  ).join('');

  catTabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    const cat = tab.dataset.cat;
    if (cat === currentCat) return;
    currentCat = cat;
    document.querySelectorAll('.cat-tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === cat));
    loadFeed(cat);
  });
}

/* ============================================================
   Emoji Action Bar
   ============================================================ */
function buildEmojiBar() {
  if (!emojiBar) return;
  emojiBar.innerHTML = EMOJI_ACTIONS.map((a) =>
    `<button class="emoji-btn" data-action="${a.action}" title="${a.label}">
       <span class="eb-icon">${a.icon}</span>
       <span class="eb-label">${a.label}</span>
     </button>`
  ).join('');

  emojiBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-btn');
    if (!btn) return;
    handleEmojiAction(btn.dataset.action);
  });
}

function handleEmojiAction(action) {
  switch (action) {
    case 'toggleSidebar': toggleSidebar(); break;
    case 'import':        openImportModal(); break;
    case 'extract':       openExtractModal(); break;
    case 'media':         openMediaModal(); break;
    case 'music':         openMusicModal(); break;
    case 'visualizer':    openVisualizerModal(); break;
    case 'update':        openUpdateModal(); break;
    case 'token':         openTokenModal(); break;
    case 'encode':        openEncodeModal(); break;
    case 'double':        openDoubleModal(); break;
    case 'art':           openArtModal(); break;
    case 'edit':          openEditModal(); break;
  }
}

/* ============================================================
   Sidebar
   ============================================================ */
function toggleSidebar(forceOpen) {
  const open = forceOpen !== undefined ? forceOpen : !sidebarEl.classList.contains('open');
  sidebarEl.classList.toggle('open', open);
  sidebarOverlay.classList.toggle('visible', open);
  hamburgerBtn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ============================================================
   Search
   ============================================================ */
function toggleSearch() {
  const visible = searchBar.classList.toggle('visible');
  if (visible) searchInput?.focus();
}

/* ============================================================
   Feed Loading
   ============================================================ */
async function loadFeed(cat) {
  doubling = false;
  renderLoading();

  try {
    const items = await loadCategory(cat);
    allItems = items;
    renderFeed(items);
  } catch (err) {
    renderError(cat, err);
  }
}

function renderLoading() {
  if (!feedEl) return;
  feedEl.innerHTML = `
    <div class="state-box">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <div class="state-title">Loading feed…</div>
      <div class="state-msg">Fetching latest GitHub topics</div>
    </div>`;
}

function renderError(cat, err) {
  if (!feedEl) return;
  console.warn('Feed error:', err);
  feedEl.innerHTML = `
    <div class="state-box">
      <div class="state-icon">📡</div>
      <div class="state-title">Could not load feed</div>
      <div class="state-msg">Check your connection or try another category. (${err.message})</div>
      <button class="btn btn-primary" onclick="window.gitStreamRefresh()">🔄 Retry</button>
    </div>`;
}

function renderFeed(items) {
  if (!feedEl) return;

  if (!items.length) {
    feedEl.innerHTML = `
      <div class="state-box">
        <div class="state-icon">🔍</div>
        <div class="state-title">No items found</div>
        <div class="state-msg">Try a different category or refresh.</div>
      </div>`;
    return;
  }

  const catDef = CATEGORIES.find((c) => c.key === currentCat) || CATEGORIES[0];

  feedEl.innerHTML = `<div class="feed-grid">
    ${items.map((item) => buildCard(item, catDef)).join('')}
  </div>`;
}

function buildCard(item, catDef) {
  const date = item.date ? relativeTime(item.date) : '';
  const safeTitle = escHtml(item.title);
  const safeDesc  = escHtml(item.desc || '');
  const lang      = item.lang ? `<span class="card-tag">⚡ ${escHtml(item.lang)}</span>` : '';
  const stars     = item.stars ? `<span class="card-star">⭐ ${escHtml(item.stars)}</span>` : '';

  return `
    <article class="feed-card">
      <div class="card-meta">
        <span class="card-category">${catDef.icon} ${catDef.label}</span>
        ${date ? `<span class="card-date">${date}</span>` : ''}
      </div>
      <h2 class="card-title"><a href="${escHtml(item.link)}" target="_blank" rel="noopener">${safeTitle}</a></h2>
      ${safeDesc ? `<p class="card-desc">${safeDesc}</p>` : ''}
      <div class="card-footer">
        ${lang}${stars}
        <a class="card-link" href="${escHtml(item.link)}" target="_blank" rel="noopener">View →</a>
      </div>
    </article>`;
}

/* ============================================================
   Search / Filter
   ============================================================ */
function filterFeed(query) {
  if (!query.trim()) {
    renderFeed(allItems);
    return;
  }
  const q = query.toLowerCase();
  const filtered = allItems.filter(
    (item) => item.title.toLowerCase().includes(q) || (item.desc || '').toLowerCase().includes(q)
  );
  renderFeed(filtered);
}

/* ============================================================
   Modal system (exported for features.js)
   ============================================================ */
export function openModal(title, bodyHtml, onReady) {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-title">${escHtml(title)}</span>
        <button class="modal-close" onclick="window.gitStreamCloseModal()" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;

  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  }, { once: true });

  if (typeof onReady === 'function') {
    requestAnimationFrame(onReady);
  }
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }
}

export function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ============================================================
   Global bindings
   ============================================================ */
function bindGlobalHandlers() {
  // Hamburger
  document.getElementById('hamburger-btn')?.addEventListener('click', () => toggleSidebar());

  // Overlay
  sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

  // Search button
  document.getElementById('search-btn')?.addEventListener('click', toggleSearch);

  // Search input
  searchInput?.addEventListener('input', (e) => filterFeed(e.target.value));
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchBar.classList.remove('visible');
    }
  });

  // Refresh button
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('refresh-btn');
    btn?.classList.add('spinning');
    loadFeed(currentCat).finally(() => btn?.classList.remove('spinning'));
  });

  // Keyboard shortcut Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      toggleSidebar(false);
      if (searchBar) searchBar.classList.remove('visible');
    }
  });

  // Custom events
  window.addEventListener('gitstream:refresh', () => loadFeed(currentCat));
  window.addEventListener('gitstream:double', () => {
    if (doubling) return;
    doubling = true;
    const relatedCat = RELATED_CATEGORY[currentCat]
      || CATEGORIES.find((c) => c.key !== currentCat)?.key
      || 'tools';
    loadCategory(relatedCat)
      .then((extra) => {
        allItems = [...allItems, ...extra];
        renderFeed(allItems);
        showToast(`🍄 Feed doubled! ${allItems.length} items total.`);
      })
      .catch(() => showToast('Could not double feed', 'error'));
  });

  // Service worker sync message
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.type === 'SYNC_COMPLETE') {
      showToast('✅ Background sync complete');
    }
  });
}

/* ============================================================
   URL Params (deep-link to category)
   ============================================================ */
function checkUrlParams() {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (cat && EXPLORE_FEEDS[cat]) {
    currentCat = cat;
    document.querySelectorAll('.cat-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.cat === cat)
    );
  }
}

/* ============================================================
   Service Worker Registration
   ============================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('SW registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  }
}

/* ============================================================
   Expose globals for onclick handlers
   ============================================================ */
function exposeGlobals() {
  window.gitStreamToast      = showToast;
  window.gitStreamCloseModal = closeModal;
  window.gitStreamRefresh    = () => {
    const btn = document.getElementById('refresh-btn');
    btn?.classList.add('spinning');
    loadFeed(currentCat).finally(() => btn?.classList.remove('spinning'));
  };
}

/* ============================================================
   Utilities
   ============================================================ */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
