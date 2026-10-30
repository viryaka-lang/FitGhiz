// Fiche détaillée d'un exercice (page ou feuille modale).

import { EX, GROUPS } from './data/exercises.js';
import { animateFigure } from './figure.js';
import { lineChart } from './charts.js';
import { bestE1rm, fmt, fmtDate } from './logic.js';
import { esc, ICON, thumb, openSheet } from './ui.js';

export function exerciseHistory(st, exId) {
  const out = [];
  for (const s of st.sessions) {
    for (const it of s.items) {
      if (it.exId !== exId) continue;
      const sets = it.sets.filter((x) => x.done);
      if (sets.length) out.push({ date: s.date, sets });
    }
  }
  return out;
}

const MUSCLE_NAMES = {
  lowback: 'Lombaires', upperback: 'Haut du dos', lats: 'Dorsaux', chest: 'Pectoraux', abs: 'Abdominaux',
  core: 'Tronc', quads: 'Quadriceps', hams: 'Ischios', calves: 'Mollets', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Avant-bras', glutes: 'Fessiers', shoulders: 'Épaules',
};

export function setLabel(ex, s) {
  switch (ex.track) {
    case 'wr': return `${fmt(s.w)} kg × ${s.r}`;
    case 'reps': return s.w ? `${s.r} rép. +${fmt(s.w)} kg` : `${s.r} rép.`;
    case 'time': return `${s.r} s`;
    case 'wtime': return `${fmt(s.w)} kg · ${s.r} s`;
    case 'cardio': return `${s.r} min${s.km ? ` · ${fmt(s.km, 2)} km` : ''}`;
  }
  return '';
}

const topOf = (sets) => sets.reduce((a, b) => ((b.w || 0) > (a.w || 0) || ((b.w || 0) === (a.w || 0) && (b.r || 0) > (a.r || 0)) ? b : a));

export function exerciseDetailHTML(st, ex, { inSheet = false } = {}) {
  const hist = exerciseHistory(st, ex.id);
  const last = hist[hist.length - 1];
  const best = ex.track === 'wr' ? Math.max(0, ...hist.map((h) => bestE1rm(h.sets))) : 0;
  const alts = (ex.alts || []).map((id) => EX[id]).filter(Boolean);
  return `
    <div class="stage" data-stage="${ex.id}"></div>
    <div class="row between" style="margin-top:8px">
      <div class="legend"><span><i></i>Muscles sollicités</span><span><i class="far"></i>Côté opposé</span></div>
      <button class="btn ghost sm" data-play aria-label="Pause">${ICON.pause}</button>
    </div>
    <div class="tags" style="margin-top:10px">
      <span class="tag accent">${esc(GROUPS[ex.group])}</span>
      ${(ex.highlight || []).map((m) => `<span class="tag">${MUSCLE_NAMES[m] || m}</span>`).join('')}
    </div>
    <p class="sub" style="margin-top:10px"><b>Muscles :</b> ${esc(ex.muscles)}<br><b>Matériel :</b> ${esc(ex.equipment)}${ex.holdNote ? `<br><b>Tempo :</b> ${esc(ex.holdNote)}` : ''}</p>

    ${last ? `
    <div class="grid2" style="margin-top:14px">
      <div class="stat"><div class="k">Dernière fois</div><div class="v" style="font-size:18px">${esc(setLabel(ex, topOf(last.sets)))}</div><div class="d">${fmtDate(last.date)}</div></div>
      ${best ? `<div class="stat"><div class="k">1RM estimé (record)</div><div class="v">${fmt(best)}<small>kg</small></div><div class="d">Formule d’Epley</div></div>`
              : `<div class="stat"><div class="k">Séances</div><div class="v">${hist.length}</div><div class="d">réalisées</div></div>`}
    </div>
    ${ex.track === 'wr' && hist.length > 1 ? `<div class="card" style="margin-top:12px"><div class="card-title">Progression · 1RM estimé</div><div data-chart="e1rm"></div></div>` : ''}
    ` : ''}

    <h3 class="h2">Exécution</h3>
    <ol class="steps">${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>

    <div class="callout" style="margin-top:4px">${ICON.spine}<div><b>Bas du dos</b><br>${esc(ex.back)}</div></div>

    <h3 class="h2">Erreurs fréquentes</h3>
    <ul class="bullets sub">${ex.mistakes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

    ${alts.length ? `<h3 class="h2">Alternatives</h3>
    <div class="list">${alts.map((a) => `
      <${inSheet ? 'div' : 'a href="#/exercise/' + a.id + '"'} class="list-item">${thumb(a)}<div class="grow"><div class="t">${esc(a.name)}</div><div class="s">${esc(a.equipment)}</div></div>${inSheet ? '' : ICON.chev}</${inSheet ? 'div' : 'a'}>`).join('')}
    </div>` : ''}
  `;
}

export function mountExerciseDetail(root, st, ex) {
  const stage = root.querySelector('[data-stage]');
  const anim = animateFigure(stage, ex);
  const btn = root.querySelector('[data-play]');
  const sync = () => { btn.innerHTML = anim.playing ? ICON.pause : ICON.play; btn.setAttribute('aria-label', anim.playing ? 'Pause' : 'Lecture'); };
  sync();
  btn.onclick = () => { anim.toggle(); sync(); };
  const ch = root.querySelector('[data-chart="e1rm"]');
  if (ch) {
    const pts = exerciseHistory(st, ex.id).map((h) => ({ date: h.date, y: bestE1rm(h.sets) })).filter((p) => p.y);
    requestAnimationFrame(() => lineChart(ch, pts, { unit: 'kg', lineLabel: '1RM estimé', height: 170 }));
  }
}

export function openExerciseSheet(st, ex) {
  openSheet(
    `<div class="sheet-head"><h3 class="h3">${esc(ex.name)}</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
     ${exerciseDetailHTML(st, ex, { inSheet: true })}`,
    { onMount: (s) => mountExerciseDetail(s, st, ex) },
  );
}

