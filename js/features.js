/**
 * Git-Stream Features Module
 * Handles all emoji-button popups and their functionality.
 */

import { showToast, openModal, closeModal } from './app.js';

/* ============================================================
   🟥  Hamburger / Categories — handled in app.js sidebar
   ============================================================ */

/* ============================================================
   🟦  Import Text Content
   ============================================================ */
export function openImportModal() {
  const body = `
    <div class="import-area" id="import-drop" onclick="document.getElementById('import-file').click()">
      <div class="ia-icon">🟦</div>
      <div class="ia-text">Tap to paste a URL or drop a text file</div>
    </div>
    <input type="file" id="import-file" accept=".txt,.md,.html" style="display:none">
    <label style="display:block;font-size:.8rem;color:var(--text-secondary);margin-bottom:6px">Or paste a URL / text:</label>
    <textarea id="import-text" rows="4" placeholder="https://... or paste raw text here"></textarea>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-primary btn-full" id="import-go-btn">🟦 Import Content</button>
    </div>
    <div id="import-result" style="margin-top:14px"></div>`;

  openModal('🟦 Import Text Content', body, () => {
    document.getElementById('import-go-btn')?.addEventListener('click', runImport);
    document.getElementById('import-file')?.addEventListener('change', handleFileImport);
  });
}

function runImport() {
  const raw = document.getElementById('import-text')?.value.trim();
  if (!raw) { showToast('Paste a URL or text first', 'error'); return; }

  const result = document.getElementById('import-result');
  result.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  if (raw.startsWith('http')) {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(raw)}`;
    fetch(proxy, { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(d => {
        const text = stripHtml(d.contents || '').slice(0, 2000);
        result.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.82rem;white-space:pre-wrap;max-height:200px;overflow-y:auto">${escHtml(text)}</div>
          <button class="btn btn-secondary btn-full" style="margin-top:8px" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent).then(()=>window.gitStreamToast('Copied!'))">📋 Copy to Clipboard</button>`;
      })
      .catch(() => { result.innerHTML = '<p style="color:var(--accent-red)">Could not fetch URL.</p>'; });
  } else {
    const words = raw.split(/\s+/).length;
    result.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.82rem;white-space:pre-wrap;max-height:200px;overflow-y:auto">${escHtml(raw.slice(0, 2000))}</div>
      <p style="font-size:.75rem;color:var(--text-secondary);margin-top:6px">${words} words imported.</p>`;
  }
}

function handleFileImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const ta = document.getElementById('import-text');
    if (ta) ta.value = ev.target.result.slice(0, 10000);
  };
  reader.readAsText(file);
}

/* ============================================================
   🟨  Extract Data / Styles
   ============================================================ */
export function openExtractModal() {
  const items = [
    { icon: '🎨', label: 'Styles / CSS' },
    { icon: '📝', label: 'Text Content' },
    { icon: '🖼️', label: 'Images' },
    { icon: '🔗', label: 'Links' },
    { icon: '📊', label: 'Tables / Data' },
    { icon: '🃏', label: 'Cards / UI' },
  ];

  const grid = items.map(i => `
    <div class="option-card" data-label="${i.label}" onclick="this.classList.toggle('selected')">
      <div class="oc-icon">${i.icon}</div>
      <div class="oc-label">${i.label}</div>
    </div>`).join('');

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Select what to extract from the current page:</p>
    <div class="option-grid">${grid}</div>
    <input id="extract-url" type="url" placeholder="https://github.com/..." style="margin-bottom:10px">
    <button class="btn btn-primary btn-full" id="extract-go-btn">🟨 Extract Selected</button>
    <div id="extract-result" style="margin-top:12px"></div>`;

  openModal('🟨 Extract Data & Styles', body, () => {
    document.getElementById('extract-go-btn')?.addEventListener('click', runExtract);
  });
}

function runExtract() {
  const selected = [...document.querySelectorAll('.option-card.selected')].map(el => el.dataset.label);
  if (!selected.length) { showToast('Select at least one item', 'error'); return; }

  const result = document.getElementById('extract-result');
  result.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:14px">
    <p style="font-weight:600;margin-bottom:8px">✅ Extraction summary:</p>
    ${selected.map(s => `<p style="font-size:.85rem;color:var(--text-secondary)">• ${s} — ready to copy</p>`).join('')}
    <p style="font-size:.75rem;color:var(--text-secondary);margin-top:8px">Extracted data would be saved to clipboard for use in other repos.</p>
  </div>`;
  showToast(`Extracted: ${selected.join(', ')}`);
}

/* ============================================================
   🎷  Media / RSS Feed Chooser
   ============================================================ */
export function openMediaModal() {
  const types = [
    { icon: '📻', label: 'Radio' },
    { icon: '🎬', label: 'Video' },
    { icon: '🎮', label: 'Games' },
    { icon: '🖼️', label: 'Gallery' },
    { icon: '📰', label: 'News' },
    { icon: '🎵', label: 'Music' },
  ];

  const grid = types.map(t => `
    <div class="option-card" data-type="${t.label}" onclick="window.gitStreamSelectMedia('${t.label}',this)">
      <div class="oc-icon">${t.icon}</div>
      <div class="oc-label">${t.label}</div>
    </div>`).join('');

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">What kind of media would you like to add?</p>
    <div class="option-grid">${grid}</div>
    <div id="media-sub" style="display:none">
      <hr style="border-color:var(--border);margin:12px 0">
      <p style="font-size:.85rem;font-weight:600;margin-bottom:8px" id="media-sub-title"></p>
      <div class="option-grid" id="media-sub-grid"></div>
      <button class="btn btn-primary btn-full" id="media-add-btn" style="margin-top:6px">➕ Add to Page</button>
    </div>`;

  openModal('🎷 Add Media Feed', body, () => {
    window.gitStreamSelectMedia = selectMediaType;
  });
}

const MEDIA_OPTIONS = {
  Radio:   ['🌍 World Radio', '🎸 Rock', '🎹 Jazz', '🎤 Pop', '🎧 Chill', '📡 Custom URL'],
  Video:   ['▶️ YouTube', '📺 Twitch', '🎦 Vimeo', '🆓 Free Movies', '📡 Custom URL'],
  Games:   ['🕹️ NES / Retro', '💻 PC Games', '📱 Mobile', '🃏 Board Games', '📡 Custom URL'],
  Gallery: ['🌄 Nature', '🏙️ Urban', '🎨 Art', '🚀 Space', '📡 Custom URL'],
  News:    ['🌐 World News', '🔬 Science', '💻 Tech', '🎮 Gaming News', '📡 Custom URL'],
  Music:   ['🎷 Jazz', '🎸 Rock', '🎹 Classical', '🎤 Hits', '📡 Custom URL'],
};

function selectMediaType(type, el) {
  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  const sub = document.getElementById('media-sub');
  const subGrid = document.getElementById('media-sub-grid');
  const subTitle = document.getElementById('media-sub-title');
  if (!sub || !subGrid || !subTitle) return;

  sub.style.display = 'block';
  subTitle.textContent = `${type} — choose a channel:`;

  subGrid.innerHTML = (MEDIA_OPTIONS[type] || []).map(o => `
    <div class="option-card" onclick="this.closest('.option-grid').querySelectorAll('.option-card').forEach(c=>c.classList.remove('selected'));this.classList.add('selected')">
      <div class="oc-label" style="font-size:.85rem">${o}</div>
    </div>`).join('');

  document.getElementById('media-add-btn')?.addEventListener('click', () => {
    const chosen = subGrid.querySelector('.option-card.selected')?.querySelector('.oc-label')?.textContent;
    if (!chosen) { showToast('Choose a channel first', 'error'); return; }
    showToast(`🎷 ${type}: ${chosen} added to your feed!`);
    closeModal();
  });
}

/* ============================================================
   🎵  Music Creation Zone
   ============================================================ */
export function openMusicModal() {
  const SEMITONE_RATIO = Math.pow(2, 1 / 12);
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C2'];
  const freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const sharps = [null, 'C#', 'D#', null, 'F#', 'G#', 'A#', null];

  let keys = '';
  notes.forEach((n, i) => {
    keys += `<div class="piano-key" data-freq="${freqs[i]}" data-note="${n}">${n}</div>`;
    if (sharps[i]) {
      keys += `<div class="piano-key sharp" data-freq="${freqs[i] * SEMITONE_RATIO}" data-note="${sharps[i]}">${sharps[i]}</div>`;
    }
  });

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Play notes to create your music token. Each sequence is unique.</p>
    <div class="piano" id="piano-keys">${keys}</div>
    <div id="note-sequence" style="min-height:30px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-family:monospace;font-size:.85rem;margin:10px 0;color:var(--accent-blue)">Play notes...</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-secondary" id="clear-notes-btn">🗑️ Clear</button>
      <button class="btn btn-primary" id="mint-music-btn">🎵 Mint Music Token</button>
    </div>
    <div id="music-token-result" style="margin-top:12px"></div>`;

  openModal('🎵 Music Creation Zone', body, initPiano);
}

let audioCtx = null;
const playedNotes = [];

function initPiano() {
  const piano = document.getElementById('piano-keys');
  const seqEl = document.getElementById('note-sequence');

  piano?.querySelectorAll('.piano-key').forEach((key) => {
    const freq = parseFloat(key.dataset.freq);
    const note = key.dataset.note;

    const play = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);

      key.classList.add('pressed');
      setTimeout(() => key.classList.remove('pressed'), 200);

      playedNotes.push(note);
      if (seqEl) seqEl.textContent = playedNotes.join(' → ') || 'Play notes...';
    };

    key.addEventListener('mousedown', play);
    key.addEventListener('touchstart', (e) => { e.preventDefault(); play(); }, { passive: false });
  });

  document.getElementById('clear-notes-btn')?.addEventListener('click', () => {
    playedNotes.length = 0;
    if (seqEl) seqEl.textContent = 'Play notes...';
  });

  document.getElementById('mint-music-btn')?.addEventListener('click', () => {
    if (!playedNotes.length) { showToast('Play some notes first!', 'error'); return; }
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
    const tokenId = (btoa(playedNotes.join('-')) + rand).slice(0, 16);
    document.getElementById('music-token-result').innerHTML = `
      <div class="token-card">
        <div class="token-icon">🎵</div>
        <div class="token-name">Music Token</div>
        <div class="token-id">ID: ${tokenId}</div>
        <div class="token-value">♩ ${playedNotes.join(' ')} ♩</div>
      </div>`;
    showToast('🎵 Music Token minted!', 'success');
  });
}

/* ============================================================
   😎  Visualizer
   ============================================================ */
export function openVisualizerModal() {
  const types = ['Bars', 'Wave', 'Circle', 'Stars', 'Matrix'];
  const btns = types.map(t =>
    `<button class="btn btn-secondary" onclick="window.gitStreamVisualizer('${t}',this)" style="flex:1;min-width:80px">${t}</button>`
  ).join('');

  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Choose a visualizer style:</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">${btns}</div>
    <canvas id="visualizer-canvas" height="180"></canvas>
    <p id="viz-label" style="text-align:center;font-size:.75rem;color:var(--text-secondary);margin-top:6px">Select a visualizer above</p>`;

  openModal('😎 Visualizer', body, () => {
    window.gitStreamVisualizer = startVisualizer;
    // Auto-start bars
    setTimeout(() => startVisualizer('Bars', null), 300);
  });
}

let vizAnimId = null;

function startVisualizer(type, btn) {
  if (vizAnimId) cancelAnimationFrame(vizAnimId);
  document.querySelectorAll('#viz-label')?.forEach(el => el.textContent = `${type} Visualizer — Live`);

  const canvas = document.getElementById('visualizer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;

  const W = canvas.width, H = canvas.height;
  let t = 0;

  function draw() {
    t += 0.04;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (type === 'Bars') {
      const bars = 32;
      const bw = W / bars - 2;
      for (let i = 0; i < bars; i++) {
        const h = (Math.sin(t + i * 0.3) * 0.5 + 0.5) * H * 0.8 + 8;
        const hue = (i / bars) * 240 + t * 20;
        ctx.fillStyle = `hsl(${hue},80%,55%)`;
        ctx.fillRect(i * (bw + 2), H - h, bw, h);
      }
    } else if (type === 'Wave') {
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin((x / W) * Math.PI * 4 + t * 3) * (H * 0.3) * Math.sin(t * 0.5);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (type === 'Circle') {
      ctx.strokeStyle = '#bc8cff';
      ctx.lineWidth = 2;
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.3;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const dr = Math.sin(a * 8 + t * 4) * 12;
        const x = cx + (r + dr) * Math.cos(a);
        const y = cy + (r + dr) * Math.sin(a);
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (type === 'Stars') {
      for (let i = 0; i < 60; i++) {
        const x = (Math.sin(i * 2.4 + t * 0.3) * 0.5 + 0.5) * W;
        const y = (Math.cos(i * 1.7 + t * 0.2) * 0.5 + 0.5) * H;
        const size = (Math.sin(i + t * 2) * 0.5 + 0.5) * 3 + 1;
        ctx.fillStyle = `hsla(${i * 6},80%,70%,${Math.sin(t + i) * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'Matrix') {
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3fb950';
      ctx.font = '12px monospace';
      const cols = Math.floor(W / 12);
      for (let i = 0; i < cols; i++) {
        const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
        const y = ((t * 3 * 20 + i * 37) % (H + 40));
        ctx.fillText(char, i * 12, y);
      }
    }

    vizAnimId = requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   ⭐  Update / Refresh Content
   ============================================================ */
export function openUpdateModal() {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:14px">Keep your feeds fresh and up to date:</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-primary btn-full" onclick="window.dispatchEvent(new CustomEvent('gitstream:refresh'));window.gitStreamToast('⭐ Feeds refreshing…');window.gitStreamCloseModal()">⭐ Refresh All Feeds</button>
      <button class="btn btn-secondary btn-full" onclick="window.gitStreamToast('🔬 Checking for trending topics…')">🔬 Scan Trending Topics</button>
      <button class="btn btn-secondary btn-full" onclick="window.gitStreamToast('📊 Comparing repo research…')">📊 Compare Repo Research</button>
    </div>`;
  openModal('⭐ Update Content', body);
}

/* ============================================================
   🟡  Token Minter
   ============================================================ */
export function openTokenModal() {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Create and manage your content tokens:</p>
    <div class="option-grid" style="margin-bottom:14px">
      <div class="option-card" onclick="window.gitStreamMintToken('standard')"><div class="oc-icon">🟡</div><div class="oc-label">Mint Token</div></div>
      <div class="option-card" onclick="window.gitStreamMintToken('platinum')"><div class="oc-icon">⚪</div><div class="oc-label">Platinum</div></div>
      <div class="option-card" onclick="window.gitStreamMintToken('research')"><div class="oc-icon">📄</div><div class="oc-label">Research</div></div>
      <div class="option-card" onclick="window.gitStreamMintToken('music')"><div class="oc-icon">🎵</div><div class="oc-label">Music</div></div>
    </div>
    <input id="token-name-input" placeholder="Token name (optional)" style="margin-bottom:10px">
    <div id="token-mint-result"></div>`;

  openModal('🟡 Token Minter', body, () => {
    window.gitStreamMintToken = mintToken;
  });
}

function mintToken(type) {
  const name = document.getElementById('token-name-input')?.value || `Token-${Math.floor(Math.random() * 9999)}`;
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
  const id = (btoa(name + type) + rand).slice(0, 20);
  const icons = { standard: '🟡', platinum: '⚪', research: '📄', music: '🎵' };
  const values = { standard: '$1.00', platinum: '$100.00', research: '$0.25', music: '$5.00' };

  document.getElementById('token-mint-result').innerHTML = `
    <div class="token-card">
      <div class="token-icon">${icons[type] || '🟡'}</div>
      <div class="token-name">${name}</div>
      <div class="token-id">ID: ${id}</div>
      <div class="token-value">${values[type] || '$1.00'}</div>
    </div>`;
  showToast(`${icons[type]} Token minted: ${name}`, 'success');
}

/* ============================================================
   🧱  Encode / Time Capsule
   ============================================================ */
export function openEncodeModal() {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Encode a secret message and set a time capsule unlock date:</p>
    <textarea id="encode-input" rows="3" placeholder="Enter your secret message…" style="margin-bottom:10px"></textarea>
    <label style="font-size:.8rem;color:var(--text-secondary);display:block;margin-bottom:4px">Unlock Date:</label>
    <input type="date" id="encode-date" style="margin-bottom:12px">
    <button class="btn btn-primary btn-full" id="encode-go-btn">🧱 Encode & Lock</button>
    <div id="encode-result" style="margin-top:12px"></div>`;

  openModal('🧱 Encode / Time Capsule', body, () => {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('encode-date');
    if (dateInput) { dateInput.min = today; dateInput.value = today; }

    document.getElementById('encode-go-btn')?.addEventListener('click', () => {
      const msg = document.getElementById('encode-input')?.value.trim();
      const unlockDate = document.getElementById('encode-date')?.value;
      if (!msg) { showToast('Enter a message first', 'error'); return; }

      const encoded = btoa(encodeURIComponent(msg));
      const hash = simpleHash(msg);
      document.getElementById('encode-result').innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--accent-yellow);border-radius:8px;padding:12px">
          <p style="font-size:.75rem;color:var(--text-secondary);margin-bottom:4px">🧱 Encoded (Base64):</p>
          <p style="font-family:monospace;font-size:.75rem;word-break:break-all;color:var(--accent-yellow)">${encoded.slice(0, 60)}…</p>
          <p style="font-size:.75rem;color:var(--text-secondary);margin-top:8px">Hash: <code>${hash}</code></p>
          <p style="font-size:.75rem;color:var(--text-secondary)">Unlock: ${unlockDate || 'now'}</p>
        </div>`;
      showToast('🧱 Message encoded!', 'success');
    });
  });
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/* ============================================================
   🍄  Double Content
   ============================================================ */
export function openDoubleModal() {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:14px">Double the content in your current feed by fetching related topics:</p>
    <div id="double-progress" style="display:none">
      <div class="progress-bar"><div class="progress-fill" id="double-prog-fill" style="width:0%"></div></div>
      <p id="double-prog-msg" style="font-size:.8rem;color:var(--text-secondary);margin-top:6px">Fetching additional content…</p>
    </div>
    <button class="btn btn-primary btn-full" id="double-go-btn">🍄 Double My Feed</button>`;

  openModal('🍄 Double Content', body, () => {
    document.getElementById('double-go-btn')?.addEventListener('click', () => {
      const prog = document.getElementById('double-progress');
      const fill = document.getElementById('double-prog-fill');
      const msg = document.getElementById('double-prog-msg');
      if (!prog || !fill || !msg) return;

      prog.style.display = 'block';
      document.getElementById('double-go-btn').disabled = true;

      let pct = 0;
      const interval = setInterval(() => {
        pct += Math.random() * 15 + 5;
        if (pct >= 100) {
          pct = 100;
          clearInterval(interval);
          msg.textContent = '✅ Content doubled! Your feed now has 2x more items.';
          showToast('🍄 Feed doubled!', 'success');
          window.dispatchEvent(new CustomEvent('gitstream:double'));
        }
        fill.style.width = `${Math.min(pct, 100)}%`;
      }, 200);
    });
  });
}

/* ============================================================
   🎨  Art Studio
   ============================================================ */
export function openArtModal() {
  const colors = ['#e6edf3', '#58a6ff', '#3fb950', '#f85149', '#e3b341', '#bc8cff', '#f0883e', '#000000'];

  const swatches = colors.map(c =>
    `<div class="color-swatch" style="background:${c}" data-color="${c}" onclick="window.gitStreamSetColor('${c}',this)"></div>`
  ).join('');

  const body = `
    <div class="art-tools">
      ${swatches}
      <label style="font-size:.75rem;color:var(--text-secondary)">Size:</label>
      <input type="range" id="brush-size" min="2" max="24" value="6" style="width:80px">
      <button class="btn btn-secondary" style="padding:6px 10px" id="clear-canvas-btn">🗑️ Clear</button>
    </div>
    <canvas id="art-canvas" height="240"></canvas>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-primary" id="save-art-btn" style="flex:1">💾 Save as Token</button>
      <button class="btn btn-secondary" id="download-art-btn" style="flex:1">⬇️ Download</button>
    </div>`;

  openModal('🎨 Art Studio', body, initArtStudio);
}

function initArtStudio() {
  const canvas = document.getElementById('art-canvas');
  if (!canvas) return;
  canvas.width = canvas.offsetWidth;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let drawing = false;
  let color = '#e6edf3';
  let size = 6;

  window.gitStreamSetColor = (c, el) => {
    color = c;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el?.classList.add('active');
  };

  // Set first swatch active
  document.querySelector('.color-swatch')?.classList.add('active');

  document.getElementById('brush-size')?.addEventListener('input', (e) => {
    size = parseInt(e.target.value);
  });

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  canvas.addEventListener('mousedown', (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener('mousemove', (e) => { if (!drawing) return; const p = getPos(e); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener('mouseup', () => { drawing = false; });
  canvas.addEventListener('mouseleave', () => { drawing = false; });

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
  canvas.addEventListener('touchend', () => { drawing = false; });

  document.getElementById('clear-canvas-btn')?.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('save-art-btn')?.addEventListener('click', () => {
    const tokenId = 'ART-' + Date.now().toString(36).toUpperCase();
    showToast(`🎨 Art Token minted: ${tokenId}`, 'success');
  });

  document.getElementById('download-art-btn')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `gitstream-art-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showToast('🎨 Drawing downloaded!');
  });
}

/* ============================================================
   🔥  Edit / Remove / Change
   ============================================================ */
export function openEditModal() {
  const body = `
    <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:12px">Manage items in your current feed:</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-secondary btn-full" onclick="window.gitStreamToast('✏️ Edit mode activated — tap any card to edit')">✏️ Edit Mode</button>
      <button class="btn btn-secondary btn-full" onclick="window.gitStreamToast('📌 Pin mode — tap cards to pin them to top')">📌 Pin Items</button>
      <button class="btn btn-danger btn-full" onclick="window.gitStreamToast('🗑️ Clear current feed?')">🗑️ Clear Feed</button>
      <button class="btn btn-secondary btn-full" onclick="window.dispatchEvent(new CustomEvent('gitstream:refresh'));window.gitStreamToast('🔄 Feed reloaded');window.gitStreamCloseModal()">🔄 Reload Feed</button>
    </div>`;
  openModal('🔥 Edit / Remove', body);
}

/* ============================================================
   Shared helpers exposed to HTML onclick attrs
   ============================================================ */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
