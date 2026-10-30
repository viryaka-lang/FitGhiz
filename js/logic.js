// Règles du programme : progression, suggestions de charge, nutrition, tendances.

import { EX } from './data/exercises.js';
import { PLANS, CYCLE, CARDIO } from './data/program.js';
import { today, daysBetween, parseDay, isoDay, uid } from './store.js';

// ── Formatage (fr-FR) ──
const nf = (d) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const fmt = (n, d = 1) => (n == null || isNaN(n) ? '–' : nf(d).format(n));
export const fmtSigned = (n, d = 1) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), d);
export const parseNum = (s) => {
  if (s == null || s === '') return null;
  const n = parseFloat(String(s).replace(',', '.').replace(/\s/g, ''));
  return isNaN(n) ? null : n;
};
export function fmtDate(s, opts = { day: 'numeric', month: 'short' }) {
  return parseDay(s).toLocaleDateString('fr-FR', opts);
}
export function fmtDuration(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}
export const fmtClock = (s) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const roundTo = (x, step) => Math.round(x / step) * step;

// ── Programme ──
export const planOf = (st) => PLANS[st.profile?.days || 3];

export function cycleInfo(st) {
  const start = st.planStart || today();
  const days = Math.max(0, daysBetween(start, today()));
  const weekAbs = Math.floor(days / 7);
  const c = CYCLE[weekAbs % CYCLE.length];
  return { ...c, cycle: Math.floor(weekAbs / CYCLE.length) + 1, weekAbs: weekAbs + 1 };
}

export function templateById(st, id) {
  return planOf(st).sessions.find((s) => s.id === id) || CARDIO.find((s) => s.id === id);
}

export function nextTemplate(st) {
  const plan = planOf(st);
  const ids = plan.sessions.map((s) => s.id);
  const last = [...st.sessions].reverse().find((s) => ids.includes(s.templateId));
  if (!last) return plan.sessions[0];
  return plan.sessions[(ids.indexOf(last.templateId) + 1) % ids.length];
}

export const resolveEx = (st, id) => (st.subs[id] && EX[st.subs[id]] ? st.subs[id] : id);

// ── Historique ──
export function lastPerf(st, exId, beforeTs = Infinity) {
  for (let i = st.sessions.length - 1; i >= 0; i--) {
    const s = st.sessions[i];
    if (s.start >= beforeTs) continue;
    const it = s.items.find((x) => x.exId === exId);
    if (it) {
      const sets = it.sets.filter((x) => x.done);
      if (sets.length) return { date: s.date, sets };
    }
  }
  return null;
}

export const e1rm = (w, r) => (w > 0 && r > 0 ? (r === 1 ? w : w * (1 + Math.min(r, 12) / 30)) : 0);

export function bestE1rm(sets) {
  return sets.reduce((m, s) => Math.max(m, e1rm(s.w, s.r)), 0);
}

// Série principale = la plus lourde (puis la plus longue).
function topSet(sets) {
  return sets.reduce((b, s) => (!b || (s.w || 0) > (b.w || 0) || ((s.w || 0) === (b.w || 0) && (s.r || 0) > (b.r || 0)) ? s : b), null);
}

// ── Suggestion de progression (double progression + RIR) ──
export function suggest(st, exId, item, cyc) {
  const ex = EX[exId];
  const [lo, hi] = item.reps;
  const last = lastPerf(st, exId);
  const out = { weight: null, reps: hi, note: '', trend: 'new', last };
  const unit = ex.track === 'time' || ex.track === 'wtime' ? 's' : ex.track === 'cardio' ? 'min' : 'rép.';

  if (!last) {
    out.reps = ex.track === 'time' || ex.track === 'wtime' || ex.track === 'cardio' ? lo : hi;
    out.note = ex.track === 'wr' || ex.track === 'wtime'
      ? `Première fois : choisis une charge qui laisse ~${cyc.rir} ${unit === 'rép.' ? 'répétitions' : 'secondes d’effort'} en réserve.`
      : 'Première fois : trouve ton niveau, sans forcer.';
    return out;
  }

  const sets = last.sets;
  const top = topSet(sets);
  const w = top.w || 0;
  const working = sets.filter((s) => (s.w || 0) >= w * 0.9);
  const allTop = working.length >= Math.min(item.sets, 2) && working.every((s) => (s.r || 0) >= hi);
  const lowCount = working.filter((s) => (s.r || 0) < lo).length;
  out.weight = w || null;
  out.reps = Math.min(hi, Math.max(lo, (top.r || lo) + 1));

  if (ex.track === 'cardio') {
    out.reps = Math.min(hi, (top.r || lo) + (top.r >= hi ? 0 : 5));
    out.note = top.r >= hi ? 'Durée max atteinte : augmente l’intensité (pente, vitesse).' : 'Ajoute ~5 min par rapport à la dernière fois.';
    out.trend = 'up';
    return out;
  }

  if (allTop) {
    if (ex.track === 'wr' || ex.track === 'wtime') {
      out.weight = roundTo(w + ex.inc, ex.inc >= 2.5 ? 1.25 : 0.5);
      out.reps = ex.track === 'wtime' ? lo : lo;
      out.note = `Haut de fourchette atteint : +${fmt(ex.inc)} kg 💪`;
    } else if (ex.track === 'time') {
      out.reps = hi;
      out.note = 'Objectif atteint : garde la durée et soigne la qualité, ou passe à une variante plus dure.';
    } else {
      out.reps = hi;
      out.note = w ? `Ajoute du lest : +${fmt(ex.inc || 2.5)} kg` : 'Objectif atteint : ralentis la descente (3 s) ou ajoute du lest.';
      if (w) out.weight = w + (ex.inc || 2.5);
    }
    out.trend = 'up';
  } else if (lowCount >= Math.ceil(working.length / 2) && w > 0 && ex.track === 'wr') {
    out.weight = roundTo(w * 0.95, 1.25);
    out.reps = lo;
    out.note = 'Séance précédente difficile : charge réduite de 5 % pour repartir.';
    out.trend = 'down';
  } else {
    out.note = ex.track === 'time' ? 'Même charge, essaie de tenir +5 s.' : 'Même charge, vise +1 répétition.';
    if (ex.track === 'time' || ex.track === 'wtime') out.reps = Math.min(hi, (top.r || lo) + 5);
    out.trend = 'same';
  }
  if (cyc.deload) {
    out.note = 'Décharge : même charge, moitié des séries, effort léger.';
    out.trend = 'deload';
  }
  return out;
}

export function warmupSets(ex, weight) {
  if (ex.track !== 'wr' || !weight || weight < 30 || !['squat', 'deadlift', 'bench', 'ohp', 'rdl', 'hip_thrust', 'barbell_row', 'good_morning'].includes(ex.id)) return null;
  const bar = 20;
  const steps = [[0, 10], [0.5, 5], [0.7, 3], [0.85, 1]];
  return steps
    .map(([p, r]) => [p === 0 ? bar : Math.max(bar, roundTo(weight * p, 2.5)), r])
    .filter(([w], i, a) => i === 0 || w > a[i - 1][0])
    .map(([w, r]) => `${fmt(w)} kg × ${r}`);
}

// Crée une séance en cours à partir d'un modèle.
export function buildWorkout(st, tpl) {
  const cyc = cycleInfo(st);
  const items = tpl.items.map((it, idx) => {
    const exId = resolveEx(st, it.ex);
    const sug = suggest(st, exId, it, cyc);
    const nSets = cyc.deload && it.tag !== 'warmup' && it.tag !== 'cardio' ? Math.max(1, Math.ceil(it.sets / 2)) : it.sets;
    return {
      key: idx,
      exId,
      origExId: it.ex,
      target: { sets: it.sets, reps: it.reps, rest: it.rest, tag: it.tag },
      sug,
      sets: Array.from({ length: nSets }, () => ({ w: sug.weight, r: null, km: null, done: false })),
    };
  });
  return {
    id: uid(),
    templateId: tpl.id,
    name: tpl.name,
    date: today(),
    start: Date.now(),
    pain: null,
    rir: cyc.rir,
    deload: !!cyc.deload,
    items,
    restEnd: null,
    restTotal: 0,
  };
}

export function sessionStats(s) {
  let volume = 0, sets = 0, reps = 0;
  for (const it of s.items) {
    const ex = EX[it.exId];
    for (const x of it.sets) {
      if (!x.done) continue;
      sets++;
      if (ex?.track === 'wr' || ex?.track === 'reps') {
        reps += x.r || 0;
        volume += (x.w || 0) * (x.r || 0) * (ex.perSide ? 2 : 1);
      }
    }
  }
  return { volume, sets, reps, duration: (s.end || Date.now()) - s.start };
}

// Records : meilleure 1RM estimée battue pendant cette séance.
export function findPRs(st, session) {
  const prs = [];
  for (const it of session.items) {
    const ex = EX[it.exId];
    if (ex?.track !== 'wr') continue;
    const now = bestE1rm(it.sets.filter((s) => s.done));
    if (!now) continue;
    let before = 0;
    for (const s of st.sessions) {
      if (s.id === session.id) continue;
      for (const x of s.items) if (x.exId === it.exId) before = Math.max(before, bestE1rm(x.sets.filter((y) => y.done)));
    }
    if (before > 0 && now > before + 0.01) prs.push({ exId: it.exId, value: now, before });
  }
  return prs;
}

// ── Nutrition ──
export const ACTIVITY = [
  { v: 1.2, label: 'Sédentaire', hint: 'Travail assis, < 5 000 pas/jour' },
  { v: 1.375, label: 'Légèrement actif', hint: '5 000–7 500 pas/jour + séances' },
  { v: 1.55, label: 'Actif', hint: '7 500–10 000 pas/jour + séances' },
  { v: 1.725, label: 'Très actif', hint: '> 10 000 pas/jour ou métier physique' },
];

export const RATES = [
  { v: 0.5, label: 'Progressif', hint: '0,5 % du poids / semaine — idéal pour garder la force' },
  { v: 0.75, label: 'Modéré', hint: '0,75 % / semaine' },
  { v: 1, label: 'Rapide', hint: '1 % / semaine — plus difficile à tenir' },
];

export function nutrition(profile, weight) {
  if (!profile || !weight) return null;
  const { sex, age, height, activity = 1.375, rate = 0.5, goalWeight } = profile;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'f' ? -161 : 5);
  const tdee = bmr * activity;
  const weeklyLoss = (weight * rate) / 100;
  const deficit = (weeklyLoss * 7700) / 7;
  const floor = Math.max(bmr, sex === 'f' ? 1200 : 1500);
  const kcal = Math.max(floor, tdee - deficit);
  const hm = height / 100;
  const bmi = weight / (hm * hm);
  // Poids de référence pour les protéines : on évite de surestimer en cas d'IMC élevé.
  const refW = Math.min(weight, Math.max(goalWeight || 0, 25 * hm * hm));
  const protein = 2 * refW;
  const fat = Math.max(0.7 * refW, (kcal * 0.25) / 9);
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal: roundTo(kcal, 10),
    deficit: Math.round(tdee - kcal),
    weeklyLoss,
    protein: roundTo(protein, 5),
    fat: roundTo(fat, 5),
    carbs: roundTo(carbs, 5),
    bmi,
    capped: tdee - deficit < floor,
  };
}

// ── Poids : moyenne mobile 7 jours + rythme hebdomadaire ──
export function weightTrend(weights) {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.map((w) => {
    const win = sorted.filter((x) => x.date <= w.date && daysBetween(x.date, w.date) < 7);
    return { ...w, avg: win.reduce((s, x) => s + x.kg, 0) / win.length };
  });
}

export function weeklyRate(trend) {
  if (trend.length < 3) return null;
  const last = trend[trend.length - 1].date;
  const pts = trend.filter((t) => daysBetween(t.date, last) <= 21);
  const span = daysBetween(pts[0].date, last);
  if (pts.length < 3 || span < 10) return null;
  const xs = pts.map((p) => daysBetween(pts[0].date, p.date));
  const ys = pts.map((p) => p.avg);
  const mx = xs.reduce((a, b) => a + b) / xs.length;
  const my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return den ? (num / den) * 7 : null;
}

export const latestWeight = (st) => {
  const w = [...st.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  return w.length ? w[w.length - 1].kg : null;
};

// ── Régularité ──
export function streakWeeks(st) {
  // Nombre de semaines consécutives (jusqu'à cette semaine) avec ≥ 1 séance.
  const weekKey = (d) => {
    const x = parseDay(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return isoDay(x);
  };
  const weeks = new Set(st.sessions.map((s) => weekKey(s.date)));
  let n = 0;
  const cur = parseDay(weekKey(today()));
  if (!weeks.has(isoDay(cur))) cur.setDate(cur.getDate() - 7);
  while (weeks.has(isoDay(cur))) { n++; cur.setDate(cur.getDate() - 7); }
  return n;
}

export function sessionsThisWeek(st) {
  const d = new Date();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const m = isoDay(monday);
  return st.sessions.filter((s) => s.date >= m && !CARDIO.some((c) => c.id === s.templateId)).length;
}
