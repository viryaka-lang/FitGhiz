// Persistance locale (localStorage) — toutes les données restent sur l'appareil.

const KEY = 'fitghiz:v1';

const DEFAULT = {
  profile: null, // { name, sex, age, height, goalWeight, activity, rate, days }
  planStart: null, // 'YYYY-MM-DD'
  weights: [], // { date, kg }
  waist: [], // { date, cm }
  sessions: [], // séances terminées
  active: null, // séance en cours
  subs: {}, // remplacements d'exercices { exIdOrigine: exIdRemplacant }
  prefs: { sound: true },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Lecture des données impossible', e);
  }
  return structuredClone(DEFAULT);
}

export function getState() {
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Sauvegarde impossible', e);
  }
}

export function update(fn, { silent = false } = {}) {
  fn(state);
  save();
  if (!silent) listeners.forEach((l) => l(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function exportJSON() {
  return JSON.stringify({ app: 'FitGhiz', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  const data = parsed.data || parsed;
  if (!data || !Array.isArray(data.sessions)) throw new Error('Fichier invalide');
  state = { ...structuredClone(DEFAULT), ...data };
  save();
  listeners.forEach((l) => l(state));
}

export function resetAll() {
  state = structuredClone(DEFAULT);
  save();
  listeners.forEach((l) => l(state));
}

// Demande au navigateur de ne pas effacer les données (Safari/Chrome).
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {}
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ── Dates (jour local au format AAAA-MM-JJ) ──
export function today() {
  return isoDay(new Date());
}
export function isoDay(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function parseDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400000);
}
