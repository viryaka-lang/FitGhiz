// Outils d'interface partagés : icônes, feuilles modales, toasts, actions déléguées.

import { figureSVG } from './figure.js';
import { fmt } from './logic.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Registre d'actions : <button data-act="nom" data-x="…">
export const actions = {};
let renderer = () => {};
export const setRenderer = (fn) => { renderer = fn; };
export const rerender = () => renderer();

const p = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICON = {
  home: p('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  plan: p('<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 2.5v3M16 2.5v3M4 9.5h16M8 13.5h3M8 17h6"/>'),
  dumbbell: p('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  chart: p('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  user: p('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  check: p('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  plus: p('<path d="M12 5v14M5 12h14"/>'),
  minus: p('<path d="M5 12h14"/>'),
  x: p('<path d="M6 6l12 12M18 6 6 18"/>'),
  chev: p('<path d="m9 6 6 6-6 6"/>', 'class="chev"'),
  back: p('<path d="m15 6-6 6 6 6"/>'),
  swap: p('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
  info: p('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  play: p('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  pause: p('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  timer: p('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2.5h6"/>'),
  scale: p('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 9a5.5 5.5 0 0 1 8 0l-2.5 3"/>'),
  share: p('<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>'),
  trash: p('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  spine: p('<path d="M12 2.5v19M9 5h6M8.5 9h7M8.5 13h7M9 17h6"/>'),
  flame: p('<path d="M12 22c4 0 7-2.8 7-6.8 0-4.2-3.5-6.7-4.5-10.2-2.5 1.5-3.5 4-3.5 6-1.2-.8-2-2.2-2-3.5C6.5 9.5 5 12.3 5 15.2 5 19.2 8 22 12 22z"/>'),
  book: p('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5zM4 20.5A1.5 1.5 0 0 0 5.5 22H20M8 7h8"/>'),
  bolt: p('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  heart: p('<path d="M12 20s-7.5-4.5-9-9.5C2 6.5 5 4 8 4c2 0 3.2 1.2 4 2.5C12.8 5.2 14 4 16 4c3 0 6 2.5 5 6.5-1.5 5-9 9.5-9 9.5z"/>'),
  download: p('<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/>'),
  upload: p('<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M4 20h16"/>'),
  search: p('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  alert: p('<path d="M12 3 2 20h20zM12 10v4.5M12 17.5v.5"/>'),
  ok: p('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>'),
  sound: p('<path d="M4 9.5v5h4l5 4v-13l-5 4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
};

export const thumb = (ex, cls = 'thumb') => `<div class="${cls}">${figureSVG(ex)}</div>`;

const UNIT = { wr: 'rép.', reps: 'rép.', time: 's', wtime: 's', cardio: 'min' };
export const fmtRest = (s) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60}` : `${s / 60} min`);
export function presc(ex, t, { rest = true, sets = t.sets } = {}) {
  const [a, b] = t.reps;
  const range = a === b ? a : `${a}–${b}`;
  return `${sets} × ${range} ${UNIT[ex.track]}${ex.perSide ? '/côté' : ''}` + (rest && t.rest ? ` · repos ${fmtRest(t.rest)}` : '');
}
export const unitOf = (ex) => UNIT[ex.track];

export function estMinutes(items) {
  let s = 0;
  for (const it of items) {
    const [a, b] = it.reps;
    if (it.tag === 'cardio') { s += ((a + b) / 2) * 60; continue; }
    s += it.sets * (40 + (it.rest || 60));
  }
  return Math.round(s / 60 / 5) * 5;
}

// ── Feuille modale ──
let sheetStack = [];
export function openSheet(html, { onMount, onClose, cls = '' } = {}) {
  const el = document.createElement('div');
  el.className = 'sheet-backdrop';
  el.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  el.addEventListener('click', (e) => { if (e.target === el) closeSheet(); });
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  sheetStack.push({ el, onClose });
  onMount?.(el.querySelector('.sheet'));
  return el;
}
export function closeSheet() {
  const top = sheetStack.pop();
  if (!top) return;
  top.el.remove();
  top.onClose?.();
  if (!sheetStack.length) document.body.style.overflow = '';
}
export const sheetOpen = () => sheetStack.length > 0;
actions['close-sheet'] = () => closeSheet();

export function confirmSheet({ title, text, ok = 'Confirmer', cancel = 'Annuler', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    openSheet(
      `<h3 class="h3" style="margin:6px 0 6px">${esc(title)}</h3>
       ${text ? `<p class="sub">${esc(text)}</p>` : ''}
       <div class="stack" style="margin-top:18px">
         <button class="btn block ${danger ? 'danger secondary' : ''}" data-ok>${esc(ok)}</button>
         <button class="btn block secondary" data-cancel>${esc(cancel)}</button>
       </div>`,
      {
        onMount: (s) => {
          s.querySelector('[data-ok]').onclick = () => { done = true; closeSheet(); resolve(true); };
          s.querySelector('[data-cancel]').onclick = () => { done = true; closeSheet(); resolve(false); };
        },
        onClose: () => { if (!done) resolve(false); },
      },
    );
  });
}

// Navigue puis exécute `then` une fois le nouvel écran rendu.
export function navigate(hash, then) {
  if (location.hash === hash) { rerender(); then?.(); return; }
  if (then) window.addEventListener('hashchange', () => setTimeout(then, 0), { once: true });
  location.hash = hash;
}

// ── Toast ──
let toastTimer;
export function toast(msg, { action, onAction, ms = 2600 } = {}) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { el.remove(); onAction?.(); };
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), action ? Math.max(ms, 8000) : ms);
}

// ── Son & vibration ──
let audio;
export function unlockAudio() {
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch {}
}
export function beep(times = 2) {
  try {
    navigator.vibrate?.([180, 80, 180]);
    if (!audio) return;
    for (let i = 0; i < times; i++) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = i === times - 1 ? 1175 : 880;
      const t = audio.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 0.2);
    }
  } catch {}
}

export const kg = (n) => `${fmt(n)} kg`;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
