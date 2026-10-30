// Écrans principaux : Aujourd'hui, Programme, Exercices, Progrès, Profil, Méthode, Bienvenue.

import { EX, EXERCISES, GROUPS } from './data/exercises.js';
import { CARDIO, CYCLE, SCIENCE, REFERENCES, TAG_LABEL, PLANS } from './data/program.js';
import { getState, update, today, isoDay, parseDay, exportJSON, importJSON, resetAll, requestPersistence } from './store.js';
import {
  fmt, fmtSigned, fmtDate, fmtDuration, parseNum, planOf, cycleInfo, nextTemplate, templateById, resolveEx, buildWorkout,
  nutrition, weightTrend, weeklyRate, latestWeight, streakWeeks, sessionsThisWeek, sessionStats, bestE1rm, ACTIVITY, RATES,
} from './logic.js';
import { esc, ICON, actions, thumb, presc, estMinutes, openSheet, closeSheet, confirmSheet, toast, rerender, isIOS, isStandalone } from './ui.js';
import { animateFigure } from './figure.js';
import { lineChart, barChart } from './charts.js';
import { exerciseDetailHTML, mountExerciseDetail, exerciseHistory, setLabel, openExerciseSheet } from './detail.js';

const head = (eyebrow, title, right = '') => `
  <header class="view-head"><div><div class="eyebrow">${eyebrow}</div><h1 class="title">${title}</h1></div>${right}</header>`;

// ───────────────────────── Aujourd'hui ─────────────────────────
export function todayView(st) {
  const p = st.profile;
  const plan = planOf(st);
  const cyc = cycleInfo(st);
  const next = nextTemplate(st);
  const w = latestWeight(st);
  const trend = weightTrend(st.weights);
  const rate = weeklyRate(trend);
  const nut = nutrition(p, trend.length ? trend[trend.length - 1].avg : w);
  const weekCount = sessionsThisWeek(st);
  const streak = streakWeeks(st);
  const todayW = st.weights.find((x) => x.date === today());
  const firstMain = next.items.find((i) => i.tag === 'main');
  const heroEx = EX[resolveEx(st, firstMain?.ex || next.items[0].ex)];
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const hello = hour < 18 ? 'Bonjour' : 'Bonsoir';
  const showInstall = isIOS() && !isStandalone() && !localStorage.getItem('fitghiz:noinstall');
  const doneToday = st.sessions.some((s) => s.date === today() && plan.sessions.some((x) => x.id === s.templateId));

  const hero = st.active
    ? `<div class="hero">
        <div class="hero-fig" data-hero="${st.active.items.find((it) => it.sets.some((s) => !s.done))?.exId || st.active.items[0].exId}"></div>
        <div class="hero-content">
          <div class="eyebrow">Séance en cours</div>
          <h2>${esc(st.active.name)}</h2>
          <p>Commencée à ${new Date(st.active.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <a class="btn" href="#/workout">${ICON.play} Reprendre</a>
        </div>
      </div>`
    : `<div class="hero">
        <div class="hero-fig" data-hero="${heroEx.id}"></div>
        <div class="hero-content">
          <div class="eyebrow">${doneToday ? 'Prochaine séance' : 'Séance du jour'}</div>
          <h2>${esc(next.name)}</h2>
          <p>${esc(next.focus)}</p>
          <div class="pills"><span class="pill">≈ ${estMinutes(next.items)} min</span><span class="pill">Sem. ${cyc.week}/6 · ${cyc.deload ? 'décharge' : 'RIR ' + cyc.rir}</span></div>
          <button class="btn" data-act="start" data-id="${next.id}">${ICON.play} Commencer</button>
        </div>
      </div>
      <div class="row" style="justify-content:center;margin-top:6px"><button class="btn ghost sm" data-act="pick-session">Choisir une autre séance</button></div>`;

  let rateTxt = '';
  if (rate != null && p) {
    const target = -(w * p.rate) / 100;
    const ok = rate <= target * 0.5 && rate >= target * 1.6;
    rateTxt = `<span class="${ok ? 'good' : 'warn'}">${fmtSigned(rate, 2)} kg/sem.</span>`;
  }

  const html = `
  <div class="view">
    ${head(esc(dateStr), `${hello}${p?.name ? ' ' + esc(p.name) : ''}`)}
    ${showInstall ? `<div class="install"><img src="icons/icon-180.png" alt=""><div class="grow small"><b>Installe FitGhiz</b><br>Touche ${ICON.share} <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b>.</div><button class="icon-btn" data-act="hide-install" aria-label="Masquer">${ICON.x}</button></div>` : ''}
    ${hero}

    <div class="grid3" style="margin-top:14px">
      <a class="stat" href="#/progress/poids" style="text-decoration:none;color:inherit">
        <div class="k">Poids (7 j)</div>
        <div class="v">${trend.length ? fmt(trend[trend.length - 1].avg) : '–'}<small>kg</small></div>
        <div class="d">${rateTxt || '&nbsp;'}</div>
      </a>
      <div class="stat"><div class="k">Cette semaine</div><div class="v">${weekCount}<small>/${p?.days || 3}</small></div><div class="d">séances</div></div>
      <div class="stat"><div class="k">Régularité</div><div class="v">${streak}<small>sem.</small></div><div class="d">d’affilée</div></div>
    </div>

    <div class="wide-grid">
    <div class="card" style="margin-top:12px">
      <div class="row between"><div class="card-title" style="margin:0">Pesée du jour</div>${todayW ? `<span class="tag accent">${ICON.check.replace('<svg', '<svg style="width:14px;height:14px;display:inline;vertical-align:-2px"')} enregistrée</span>` : ''}</div>
      <div class="row" style="margin-top:10px">
        <div class="input-unit grow"><input class="input" id="w-today" inputmode="decimal" placeholder="${w ? fmt(w) : 'Poids'}" value="${todayW ? String(todayW.kg).replace('.', ',') : ''}" aria-label="Poids du jour en kg"><em>kg</em></div>
        <button class="btn" data-act="save-weight">${todayW ? 'Modifier' : 'Enregistrer'}</button>
      </div>
      <p class="small muted" style="margin-top:8px">Le matin, à jeun, après être passé aux toilettes. C’est la moyenne sur 7 jours qui compte.</p>
    </div>

    ${nut ? `<div class="card" style="margin-top:12px">
      <div class="card-title">Objectif nutrition quotidien</div>
      <div class="row between"><div class="big-kcal">${fmt(nut.kcal, 0)}<small>kcal</small></div><div class="small muted" style="text-align:right">Dépense ≈ ${fmt(nut.tdee, 0)} kcal<br>Déficit ${fmt(nut.deficit, 0)} kcal</div></div>
      <div class="macro"><div><b>${nut.protein} g</b><small>Protéines</small></div><div><b>${nut.carbs} g</b><small>Glucides</small></div><div><b>${nut.fat} g</b><small>Lipides</small></div></div>
      <p class="small muted" style="margin-top:10px">${ICON.flame.replace('<svg', '<svg style="width:15px;height:15px;display:inline;vertical-align:-2px;color:var(--accent)"')} Vise aussi 8 000–10 000 pas par jour.</p>
    </div>` : ''}
    </div>

    <h2 class="h2">Régularité · 12 semaines</h2>
    <div class="card">${heatmap(st)}
      <div class="legend" style="margin-top:10px"><span><i style="width:10px;height:10px;border-radius:3px"></i>Musculation</span><span><i style="width:10px;height:10px;border-radius:3px;background:color-mix(in srgb,var(--accent) 45%,var(--surface-2))"></i>Cardio</span></div>
    </div>

    <h2 class="h2">Cycle en cours</h2>
    ${cycleCard(st)}
  </div>`;
  const mount = () => {
    const el = document.querySelector('[data-hero]');
    if (el) animateFigure(el, EX[el.dataset.hero]);
  };
  return { html, mount };
}

function heatmap(st) {
  const byDay = {};
  for (const s of st.sessions) byDay[s.date] = CARDIO.some((c) => c.id === s.templateId) ? byDay[s.date] || 'cardio' : 'on';
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const start = new Date(monday);
  start.setDate(start.getDate() - 7 * 11);
  const t = today();
  let html = '<div class="heat" role="img" aria-label="Séances des 12 dernières semaines">';
  for (let w = 0; w < 12; w++) {
    html += '<div class="col">';
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const k = isoDay(day);
      html += `<i class="${byDay[k] || ''} ${k === t ? 'today' : ''} ${k > t ? 'future' : ''}" title="${k}"></i>`;
    }
    html += '</div>';
  }
  return html + '</div>';
}

function cycleCard(st) {
  const cyc = cycleInfo(st);
  return `<div class="card">
    <div class="row" style="gap:6px;align-items:flex-end">
      ${CYCLE.map((c) => `<div class="grow" style="text-align:center">
        <div style="height:${c.deload ? 18 : 18 + (4 - c.rir) * 12}px;border-radius:6px;background:${c.week === cyc.week ? 'var(--accent)' : c.week < cyc.week ? 'color-mix(in srgb,var(--accent) 35%,var(--surface-2))' : 'var(--surface-2)'}"></div>
        <div class="small" style="margin-top:6px;font-weight:${c.week === cyc.week ? 750 : 500};color:${c.week === cyc.week ? 'var(--text)' : 'var(--muted)'}">S${c.week}</div>
        <div class="small muted" style="font-size:11px">${c.deload ? 'Déch.' : 'RIR ' + c.rir}</div>
      </div>`).join('')}
    </div>
    <p class="sub small" style="margin-top:12px"><b>Semaine ${cyc.week} · ${cyc.label}.</b> ${cyc.deload ? 'Moitié des séries et effort léger pour récupérer.' : `Arrête tes séries à ~${cyc.rir} répétition${cyc.rir > 1 ? 's' : ''} de l’échec.`} Cycle n° ${cyc.cycle}.</p>
  </div>`;
}

actions['hide-install'] = () => { localStorage.setItem('fitghiz:noinstall', '1'); rerender(); };

actions['save-weight'] = () => {
  const v = parseNum(document.getElementById('w-today')?.value);
  if (!v || v < 30 || v > 300) { toast('Entre un poids valide (en kg)'); return; }
  update((st) => {
    const d = today();
    const e = st.weights.find((x) => x.date === d);
    if (e) e.kg = v; else st.weights.push({ date: d, kg: v });
  });
  toast('Pesée enregistrée');
};

actions['start'] = async (el) => {
  const st = getState();
  if (st.active) {
    if (!(await confirmSheet({ title: 'Une séance est déjà en cours', text: 'La remplacer par une nouvelle séance ?', ok: 'Nouvelle séance', danger: true }))) return;
  }
  closeSheet();
  const tpl = templateById(st, el.dataset.id);
  update((s) => { s.active = buildWorkout(s, tpl); }, { silent: true });
  requestPersistence();
  location.hash = '#/workout';
  window.scrollTo(0, 0);
};

actions['pick-session'] = () => {
  const st = getState();
  const plan = planOf(st);
  const row = (s) => `<button class="list-item" data-act="start" data-id="${s.id}">${thumb(EX[resolveEx(st, (s.items.find((i) => i.tag === 'main' || i.tag === 'cardio') || s.items[0]).ex)])}<div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${esc(s.focus)} · ≈ ${estMinutes(s.items)} min</div></div>${ICON.chev}</button>`;
  openSheet(`
    <div class="sheet-head"><h3 class="h3">Choisir une séance</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
    <div class="section-label">${esc(plan.name)}</div>
    <div class="list">${plan.sessions.map(row).join('')}</div>
    <div class="section-label">Cardio (jours de repos)</div>
    <div class="list">${CARDIO.map(row).join('')}</div>`);
};

// ───────────────────────── Programme ─────────────────────────
export function planView(st) {
  const plan = planOf(st);
  const days = st.profile?.days || 3;
  const sess = (s) => `
    <div class="card" style="margin-top:12px">
      <div class="row between">
        <div><div class="h3">${esc(s.name)}</div><div class="small muted">${esc(s.focus)} · ≈ ${estMinutes(s.items)} min</div></div>
        <button class="btn sm" data-act="start" data-id="${s.id}">${ICON.play} Go</button>
      </div>
      <div class="divider"></div>
      ${s.items.map((it, idx) => {
        const id = resolveEx(st, it.ex);
        const ex = EX[id];
        const firstOfTag = idx === 0 || s.items[idx - 1].tag !== it.tag;
        return `${firstOfTag ? `<div class="section-label" style="margin-top:${idx ? 14 : 4}px">${it.tag === 'warmup' ? 'Big 3 de McGill' : TAG_LABEL[it.tag]}</div>` : ''}
        <button class="list-item" style="padding:8px 0;border:0" data-act="ex-sheet" data-id="${id}">${thumb(ex)}<div class="grow"><div class="t">${esc(ex.name)}${id !== it.ex ? ' <span class="tag" style="font-size:11px">remplacé</span>' : ''}</div><div class="s">${presc(ex, it)}</div></div>${ICON.info.replace('<svg', '<svg class="chev"')}</button>`;
      }).join('')}
    </div>`;
  const subs = Object.entries(st.subs).filter(([a, b]) => EX[a] && EX[b]);
  return `
  <div class="view">
    ${head('Ton programme', esc(plan.short), `<a class="btn secondary sm" href="#/method">${ICON.book} Méthode</a>`)}
    <div class="seg" role="tablist">
      ${[3, 4].map((d) => `<button class="${d === days ? 'on' : ''}" data-act="set-days" data-d="${d}" role="tab" aria-selected="${d === days}">${d} jours / semaine</button>`).join('')}
    </div>
    <p class="sub" style="margin-top:12px">${esc(plan.desc)}</p>
    <h2 class="h2">Cycle de 6 semaines</h2>
    ${cycleCard(st)}
    ${subs.length ? `<div class="card tight" style="margin-top:12px"><div class="card-title">Remplacements actifs</div>${subs.map(([a, b]) => `<div class="row between" style="padding:6px 0"><span class="small">${esc(EX[a].name)} → <b>${esc(EX[b].name)}</b></span><button class="btn ghost sm" data-act="unsub" data-id="${a}">Rétablir</button></div>`).join('')}</div>` : ''}
    <h2 class="h2">Séances</h2>
    <div class="wide-grid">${plan.sessions.map(sess).join('')}</div>
    <h2 class="h2">Cardio facultatif</h2>
    <p class="sub small">Les jours de repos, 1 à 3 fois par semaine. Préfère le faible impact et évite de le placer juste avant une séance de jambes.</p>
    <div class="wide-grid">${CARDIO.map(sess).join('')}</div>
    <div class="callout warn" style="margin-top:18px">${ICON.alert}<div>Ce programme ne remplace pas un avis médical. En cas de douleur lombaire aiguë, irradiant dans la jambe, ou de pathologie connue, consulte un professionnel de santé avant de commencer.</div></div>
  </div>`;
}

actions['set-days'] = (el) => {
  update((st) => { st.profile.days = +el.dataset.d; });
  toast(`Programme ${PLANS[+el.dataset.d].short} activé`);
};
actions['unsub'] = (el) => update((st) => { delete st.subs[el.dataset.id]; });
actions['ex-sheet'] = (el) => openExerciseSheet(getState(), EX[el.dataset.id]);

// ───────────────────────── Méthode ─────────────────────────
export function methodView() {
  return `
  <div class="view">
    <a class="btn ghost sm" href="#/plan" style="margin-left:-10px">${ICON.back} Programme</a>
    ${head('Fondements scientifiques', 'La méthode')}
    <p class="sub">Chaque choix du programme s’appuie sur la littérature scientifique. Voici l’essentiel, sans jargon.</p>
    ${SCIENCE.map((s) => `
      <div class="card" style="margin-top:14px">
        <h3 class="h3">${esc(s.title)}</h3>
        <ul class="bullets sub" style="margin-top:8px">${s.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <p class="small muted" style="margin-top:8px">Réf. ${s.refs.map((r) => `[${r + 1}]`).join(' ')}</p>
      </div>`).join('')}
    <h2 class="h2">Références</h2>
    <ol class="refs">${REFERENCES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
  </div>`;
}

// ───────────────────────── Exercices ─────────────────────────
let exFilter = { q: '', g: 'all' };
export function exercisesView(st) {
  const list = EXERCISES.filter((e) => (exFilter.g === 'all' || e.group === exFilter.g) &&
    (!exFilter.q || (e.name + ' ' + e.muscles + ' ' + e.equipment).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(exFilter.q)));
  return `
  <div class="view">
    ${head(`${EXERCISES.length} exercices illustrés`, 'Exercices')}
    <div class="search">${ICON.search}<input class="input" type="search" id="ex-q" placeholder="Rechercher un exercice, un muscle…" value="${esc(exFilter.q)}" autocomplete="off"></div>
    <div class="chips">
      <button class="chip ${exFilter.g === 'all' ? 'on' : ''}" data-act="ex-group" data-g="all">Tous</button>
      ${Object.entries(GROUPS).map(([k, v]) => `<button class="chip ${exFilter.g === k ? 'on' : ''}" data-act="ex-group" data-g="${k}">${v}</button>`).join('')}
    </div>
    <div class="list" style="margin-top:14px" id="ex-list">${exList(list)}</div>
  </div>`;
}
const exList = (list) => list.length
  ? list.map((e) => `<a class="list-item" href="#/exercise/${e.id}">${thumb(e)}<div class="grow"><div class="t">${esc(e.name)}</div><div class="s">${esc(e.muscles)}</div></div>${ICON.chev}</a>`).join('')
  : '<div class="empty">Aucun exercice trouvé</div>';

actions['ex-group'] = (el) => { exFilter.g = el.dataset.g; rerender(); };
export function onExSearch(el) {
  exFilter.q = el.value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  const list = EXERCISES.filter((e) => (exFilter.g === 'all' || e.group === exFilter.g) &&
    (!exFilter.q || (e.name + ' ' + e.muscles + ' ' + e.equipment).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(exFilter.q)));
  document.getElementById('ex-list').innerHTML = exList(list);
}

export function exerciseView(st, id) {
  const ex = EX[id];
  if (!ex) return { html: `<div class="view"><div class="empty">Exercice introuvable</div></div>` };
  return {
    html: `<div class="view">
      <a class="btn ghost sm" href="#/exercises" style="margin-left:-10px">${ICON.back} Exercices</a>
      ${head(esc(GROUPS[ex.group]), esc(ex.name))}
      <div id="ex-detail">${exerciseDetailHTML(st, ex)}</div>
    </div>`,
    mount: () => mountExerciseDetail(document.getElementById('ex-detail'), st, ex),
  };
}

// ───────────────────────── Progrès ─────────────────────────
const PTABS = [['poids', 'Poids'], ['force', 'Force'], ['dos', 'Dos'], ['historique', 'Historique']];
let forceEx = null;

export function progressView(st, tab = 'poids') {
  if (!PTABS.some(([k]) => k === tab)) tab = 'poids';
  const seg = `<div class="seg" role="tablist">${PTABS.map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" role="tab" aria-selected="${k === tab}" data-act="go" data-href="#/progress/${k}">${v}</button>`).join('')}</div>`;
  let body = '', mount;
  if (tab === 'poids') ({ body, mount } = weightTab(st));
  if (tab === 'force') ({ body, mount } = strengthTab(st));
  if (tab === 'dos') ({ body, mount } = backTab(st));
  if (tab === 'historique') body = historyTab(st);
  return { html: `<div class="view">${head('Suivi', 'Progrès')}${seg}${body}</div>`, mount };
}

function weightTab(st) {
  const trend = weightTrend(st.weights);
  const rate = weeklyRate(trend);
  const p = st.profile;
  const cur = trend.length ? trend[trend.length - 1].avg : null;
  const first = trend.length ? trend[0].kg : null;
  const target = cur && p ? -(cur * p.rate) / 100 : null;
  let status = '';
  if (rate != null && target != null) {
    if (rate > target * 0.5) status = `<div class="callout warn" style="margin-top:12px">${ICON.alert}<div><b>Perte plus lente que prévu.</b> Si cela dure 2 semaines, retire ~150 kcal par jour ou ajoute ~2 000 pas quotidiens.</div></div>`;
    else if (rate < target * 1.6) status = `<div class="callout warn" style="margin-top:12px">${ICON.alert}<div><b>Perte plus rapide que prévu.</b> Ajoute ~150 kcal par jour pour préserver ta force et ta masse musculaire.</div></div>`;
    else status = `<div class="callout" style="margin-top:12px">${ICON.ok}<div><b>Rythme idéal.</b> Tu perds environ ${fmt(Math.abs(rate), 2)} kg par semaine, dans la cible.</div></div>`;
  } else {
    status = `<div class="callout accent" style="margin-top:12px">${ICON.info}<div>Pèse-toi régulièrement : le rythme hebdomadaire s’affiche après ~10 jours de données.</div></div>`;
  }
  const waist = [...st.waist].sort((a, b) => (a.date < b.date ? -1 : 1));
  const recent = [...st.weights].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const body = `
    <div class="grid3" style="margin-top:14px">
      <div class="stat"><div class="k">Actuel (7 j)</div><div class="v">${fmt(cur)}<small>kg</small></div></div>
      <div class="stat"><div class="k">Depuis le début</div><div class="v">${cur != null ? fmtSigned(cur - first) : '–'}<small>kg</small></div></div>
      <div class="stat"><div class="k">Kg / semaine</div><div class="v">${rate != null ? fmtSigned(rate, 2) : '–'}</div><div class="d">cible ${target != null ? fmtSigned(target, 2) : '–'}</div></div>
    </div>
    ${status}
    <div class="card" style="margin-top:12px">
      <div class="row between"><div class="card-title" style="margin:0">Poids corporel</div><button class="btn ghost sm" data-act="add-weight">${ICON.plus} Pesée</button></div>
      <div data-chart="weight" style="margin-top:6px"></div>
      <div class="chart-legend"><span class="raw">Pesées</span><span>Moyenne 7 jours</span>${p?.goalWeight ? '<span class="target">Objectif</span>' : ''}</div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="row between"><div class="card-title" style="margin:0">Tour de taille</div><button class="btn ghost sm" data-act="add-waist">${ICON.plus} Mesure</button></div>
      ${waist.length ? `<div data-chart="waist" style="margin-top:6px"></div><p class="small muted">Dernière mesure : ${fmt(waist[waist.length - 1].cm)} cm (${fmtDate(waist[waist.length - 1].date)})${waist.length > 1 ? ` · ${fmtSigned(waist[waist.length - 1].cm - waist[0].cm)} cm au total` : ''}</p>`
        : '<p class="sub small" style="margin-top:8px">Mesure-le chaque semaine au niveau du nombril, le matin, détendu. Un excellent indicateur de perte de graisse quand la balance stagne.</p>'}
    </div>
    ${recent.length ? `<h2 class="h2">Dernières pesées</h2><div class="list">${recent.map((x) => `<div class="list-item"><div class="grow"><div class="t">${fmt(x.kg)} kg</div><div class="s">${fmtDate(x.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div></div><button class="icon-btn" data-act="del-weight" data-date="${x.date}" aria-label="Supprimer">${ICON.trash}</button></div>`).join('')}</div>` : ''}
  `;
  const mount = () => {
    const el = document.querySelector('[data-chart="weight"]');
    if (el) lineChart(el, trend.map((t) => ({ date: t.date, y: t.avg, raw: t.kg })), { unit: 'kg', rawLabel: 'Pesée', lineLabel: 'Moyenne 7 j', target: p?.goalWeight || null, height: 220 });
    const wl = document.querySelector('[data-chart="waist"]');
    if (wl) lineChart(wl, waist.map((t) => ({ date: t.date, y: t.cm })), { unit: 'cm', lineLabel: 'Tour de taille', height: 160 });
  };
  return { body, mount };
}

function measureSheet({ title, unit, act, min, max, last }) {
  openSheet(`
    <div class="sheet-head"><h3 class="h3">${title}</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
    <div class="stack">
      <label class="field"><span>Date</span><input class="input" type="date" id="m-date" value="${today()}" max="${today()}"></label>
      <label class="field"><span>Valeur</span><div class="input-unit"><input class="input" id="m-val" inputmode="decimal" placeholder="${last ? fmt(last) : ''}" data-min="${min}" data-max="${max}"><em>${unit}</em></div></label>
      <button class="btn block" data-act="${act}">Enregistrer</button>
    </div>`, { onMount: (s) => setTimeout(() => s.querySelector('#m-val').focus(), 300) });
}
actions['add-weight'] = () => measureSheet({ title: 'Ajouter une pesée', unit: 'kg', act: 'save-measure-w', min: 30, max: 300, last: latestWeight(getState()) });
actions['add-waist'] = () => { const w = getState().waist; measureSheet({ title: 'Tour de taille', unit: 'cm', act: 'save-measure-c', min: 40, max: 250, last: w.length ? w[w.length - 1].cm : null }); };
const saveMeasure = (key, field) => () => {
  const d = document.getElementById('m-date').value || today();
  const inp = document.getElementById('m-val');
  const v = parseNum(inp.value);
  if (!v || v < +inp.dataset.min || v > +inp.dataset.max) { toast('Valeur invalide'); return; }
  update((st) => {
    const e = st[key].find((x) => x.date === d);
    if (e) e[field] = v; else st[key].push({ date: d, [field]: v });
  }, { silent: true });
  closeSheet();
  rerender();
  toast('Enregistré');
};
actions['save-measure-w'] = saveMeasure('weights', 'kg');
actions['save-measure-c'] = saveMeasure('waist', 'cm');
actions['del-weight'] = async (el) => {
  if (!(await confirmSheet({ title: 'Supprimer cette pesée ?', ok: 'Supprimer', danger: true }))) return;
  update((st) => { st.weights = st.weights.filter((x) => x.date !== el.dataset.date); });
};

function weekStart(d) {
  const x = parseDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return isoDay(x);
}

function strengthTab(st) {
  const withData = EXERCISES.filter((e) => e.track === 'wr' && exerciseHistory(st, e.id).some((h) => bestE1rm(h.sets) > 0));
  if (!forceEx || !withData.some((e) => e.id === forceEx)) forceEx = withData.find((e) => ['squat', 'deadlift', 'bench'].includes(e.id))?.id || withData[0]?.id;
  // Volume hebdomadaire (8 semaines)
  const weeks = [];
  const start = parseDay(weekStart(today()));
  for (let i = 7; i >= 0; i--) { const d = new Date(start); d.setDate(d.getDate() - 7 * i); weeks.push(isoDay(d)); }
  const vol = Object.fromEntries(weeks.map((w) => [w, 0]));
  const sets = Object.fromEntries(weeks.map((w) => [w, 0]));
  for (const s of st.sessions) {
    const w = weekStart(s.date);
    if (w in vol) { const x = sessionStats(s); vol[w] += x.volume / 1000; sets[w] += x.sets; }
  }
  const records = withData.map((e) => {
    const h = exerciseHistory(st, e.id);
    return { e, best: Math.max(...h.map((x) => bestE1rm(x.sets))), n: h.length };
  }).filter((r) => r.best > 0).sort((a, b) => b.best - a.best);

  const body = `
    ${withData.length ? `
    <div class="card" style="margin-top:14px">
      <div class="card-title">1RM estimé</div>
      <div class="chips" style="margin-bottom:8px">${withData.map((e) => `<button class="chip ${e.id === forceEx ? 'on' : ''}" data-act="force-ex" data-id="${e.id}">${esc(e.name)}</button>`).join('')}</div>
      <div data-chart="force"></div>
      <p class="small muted" style="margin-top:6px">Estimation d’Epley à partir de ta meilleure série de chaque séance.</p>
    </div>` : `<div class="card" style="margin-top:14px"><div class="empty">Termine ta première séance pour voir ta progression de force.</div></div>`}
    <div class="card" style="margin-top:12px">
      <div class="card-title">Tonnage hebdomadaire (tonnes)</div>
      <div data-chart="vol"></div>
    </div>
    ${records.length ? `<h2 class="h2">Records</h2><div class="list">${records.map((r) => `<a class="list-item" href="#/exercise/${r.e.id}">${thumb(r.e)}<div class="grow"><div class="t">${esc(r.e.name)}</div><div class="s">${r.n} séance${r.n > 1 ? 's' : ''}</div></div><div style="text-align:right"><b>${fmt(r.best)} kg</b><div class="small muted">1RM est.</div></div></a>`).join('')}</div>` : ''}
  `;
  const mount = () => {
    const f = document.querySelector('[data-chart="force"]');
    if (f && forceEx) lineChart(f, exerciseHistory(st, forceEx).map((h) => ({ date: h.date, y: bestE1rm(h.sets) })).filter((x) => x.y), { unit: 'kg', lineLabel: '1RM estimé', height: 190 });
    const v = document.querySelector('[data-chart="vol"]');
    if (v) barChart(v, weeks.map((w) => ({ label: fmtDate(w, { day: 'numeric', month: 'numeric' }), value: vol[w] })), { unit: 't', decimals: 1 });
  };
  return { body, mount };
}
actions['force-ex'] = (el) => { forceEx = el.dataset.id; rerender(); };

function backTab(st) {
  const pts = st.sessions.filter((s) => s.pain != null).map((s) => ({ date: s.date, y: s.pain }));
  // Endurance planche latérale : meilleure durée par séance
  const sp = exerciseHistory(st, 'side_plank').map((h) => ({ date: h.date, y: Math.max(...h.sets.map((s) => s.r || 0)) }));
  const big3 = st.sessions.filter((s) => s.items.some((i) => i.exId === 'bird_dog' || i.exId === 'curl_up')).length;
  const recent = pts.slice(-4);
  const avg = recent.length ? recent.reduce((a, b) => a + b.y, 0) / recent.length : null;
  const body = `
    <div class="grid3" style="margin-top:14px">
      <div class="stat"><div class="k">Douleur récente</div><div class="v">${avg != null ? fmt(avg) : '–'}<small>/10</small></div><div class="d">moy. 4 séances</div></div>
      <div class="stat"><div class="k">Big 3 réalisés</div><div class="v">${big3}</div><div class="d">séances</div></div>
      <div class="stat"><div class="k">Planche lat.</div><div class="v">${sp.length ? Math.max(...sp.map((x) => x.y)) : '–'}<small>s</small></div><div class="d">record</div></div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-title">Douleur lombaire déclarée (0–10)</div>
      <div data-chart="pain"></div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-title">Planche latérale · meilleur maintien (s)</div>
      <div data-chart="sp"></div>
    </div>
    <div class="callout" style="margin-top:12px">${ICON.spine}<div><b>Les clés d’un dos solide</b><br>Régularité du Big 3, charnière de hanche maîtrisée, progression patiente des charges, et marche quotidienne. Les douleurs fluctuent : c’est la tendance sur plusieurs semaines qui compte.</div></div>
  `;
  const mount = () => {
    const a = document.querySelector('[data-chart="pain"]');
    if (a) lineChart(a, pts, { unit: '/10', lineLabel: 'Douleur', decimals: 0, height: 160 });
    const b = document.querySelector('[data-chart="sp"]');
    if (b) lineChart(b, sp, { unit: 's', lineLabel: 'Maintien', decimals: 0, height: 160 });
  };
  return { body, mount };
}

function historyTab(st) {
  if (!st.sessions.length) return `<div class="card" style="margin-top:14px"><div class="empty">Aucune séance enregistrée pour l’instant.<br><br><a class="btn sm" href="#/today">Commencer</a></div></div>`;
  const byMonth = {};
  for (const s of [...st.sessions].reverse()) {
    const m = parseDay(s.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    (byMonth[m] ||= []).push(s);
  }
  return Object.entries(byMonth).map(([m, list]) => `
    <div class="section-label" style="margin-top:20px">${m}</div>
    <div class="list">${list.map((s) => {
      const x = sessionStats(s);
      return `<button class="list-item" data-act="hist-open" data-id="${s.id}">
        <div style="width:44px;text-align:center;flex:none"><div style="font-size:20px;font-weight:800">${parseDay(s.date).getDate()}</div><div class="small muted">${parseDay(s.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</div></div>
        <div class="grow"><div class="t">${esc(s.name)}</div><div class="s">${fmtDuration(x.duration)} · ${x.sets} séries${x.volume ? ` · ${fmt(x.volume / 1000, 1)} t` : ''}${s.pain != null ? ` · dos ${s.pain}/10` : ''}</div></div>${ICON.chev}</button>`;
    }).join('')}</div>`).join('');
}

actions['hist-open'] = (el) => {
  const st = getState();
  const s = st.sessions.find((x) => x.id === el.dataset.id);
  if (!s) return;
  const x = sessionStats(s);
  openSheet(`
    <div class="sheet-head"><div><h3 class="h3">${esc(s.name)}</h3><div class="small muted">${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
    <div class="grid3"><div class="stat"><div class="k">Durée</div><div class="v" style="font-size:19px">${fmtDuration(x.duration)}</div></div><div class="stat"><div class="k">Séries</div><div class="v" style="font-size:19px">${x.sets}</div></div><div class="stat"><div class="k">Volume</div><div class="v" style="font-size:19px">${fmt(x.volume / 1000, 1)}<small>t</small></div></div></div>
    <div class="card" style="margin-top:12px">${s.items.map((it) => { const ex = EX[it.exId]; return `<div class="hist-ex"><span>${esc(ex?.name || it.exId)}</span><span>${it.sets.map((y) => esc(setLabel(ex, y))).join('<br>')}</span></div>`; }).join('')}</div>
    ${s.pain != null ? `<p class="sub small" style="margin-top:10px">Dos avant la séance : ${s.pain}/10</p>` : ''}
    ${s.notes ? `<div class="card tight" style="margin-top:10px"><div class="card-title">Notes</div><p class="sub">${esc(s.notes)}</p></div>` : ''}
    <button class="btn block danger" data-act="hist-del" data-id="${s.id}" style="margin-top:14px">${ICON.trash} Supprimer la séance</button>`);
};
actions['hist-del'] = async (el) => {
  if (!(await confirmSheet({ title: 'Supprimer cette séance ?', text: 'Cette action est définitive.', ok: 'Supprimer', danger: true }))) return;
  closeSheet();
  update((st) => { st.sessions = st.sessions.filter((x) => x.id !== el.dataset.id); });
  toast('Séance supprimée');
};

// ───────────────────────── Profil ─────────────────────────
export function profileView(st) {
  const p = st.profile;
  const w = latestWeight(st);
  const nut = nutrition(p, w);
  const sel = (key, opts) => `<div class="options">${opts.map((o) => `<button class="option ${p[key] === o.v ? 'on' : ''}" data-act="prof-set" data-k="${key}" data-v="${o.v}"><div><b>${o.label}</b><small>${o.hint}</small></div></button>`).join('')}</div>`;
  return `
  <div class="view">
    ${head('Réglages', 'Profil')}
    <div class="card">
      <div class="grid2">
        <label class="field" style="grid-column:span 2"><span>Prénom</span><input class="input" data-prof="name" value="${esc(p.name || '')}" placeholder="Facultatif" autocomplete="given-name"></label>
        <label class="field"><span>Sexe</span><select class="select" data-prof="sex"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>Homme</option><option value="f" ${p.sex === 'f' ? 'selected' : ''}>Femme</option></select></label>
        <label class="field"><span>Âge</span><div class="input-unit"><input class="input" data-prof="age" inputmode="numeric" value="${p.age}"><em>ans</em></div></label>
        <label class="field"><span>Taille</span><div class="input-unit"><input class="input" data-prof="height" inputmode="numeric" value="${p.height}"><em>cm</em></div></label>
        <label class="field"><span>Poids visé</span><div class="input-unit"><input class="input" data-prof="goalWeight" inputmode="decimal" value="${p.goalWeight ? String(p.goalWeight).replace('.', ',') : ''}" placeholder="—"><em>kg</em></div></label>
      </div>
    </div>
    <h2 class="h2">Activité quotidienne</h2>
    ${sel('activity', ACTIVITY)}
    <h2 class="h2">Rythme de perte</h2>
    ${sel('rate', RATES)}
    ${nut ? `<h2 class="h2">Tes besoins</h2>
    <div class="card">
      <div class="kv"><span>Métabolisme de base</span><span>${fmt(nut.bmr, 0)} kcal</span></div>
      <div class="kv"><span>Dépense totale estimée</span><span>${fmt(nut.tdee, 0)} kcal</span></div>
      <div class="kv"><span>Objectif calorique</span><span>${fmt(nut.kcal, 0)} kcal</span></div>
      <div class="kv"><span>Perte visée</span><span>≈ ${fmt(nut.weeklyLoss, 2)} kg / sem.</span></div>
      <div class="kv"><span>Protéines</span><span>${nut.protein} g / jour</span></div>
      <div class="kv"><span>IMC</span><span>${fmt(nut.bmi)}</span></div>
      ${nut.capped ? `<p class="small warn" style="margin-top:8px">Objectif plafonné pour ne pas descendre sous ton métabolisme de base.</p>` : ''}
      <p class="small muted" style="margin-top:8px">Estimations (Mifflin-St Jeor). Ajuste selon l’évolution réelle de ta moyenne de poids.</p>
    </div>` : ''}
    <h2 class="h2">Préférences</h2>
    <div class="list">
      <button class="list-item" data-act="toggle-sound">${ICON.sound}<div class="grow"><div class="t">Signal sonore fin de repos</div></div><span class="tag ${st.prefs.sound !== false ? 'accent' : ''}">${st.prefs.sound !== false ? 'Activé' : 'Désactivé'}</span></button>
      <button class="list-item" data-act="restart-cycle">${ICON.bolt}<div class="grow"><div class="t">Recommencer le cycle</div><div class="s">Revenir à la semaine 1 (après une pause, par exemple)</div></div></button>
    </div>
    <h2 class="h2">Données</h2>
    <p class="sub small" style="margin-bottom:10px">Tes données restent sur cet appareil. Exporte-les régulièrement pour les sauvegarder ou les transférer.</p>
    <div class="list">
      <button class="list-item" data-act="export">${ICON.download}<div class="grow"><div class="t">Exporter mes données</div><div class="s">Fichier JSON</div></div></button>
      <label class="list-item" style="cursor:pointer">${ICON.upload}<div class="grow"><div class="t">Importer une sauvegarde</div><div class="s">Remplace les données actuelles</div></div><input type="file" accept="application/json,.json" id="import-file" hidden></label>
      <button class="list-item" data-act="reset" style="color:var(--danger)">${ICON.trash}<div class="grow"><div class="t">Tout effacer</div></div></button>
    </div>
    <p class="small muted" style="text-align:center;margin-top:24px">FitGhiz · système métrique · fonctionne hors ligne<br>Ne remplace pas un avis médical.</p>
  </div>`;
}

export function onProfileInput(el) {
  const k = el.dataset.prof;
  let v = el.value;
  if (['age', 'height'].includes(k)) v = parseNum(v);
  if (k === 'goalWeight') v = parseNum(v);
  if (['age', 'height'].includes(k) && (!v || v < 10 || v > 250)) return;
  update((st) => { st.profile[k] = v; });
}
actions['prof-set'] = (el) => update((st) => { st.profile[el.dataset.k] = +el.dataset.v; });
actions['toggle-sound'] = () => update((st) => { st.prefs.sound = st.prefs.sound === false; });
actions['restart-cycle'] = async () => {
  if (await confirmSheet({ title: 'Recommencer le cycle ?', text: 'La semaine 1 commencera aujourd’hui. Ton historique est conservé.', ok: 'Recommencer' })) {
    update((st) => { st.planStart = today(); });
    toast('Nouveau cycle : semaine 1');
  }
};
actions['export'] = async () => {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const name = `fitghiz-${today()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Sauvegarde FitGhiz' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
export async function onImportFile(el) {
  const f = el.files?.[0];
  if (!f) return;
  if (!(await confirmSheet({ title: 'Importer cette sauvegarde ?', text: 'Les données actuelles seront remplacées.', ok: 'Importer', danger: true }))) { el.value = ''; return; }
  try { importJSON(await f.text()); toast('Sauvegarde importée'); } catch { toast('Fichier invalide'); }
}
actions['reset'] = async () => {
  if (await confirmSheet({ title: 'Tout effacer ?', text: 'Profil, séances et mesures seront supprimés définitivement. Pense à exporter avant.', ok: 'Tout effacer', danger: true })) {
    resetAll();
    location.hash = '#/today';
  }
};

// ───────────────────────── Bienvenue ─────────────────────────
let onb = { step: 0, d: { sex: 'm', days: 3, activity: 1.375, rate: 0.5 } };
export function onboardingView() {
  const d = onb.d;
  const dots = `<div class="dots">${[0, 1, 2].map((i) => `<i class="${i === onb.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const feat = (ic, t, s) => `<div class="feat"><div class="ic">${ICON[ic]}</div><div><b>${t}</b><p>${s}</p></div></div>`;
  if (onb.step === 0) return `
    <div class="onb">
      <img class="logo" src="icons/icon-192.png" alt="">
      <h1>Plus fort, plus léger,<br>le dos solide.</h1>
      <p class="sub">Ton coach de salle de sport, basé sur la science.</p>
      ${feat('plan', 'Un programme efficace', 'Full body 3 jours ou haut/bas 4 jours, cycles de 6 semaines avec décharge.')}
      ${feat('spine', 'Priorité au bas du dos', 'Big 3 de McGill à chaque séance, charnière de hanche et gainage progressif.')}
      ${feat('dumbbell', 'Chaque exercice illustré', 'Animations, consignes, erreurs fréquentes et alternatives.')}
      ${feat('chart', 'Progression automatique', 'Charges suggérées, records, tendance du poids et cible calorique.')}
      <div class="foot">${dots}<button class="btn block" data-act="onb-next">Commencer</button></div>
    </div>`;
  if (onb.step === 1) return `
    <div class="onb">
      <div class="eyebrow">Étape 1 sur 2</div>
      <h1>Faisons connaissance</h1>
      <p class="sub">Pour calculer tes besoins et ton objectif calorique.</p>
      <div class="stack" style="margin-top:18px">
        <label class="field"><span>Prénom (facultatif)</span><input class="input" id="o-name" value="${esc(d.name || '')}" autocomplete="given-name"></label>
        <div class="field"><span>Sexe</span><div class="seg">${[['m', 'Homme'], ['f', 'Femme']].map(([v, l]) => `<button class="${d.sex === v ? 'on' : ''}" data-act="onb-set" data-k="sex" data-v="${v}">${l}</button>`).join('')}</div></div>
        <div class="grid2">
          <label class="field"><span>Âge</span><div class="input-unit"><input class="input" id="o-age" inputmode="numeric" value="${d.age || ''}" placeholder="35"><em>ans</em></div></label>
          <label class="field"><span>Taille</span><div class="input-unit"><input class="input" id="o-height" inputmode="numeric" value="${d.height || ''}" placeholder="175"><em>cm</em></div></label>
          <label class="field"><span>Poids actuel</span><div class="input-unit"><input class="input" id="o-weight" inputmode="decimal" value="${d.weight ? String(d.weight).replace('.', ',') : ''}" placeholder="85"><em>kg</em></div></label>
          <label class="field"><span>Poids visé</span><div class="input-unit"><input class="input" id="o-goal" inputmode="decimal" value="${d.goalWeight ? String(d.goalWeight).replace('.', ',') : ''}" placeholder="78"><em>kg</em></div></label>
        </div>
      </div>
      <div class="foot">${dots}<div class="grid2"><button class="btn secondary" data-act="onb-back">Retour</button><button class="btn" data-act="onb-next">Continuer</button></div></div>
    </div>`;
  return `
    <div class="onb">
      <div class="eyebrow">Étape 2 sur 2</div>
      <h1>Ton programme</h1>
      <div class="field" style="margin-top:14px"><span>Séances de musculation par semaine</span>
        <div class="options">${[3, 4].map((n) => `<button class="option ${d.days === n ? 'on' : ''}" data-act="onb-set" data-k="days" data-v="${n}"><div><b>${PLANS[n].name}</b><small>${n === 3 ? 'Idéal pour débuter ou reprendre · ≈ 60 min' : 'Plus de volume · ≈ 60–70 min'}</small></div></button>`).join('')}</div></div>
      <div class="field" style="margin-top:16px"><span>Activité quotidienne (hors séances)</span>
        <div class="options">${ACTIVITY.map((a) => `<button class="option ${d.activity === a.v ? 'on' : ''}" data-act="onb-set" data-k="activity" data-v="${a.v}"><div><b>${a.label}</b><small>${a.hint}</small></div></button>`).join('')}</div></div>
      <div class="field" style="margin-top:16px"><span>Rythme de perte de poids</span>
        <div class="options">${RATES.map((a) => `<button class="option ${d.rate === a.v ? 'on' : ''}" data-act="onb-set" data-k="rate" data-v="${a.v}"><div><b>${a.label}</b><small>${a.hint}</small></div></button>`).join('')}</div></div>
      <div class="foot">${dots}<div class="grid2"><button class="btn secondary" data-act="onb-back">Retour</button><button class="btn" data-act="onb-finish">C’est parti</button></div></div>
    </div>`;
}

function readOnbStep1() {
  const d = onb.d;
  d.name = document.getElementById('o-name')?.value.trim() || '';
  d.age = parseNum(document.getElementById('o-age')?.value);
  d.height = parseNum(document.getElementById('o-height')?.value);
  d.weight = parseNum(document.getElementById('o-weight')?.value);
  d.goalWeight = parseNum(document.getElementById('o-goal')?.value);
}
actions['onb-set'] = (el) => {
  if (onb.step === 1) readOnbStep1();
  const v = el.dataset.v;
  onb.d[el.dataset.k] = isNaN(+v) ? v : +v;
  rerender();
};
actions['onb-back'] = () => { if (onb.step === 1) readOnbStep1(); onb.step = Math.max(0, onb.step - 1); rerender(); };
actions['onb-next'] = () => {
  if (onb.step === 1) {
    readOnbStep1();
    const d = onb.d;
    if (!d.age || d.age < 14 || d.age > 100) return toast('Indique ton âge');
    if (!d.height || d.height < 120 || d.height > 230) return toast('Indique ta taille en cm');
    if (!d.weight || d.weight < 35 || d.weight > 300) return toast('Indique ton poids en kg');
    if (d.goalWeight && (d.goalWeight < 35 || d.goalWeight > 300)) d.goalWeight = null;
  }
  onb.step++;
  rerender();
  window.scrollTo(0, 0);
};
actions['onb-finish'] = () => {
  const { weight, ...profile } = onb.d;
  update((st) => {
    st.profile = profile;
    st.planStart = today();
    if (!st.weights.some((x) => x.date === today())) st.weights.push({ date: today(), kg: weight });
  }, { silent: true });
  requestPersistence();
  location.hash = '#/today';
  rerender();
  toast('Programme prêt ! Bonne première séance 💪');
};

