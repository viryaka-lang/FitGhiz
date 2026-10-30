// Écran de séance en cours : saisie des séries, minuteur de repos, chrono de gainage.

import { EX } from './data/exercises.js';
import { BACK_FRIENDLY, TAG_LABEL } from './data/program.js';
import { getState, update } from './store.js';
import { suggest, cycleInfo, isLight, fmt, fmtClock, parseNum, sessionStats, findPRs, warmupSets, fmtDuration } from './logic.js';
import { esc, ICON, actions, thumb, presc, openSheet, closeSheet, confirmSheet, toast, beep, unlockAudio, rerender, unitOf, navigate } from './ui.js';
import { openExerciseSheet, setLabel } from './detail.js';

const COLS = {
  wr: [{ f: 'w', label: 'kg', dec: true }, { f: 'r', label: 'Rép.' }],
  reps: [{ f: 'w', label: 'Lest kg', dec: true }, { f: 'r', label: 'Rép.' }],
  time: [{ f: 'r', label: 'Secondes', span: 2 }],
  wtime: [{ f: 'w', label: 'kg', dec: true }, { f: 'r', label: 'Secondes' }],
  cardio: [{ f: 'r', label: 'Minutes' }, { f: 'km', label: 'km', dec: true }],
};
const colsOf = (ex) => {
  if (ex.track === 'reps' && !ex.inc) return [{ f: 'r', label: 'Répétitions', span: 2 }];
  if (ex.assist) return [{ f: 'w', label: 'Assist. kg', dec: true }, { f: 'r', label: 'Rép.' }];
  return COLS[ex.track];
};
const inVal = (n) => (n == null ? '' : String(n).replace('.', ','));

function counts(a) {
  let done = 0, total = 0;
  for (const it of a.items) for (const s of it.sets) { total++; if (s.done) done++; }
  return { done, total };
}

function placeholder(it, f) {
  if (f === 'w') return it.sug.weight != null ? inVal(it.sug.weight) : EX[it.exId].track === 'reps' ? '0' : '—';
  if (f === 'r') return String(it.sug.reps ?? it.target.reps[1]);
  return '';
}

function setRow(it, i, s, j) {
  const ex = EX[it.exId];
  const cells = colsOf(ex).map((c) => `
    <input class="set-in" ${c.span ? 'style="grid-column:span 2"' : ''} inputmode="${c.dec ? 'decimal' : 'numeric'}" enterkeyhint="done"
      data-in="set" data-i="${i}" data-j="${j}" data-f="${c.f}" value="${inVal(s[c.f])}" placeholder="${placeholder(it, c.f)}"
      aria-label="${c.label}, série ${j + 1}">`).join('');
  return `<div class="set-row ${s.done ? 'is-done' : ''}">
      <div class="set-n">${j + 1}</div>${cells}
      <button class="check ${s.done ? 'on' : ''}" data-act="set-check" data-i="${i}" data-j="${j}" aria-label="Valider la série ${j + 1}">${ICON.check}</button>
    </div>`;
}

function itemCard(st, it, i) {
  const ex = EX[it.exId];
  const a = st.active;
  const done = it.sets.filter((s) => s.done).length;
  const cols = colsOf(ex);
  const sug = it.sug;
  let sugHTML = '';
  if (sug.last) {
    const lastTxt = sug.last.sets.map((s) => setLabel(ex, s)).join(' · ');
    sugHTML = `<div class="ex-sug ${sug.trend}"><span class="muted">Dernière fois :</span> ${esc(lastTxt)}<br><b>${esc(sug.note)}</b></div>`;
  } else {
    sugHTML = `<div class="ex-sug">${esc(sug.note)}</div>`;
  }
  const wu = done === 0 ? warmupSets(ex, it.sets[0]?.w ?? sug.weight) : null;
  const timed = ex.track === 'time' || ex.track === 'wtime' || ex.track === 'cardio';
  const light = isLight(it.target.tag);
  return `
  <div class="ex-card ${done === it.sets.length ? 'done' : ''} ${light ? 'light' : ''}" id="ex-${i}">
    <div class="ex-head">
      <button data-act="ex-info" data-i="${i}" aria-label="Voir l’exercice ${esc(ex.name)}">${thumb(ex)}</button>
      <div class="grow">
        <div class="ex-name">${esc(ex.name)}${it.exId !== it.origExId ? ' <span class="tag" style="font-size:11px">remplacé</span>' : ''}</div>
        <div class="ex-presc">${presc(ex, it.target, { sets: it.sets.length, rest: !light })}${(ex.track === 'wr' || ex.track === 'reps') && !light && it.target.tag !== 'warmup' ? ` · RIR ${a.rir}` : ''}</div>
      </div>
      <button class="icon-btn" data-act="ex-swap" data-i="${i}" aria-label="Remplacer l’exercice">${ICON.swap}</button>
    </div>
    ${light ? '' : sugHTML}
    ${wu ? `<div class="warmup"><b>Échauffement :</b> ${wu.join(' → ')}</div>` : ''}
    <div class="sets">
      <div class="set-row head"><div>Série</div>${cols.map((c) => `<div ${c.span ? 'style="grid-column:span 2"' : ''}>${c.label}</div>`).join('')}<div></div></div>
      ${it.sets.map((s, j) => setRow(it, i, s, j)).join('')}
    </div>
    <div class="set-actions">
      ${light ? '' : `<button class="btn secondary sm" data-act="set-add" data-i="${i}">${ICON.plus} Série</button>`}
      ${it.sets.length > 1 && !light ? `<button class="btn secondary sm" data-act="set-remove" data-i="${i}">${ICON.minus} Série</button>` : ''}
      ${timed ? `<button class="btn secondary sm" data-act="hold" data-i="${i}">${ICON.timer} Chrono</button>` : ''}
      <button class="btn ghost sm" data-act="ex-info" data-i="${i}">${ICON.info} Consignes</button>
    </div>
  </div>`;
}

export function workoutView(st) {
  const a = st.active;
  const { done, total } = counts(a);
  let lastTag = null;
  const body = a.items.map((it, i) => {
    let h = '';
    const tag = it.target.tag;
    const label = { prep: 'Échauffement · ≈ 8 min', warmup: 'Activation du tronc · Big 3 de McGill', main: 'Exercices principaux', stretch: 'Retour au calme · étirements' }[tag] || TAG_LABEL[tag];
    if (tag !== lastTag) h += `<div class="section-label">${label}</div>`;
    lastTag = tag;
    return h + itemCard(st, it, i);
  }).join('');

  const painHTML = a.pain == null
    ? `<div class="card">
        <div class="row">${ICON.spine.replace('<svg', '<svg style="width:22px;height:22px;color:var(--accent)"')}<div class="h3">Comment va ton dos aujourd’hui ?</div></div>
        <p class="sub small" style="margin-top:4px">0 = aucune gêne · 10 = douleur maximale</p>
        <div class="pain">${Array.from({ length: 11 }, (_, n) => `<button data-act="pain" data-v="${n}">${n}</button>`).join('')}</div>
      </div>`
    : `<div class="card tight row between">
        <div class="row">${ICON.spine.replace('<svg', '<svg style="width:20px;height:20px;color:var(--accent)"')}<span>Dos aujourd’hui : <b>${a.pain}/10</b></span></div>
        <button class="btn ghost sm" data-act="pain-reset">Modifier</button>
      </div>
      ${a.pain >= 4 ? `<div class="callout warn" style="margin-top:10px">${ICON.alert}<div><b>Dos sensible : on adapte.</b><br>Réduis les charges de 10 à 20 %, reste loin de l’échec et privilégie les variantes douces. Si la douleur irradie dans la jambe ou s’aggrave, arrête et consulte.
        <div style="margin-top:10px"><button class="btn sm" data-act="adapt-back">Adapter la séance</button></div></div></div>` : ''}`;

  const cyc = cycleInfo(st);
  const rirText = a.deload
    ? `<div class="callout accent" style="margin-top:10px">${ICON.bolt}<div><b>Semaine de décharge.</b> Moitié des séries, charges habituelles, effort léger (≈ 4 rép. en réserve). Tu récupères pour progresser au prochain cycle.</div></div>`
    : `<div class="callout accent" style="margin-top:10px">${ICON.bolt}<div><b>Semaine ${cyc.week}/6 · RIR ${a.rir}.</b> Arrête chaque série quand il te reste environ ${a.rir} répétition${a.rir > 1 ? 's' : ''} en réserve. Technique parfaite avant tout.</div></div>`;

  const html = `
  <div class="wk">
    <div class="wk-top">
      <div class="row between">
        <button class="icon-btn" data-act="wk-minimize" aria-label="Réduire">${ICON.back}</button>
        <div class="grow"><div class="wk-title">${esc(a.name)}</div><div class="wk-meta"><span data-elapsed>${fmtClock((Date.now() - a.start) / 1000)}</span> · ${done}/${total} séries</div></div>
        <button class="btn sm" data-act="wk-finish">Terminer</button>
      </div>
      <div class="progress"><div style="width:${total ? (done / total) * 100 : 0}%"></div></div>
    </div>
    <div class="wk-body">
      ${painHTML}
      ${rirText}
      ${body}
      <button class="btn block" data-act="wk-finish" style="margin-top:8px">${ICON.check} Terminer la séance</button>
      <button class="btn block danger" data-act="wk-discard" style="margin-top:6px">Abandonner la séance</button>
    </div>
  </div>`;
  return { html, mount: mountWorkout };
}

// ── Verrou d'écran (garde l'écran allumé pendant la séance) ──
let wakeLock = null;
async function requestWake() {
  try { if ('wakeLock' in navigator && !wakeLock && document.visibilityState === 'visible') { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch {}
}
export function releaseWake() { try { wakeLock?.release(); } catch {} wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && getState().active && location.hash.startsWith('#/workout')) requestWake(); });

function mountWorkout() {
  requestWake();
  startTicker();
}

// ── Saisie ──
export function onSetInput(el, commit) {
  const i = +el.dataset.i, j = +el.dataset.j, f = el.dataset.f;
  const v = f === 'r' ? (parseNum(el.value) != null ? Math.round(parseNum(el.value)) : null) : parseNum(el.value);
  update((st) => {
    const it = st.active.items[i];
    const prev = it.sets[j][f];
    it.sets[j][f] = v;
    // Propage la charge aux séries suivantes non validées
    if (commit && f === 'w') {
      for (let k = j + 1; k < it.sets.length; k++) {
        const s = it.sets[k];
        if (!s.done && (s.w == null || s.w === prev)) s.w = v;
      }
    }
  }, { silent: true });
  if (commit && f === 'w') {
    const st = getState();
    const it = st.active.items[i];
    document.querySelectorAll(`[data-in="set"][data-i="${i}"][data-f="w"]`).forEach((inp) => {
      const k = +inp.dataset.j;
      if (k > j && document.activeElement !== inp) inp.value = inVal(it.sets[k].w);
    });
  }
}

actions['set-check'] = (el) => {
  unlockAudio();
  const i = +el.dataset.i, j = +el.dataset.j;
  const cur = getState().active.items[i];
  const s0 = cur.sets[j];
  if (!s0.done && EX[cur.exId].track === 'wr' && s0.w == null && cur.sug.weight == null) {
    toast('Indique la charge utilisée (kg)');
    document.querySelector(`[data-in="set"][data-i="${i}"][data-j="${j}"][data-f="w"]`)?.focus();
    return;
  }
  let rest = 0;
  update((st) => {
    const it = st.active.items[i];
    const s = it.sets[j];
    if (s.done) { s.done = false; return; }
    const ex = EX[it.exId];
    if (s.r == null) s.r = it.sug.reps ?? it.target.reps[1];
    if (s.w == null && it.sug.weight != null && ex.track !== 'time' && ex.track !== 'cardio') s.w = it.sug.weight;
    s.done = true;
    for (let k = j + 1; k < it.sets.length; k++) if (!it.sets[k].done && it.sets[k].w == null) it.sets[k].w = s.w;
    const isLast = st.active.items.every((x) => x.sets.every((y) => y.done));
    rest = isLast ? 0 : it.target.rest || 0;
    st.active.restEnd = rest ? Date.now() + rest * 1000 : null;
    st.active.restTotal = rest;
    st.active.restBeeped = false;
  }, { silent: true });
  rerender();
  if (rest) startTicker();
};

actions['set-add'] = (el) => {
  const i = +el.dataset.i;
  update((st) => {
    const it = st.active.items[i];
    const last = it.sets[it.sets.length - 1];
    it.sets.push({ w: last?.w ?? it.sug.weight, r: null, km: null, done: false });
  }, { silent: true });
  rerender();
};
actions['set-remove'] = (el) => {
  const i = +el.dataset.i;
  update((st) => {
    const it = st.active.items[i];
    const idx = it.sets.map((s) => s.done).lastIndexOf(false);
    it.sets.splice(idx >= 0 ? idx : it.sets.length - 1, 1);
  }, { silent: true });
  rerender();
};

actions['pain'] = (el) => { update((st) => { st.active.pain = +el.dataset.v; }, { silent: true }); rerender(); };
actions['pain-reset'] = () => { update((st) => { st.active.pain = null; }, { silent: true }); rerender(); };

function swapItem(st, i, to) {
  const it = st.active.items[i];
  it.exId = to;
  it.sug = suggest(st, to, it.target, cycleInfo(st));
  it.sets = it.sets.map((s) => (s.done ? s : { w: it.sug.weight, r: null, km: null, done: false }));
}

actions['adapt-back'] = () => {
  let n = 0;
  update((st) => {
    st.active.items.forEach((it, i) => {
      const to = BACK_FRIENDLY[it.exId];
      if (to && EX[to] && !it.sets.some((s) => s.done)) { swapItem(st, i, to); n++; }
    });
  }, { silent: true });
  rerender();
  toast(n ? `${n} exercice${n > 1 ? 's' : ''} remplacé${n > 1 ? 's' : ''} par une variante douce` : 'Cette séance est déjà adaptée');
};

actions['ex-info'] = (el) => {
  const st = getState();
  openExerciseSheet(st, EX[st.active.items[+el.dataset.i].exId]);
};

actions['ex-swap'] = (el) => {
  const st = getState();
  const i = +el.dataset.i;
  const it = st.active.items[i];
  const cur = EX[it.exId];
  const orig = EX[it.origExId];
  const ids = [...new Set([it.origExId, ...(orig.alts || []), ...(cur.alts || []), ...Object.values(EX).filter((e) => e.group === orig.group).map((e) => e.id)])]
    .filter((id) => id !== it.exId && EX[id].track !== 'cardio');
  openSheet(`
    <div class="sheet-head"><h3 class="h3">Remplacer « ${esc(cur.name)} »</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
    <p class="sub small" style="margin-bottom:10px">Machine occupée, gêne ou préférence : choisis une alternative.</p>
    <label class="option" style="margin-bottom:12px"><input type="checkbox" id="swap-perm" style="width:20px;height:20px;accent-color:var(--accent)"><div><b>Toujours dans le programme</b><small>Remplace aussi cet exercice pour les prochaines séances</small></div></label>
    <div class="list">${ids.map((id) => `
      <button class="list-item" data-act="do-swap" data-i="${i}" data-to="${id}">${thumb(EX[id])}<div class="grow"><div class="t">${esc(EX[id].name)}${id === it.origExId ? ' <span class="tag">programme</span>' : ''}</div><div class="s">${esc(EX[id].equipment)}</div></div>${ICON.chev}</button>`).join('')}
    </div>`);
};
actions['do-swap'] = (el) => {
  const i = +el.dataset.i, to = el.dataset.to;
  const perm = document.getElementById('swap-perm')?.checked;
  update((st) => {
    const it = st.active.items[i];
    if (perm) { if (to === it.origExId) delete st.subs[it.origExId]; else st.subs[it.origExId] = to; }
    swapItem(st, i, to);
  }, { silent: true });
  closeSheet();
  rerender();
  toast(`Remplacé par ${EX[to].name}`);
};

actions['wk-minimize'] = () => { releaseWake(); location.hash = '#/today'; };

actions['wk-discard'] = async () => {
  if (await confirmSheet({ title: 'Abandonner la séance ?', text: 'Les séries saisies ne seront pas enregistrées.', ok: 'Abandonner', danger: true })) {
    update((st) => { st.active = null; }, { silent: true });
    releaseWake();
    location.hash = '#/today';
  }
};

actions['wk-finish'] = async () => {
  const st = getState();
  const a = st.active;
  const { done, total } = counts(a);
  if (!done) {
    if (await confirmSheet({ title: 'Aucune série validée', text: 'Veux-tu abandonner cette séance ?', ok: 'Abandonner', danger: true })) {
      update((s) => { s.active = null; }, { silent: true });
      releaseWake();
      location.hash = '#/today';
    }
    return;
  }
  if (done < total && !(await confirmSheet({ title: 'Terminer la séance ?', text: `${total - done} série${total - done > 1 ? 's' : ''} non validée${total - done > 1 ? 's' : ''} ne ser${total - done > 1 ? 'ont' : 'a'} pas enregistrée${total - done > 1 ? 's' : ''}.`, ok: 'Terminer' }))) return;
  const session = {
    id: a.id, templateId: a.templateId, name: a.name, date: a.date, start: a.start, end: Date.now(),
    pain: a.pain, rir: a.rir, deload: a.deload, notes: '',
    items: a.items.map((it) => ({ exId: it.exId, origExId: it.origExId, target: it.target, sets: it.sets.filter((s) => s.done).map(({ w, r, km }) => ({ w, r, km, done: true })) })).filter((it) => it.sets.length),
  };
  const prs = findPRs(st, session);
  update((s) => { s.sessions.push(session); s.active = null; }, { silent: true });
  releaseWake();
  navigate('#/today', () => showSummary(session, prs));
};

function showSummary(session, prs) {
  const stats = sessionStats(session);
  openSheet(`
    <div class="summary-hero"><div class="emoji">${prs.length ? '🏆' : '💪'}</div><h2>Séance terminée !</h2><p class="sub">${esc(session.name)} · bravo pour la régularité.</p></div>
    <div class="grid3" style="margin-top:14px">
      <div class="stat"><div class="k">Durée</div><div class="v" style="font-size:20px">${fmtDuration(stats.duration)}</div></div>
      <div class="stat"><div class="k">Séries</div><div class="v" style="font-size:20px">${stats.sets}</div></div>
      <div class="stat"><div class="k">Volume</div><div class="v" style="font-size:20px">${fmt(stats.volume / 1000, 1)}<small>t</small></div></div>
    </div>
    ${prs.length ? `<h3 class="h2">Nouveaux records</h3>${prs.map((p) => `<div class="pr"><span class="trophy">🏆</span><div class="grow"><b>${esc(EX[p.exId].name)}</b><div class="small muted">1RM estimé ${fmt(p.value)} kg (avant ${fmt(p.before)} kg)</div></div></div>`).join('')}` : ''}
    <label class="field" style="margin-top:18px"><span>Notes (sensations, douleurs, réglages machine…)</span><textarea class="input" id="sess-notes" placeholder="Facultatif"></textarea></label>
    <div class="callout accent" style="margin-top:14px">${ICON.heart}<div>Pense à tes protéines dans les heures qui suivent et à ton objectif de pas aujourd’hui.</div></div>
    <button class="btn block" data-act="close-sheet" style="margin-top:16px">Fermer</button>
  `, {
    onClose: () => {
      const notes = document.getElementById('sess-notes')?.value?.trim();
      if (notes) update((st) => { const s = st.sessions.find((x) => x.id === session.id); if (s) s.notes = notes; });
    },
  });
}

// ── Minuteur de repos ──
let ticker = null;
export function startTicker() {
  if (!ticker) ticker = setInterval(tick, 250);
  tick();
}
function tick() {
  const st = getState();
  const a = st.active;
  const elapsedEl = document.querySelector('[data-elapsed]');
  if (elapsedEl && a) elapsedEl.textContent = fmtClock((Date.now() - a.start) / 1000);
  let bar = document.getElementById('rest');
  if (!a || !a.restEnd || !location.hash.startsWith('#/workout')) {
    bar?.remove();
    if (!a) { clearInterval(ticker); ticker = null; }
    return;
  }
  const left = (a.restEnd - Date.now()) / 1000;
  if (left <= 0 && !a.restBeeped) {
    a.restBeeped = true;
    if (st.prefs.sound !== false) beep(3); else navigator.vibrate?.(300);
  }
  if (left < -20) {
    update((s) => { s.active.restEnd = null; }, { silent: true });
    bar?.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'rest';
    bar.className = 'rest';
    bar.innerHTML = `
      <div class="grow"><div class="lbl" data-l>Repos</div><div class="time" data-t></div><div class="bar"><div data-b></div></div></div>
      <button data-act="rest-adj" data-d="-15" aria-label="Moins 15 secondes">−15</button>
      <button data-act="rest-adj" data-d="15" aria-label="Plus 15 secondes">+15</button>
      <button data-act="rest-skip">Passer</button>`;
    document.body.appendChild(bar);
  }
  bar.classList.toggle('over', left <= 0);
  bar.querySelector('[data-t]').textContent = left > 0 ? fmtClock(Math.ceil(left)) : 'Go !';
  bar.querySelector('[data-l]').textContent = left > 0 ? 'Repos' : 'Série suivante';
  bar.querySelector('[data-b]').style.width = `${Math.max(0, Math.min(100, (left / (a.restTotal || 1)) * 100))}%`;
}
actions['rest-adj'] = (el) => {
  update((st) => {
    const a = st.active;
    a.restEnd = Math.max(Date.now() + 1000, a.restEnd + +el.dataset.d * 1000);
    a.restTotal = Math.max(a.restTotal, (a.restEnd - Date.now()) / 1000);
    a.restBeeped = false;
  }, { silent: true });
  tick();
};
actions['rest-skip'] = () => {
  update((st) => { st.active.restEnd = null; }, { silent: true });
  tick();
};

// ── Chrono de maintien (planche, portage…) ──
actions['hold'] = (el) => {
  unlockAudio();
  const i = +el.dataset.i;
  const st = getState();
  const it = st.active.items[i];
  const ex = EX[it.exId];
  const j = it.sets.findIndex((s) => !s.done);
  if (j < 0) { toast('Toutes les séries sont validées'); return; }
  const mult = ex.track === 'cardio' ? 60 : 1;
  const target = (it.sets[j].r || it.sug.reps || it.target.reps[0]) * mult;
  const show = (sec) => (mult === 60 ? fmtClock(sec) : String(sec));
  const C = 2 * Math.PI * 94;
  let phase = 'ready', t0 = 0, raf = 0, finished = false, side = 1;
  openSheet(`
    <div class="sheet-head"><h3 class="h3">${esc(ex.name)} · série ${j + 1}</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.x}</button></div>
    ${ex.perSide ? '<p class="sub small" style="text-align:center">Côté gauche puis côté droit, avec 5 s pour changer.</p>' : ''}
    <div class="ring" style="margin-top:12px"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="94"/><circle class="fg" cx="110" cy="110" r="94" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><div class="t" data-t>${show(target)}</div></div>
    <p class="sub" style="text-align:center;margin-top:8px" data-msg>Objectif : ${target / mult} ${unitOf(ex)}${ex.perSide ? ' par côté' : ''}</p>
    <div class="grid2" style="margin-top:16px">
      <button class="btn secondary" data-stop>Valider maintenant</button>
      <button class="btn" data-go>Démarrer</button>
    </div>`, {
    onMount: (s) => {
      const tEl = s.querySelector('[data-t]'), fg = s.querySelector('.fg'), msg = s.querySelector('[data-msg]');
      const go = s.querySelector('[data-go]'), stop = s.querySelector('[data-stop]');
      const loop = () => {
        if (!s.isConnected) return;
        const el = (performance.now() - t0) / 1000;
        if (phase === 'count') {
          const c = 3 - Math.floor(el);
          tEl.textContent = c > 0 ? c : '';
          if (el >= 3) { phase = 'hold'; t0 = performance.now(); beep(1); msg.textContent = 'Tiens bon, respire calmement'; }
        } else if (phase === 'hold') {
          const left = target - el;
          tEl.textContent = show(Math.max(0, Math.ceil(left)));
          fg.style.strokeDashoffset = String(C * Math.min(1, el / target));
          if (left <= 0 && ex.perSide && side === 1) {
            side = 2; phase = 'switch'; t0 = performance.now(); beep(2);
            msg.textContent = 'Change de côté !';
            fg.style.strokeDashoffset = '0';
          } else if (left <= 0 && !finished) { finished = true; beep(3); validate(target); return; }
        } else if (phase === 'switch') {
          const c = 5 - Math.floor(el);
          tEl.textContent = c > 0 ? c : '';
          if (el >= 5) { phase = 'hold'; t0 = performance.now(); beep(1); msg.textContent = 'Deuxième côté, tiens bon'; }
        }
        raf = requestAnimationFrame(loop);
      };
      go.onclick = () => {
        if (phase !== 'ready') return;
        phase = 'count'; t0 = performance.now(); msg.textContent = 'Mets-toi en position…'; go.disabled = true;
        raf = requestAnimationFrame(loop);
      };
      stop.onclick = () => {
        const secs = phase === 'hold' ? Math.round((performance.now() - t0) / 1000) : target;
        validate(Math.max(1, secs));
      };
      const validate = (secs) => {
        cancelAnimationFrame(raf);
        update((st2) => {
          const s2 = st2.active.items[i].sets[j];
          s2.r = mult === 60 ? Math.max(1, Math.round(secs / 60)) : secs;
          s2.done = true;
          const rest = it.target.rest || 0;
          st2.active.restEnd = rest ? Date.now() + rest * 1000 : null;
          st2.active.restTotal = rest;
          st2.active.restBeeped = false;
        }, { silent: true });
        closeSheet();
        rerender();
        startTicker();
      };
    },
    onClose: () => cancelAnimationFrame(raf),
  });
};
