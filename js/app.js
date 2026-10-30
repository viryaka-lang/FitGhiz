// Point d'entrée : routeur, délégation d'événements, service worker.

import { getState, subscribe } from './store.js';
import { actions, setRenderer, ICON, toast, closeSheet, sheetOpen, unlockAudio } from './ui.js';
import { todayView, planView, methodView, exercisesView, exerciseView, progressView, profileView, onboardingView, onExSearch, onProfileInput, onImportFile } from './views.js';
import { workoutView, onSetInput, startTicker, releaseWake } from './workout.js';

const app = document.getElementById('app');

const TABS = [
  ['today', 'Aujourd’hui', ICON.home],
  ['plan', 'Programme', ICON.plan],
  ['exercises', 'Exercices', ICON.dumbbell],
  ['progress', 'Progrès', ICON.chart],
  ['profile', 'Profil', ICON.user],
];
const TAB_OF = { method: 'plan', exercise: 'exercises' };

function parseRoute() {
  const [name = 'today', arg] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: name || 'today', arg };
}

let lastRouteKey = '';
function render() {
  const st = getState();
  const r = parseRoute();
  const key = location.hash;
  let out;

  if (!st.profile) {
    out = onboardingView();
  } else if (r.name === 'workout') {
    if (!st.active) { location.replace('#/today'); return; }
    out = workoutView(st);
  } else {
    switch (r.name) {
      case 'plan': out = planView(st); break;
      case 'method': out = methodView(st); break;
      case 'exercises': out = exercisesView(st); break;
      case 'exercise': out = exerciseView(st, r.arg); break;
      case 'progress': out = progressView(st, r.arg); break;
      case 'profile': out = profileView(st); break;
      default: out = todayView(st);
    }
  }
  if (typeof out === 'string') out = { html: out };

  const showTabs = st.profile && r.name !== 'workout';
  const active = TAB_OF[r.name] || r.name;
  const tabs = showTabs
    ? `<nav class="tabbar" aria-label="Navigation principale">
        <div class="brand"><img src="icons/icon-192.png" alt="">FitGhiz</div>
        ${TABS.map(([k, label, ic]) => `<a class="tab ${active === k ? 'active' : ''}" href="#/${k}" ${active === k ? 'aria-current="page"' : ''}>${ic}<span>${label}</span></a>`).join('')}
      </nav>`
    : '';

  const y = window.scrollY;
  const focusedId = document.activeElement?.id;
  app.innerHTML = out.html + tabs;
  if (key !== lastRouteKey) window.scrollTo(0, 0);
  else {
    window.scrollTo(0, y);
    if (focusedId) document.getElementById(focusedId)?.focus();
  }
  lastRouteKey = key;
  out.mount?.();
  if (r.name !== 'workout') releaseWake();
}

setRenderer(render);
subscribe(() => { if (!sheetOpen() || !location.hash.startsWith('#/workout')) render(); });
window.addEventListener('hashchange', () => { while (sheetOpen()) closeSheet(); render(); });

// ── Délégation d'événements ──
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  unlockAudio();
  fn(el, e);
});
actions['go'] = (el) => { location.hash = el.dataset.href; };

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.in === 'set') onSetInput(el, false);
  else if (el.id === 'ex-q') onExSearch(el);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.in === 'set') onSetInput(el, true);
  else if (el.dataset.prof) onProfileInput(el);
  else if (el.id === 'import-file') onImportFile(el);
});
// « Entrée » sur le clavier numérique : passer au champ suivant
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.dataset?.in !== 'set') return;
  e.preventDefault();
  const all = [...document.querySelectorAll('[data-in="set"]')];
  const next = all[all.indexOf(e.target) + 1];
  if (next) next.focus(); else e.target.blur();
});
// Sélectionner le contenu au focus pour une saisie rapide
document.addEventListener('focusin', (e) => {
  if (e.target.matches?.('.set-in, .input[inputmode]')) setTimeout(() => e.target.select?.(), 0);
});

// ── Démarrage ──
render();
if (getState().active) startTicker();

// ── Service worker (hors ligne + mises à jour) ──
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      const prompt = (w) => toast('Nouvelle version disponible', { action: 'Mettre à jour', onAction: () => w.postMessage('skipWaiting') });
      if (reg.waiting && navigator.serviceWorker.controller) prompt(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) prompt(w); });
      });
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    } catch (e) {
      console.warn('Service worker non enregistré', e);
    }
  });
}
