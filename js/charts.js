// Graphiques SVG légers avec info-bulle au toucher.

import { fmt, fmtDate } from './logic.js';
import { parseDay } from './store.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || step0;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks, dec: step >= 1 ? 0 : step >= 0.1 ? 1 : 2 };
}

/**
 * Courbe temporelle.
 * points : [{ date: 'AAAA-MM-JJ', y, raw? }] — `raw` affiché en points discrets, `y` en ligne.
 */
export function lineChart(el, points, { unit = '', decimals = 1, height = 200, rawLabel = 'Mesure', lineLabel = 'Tendance', target = null } = {}) {
  if (!points.length) {
    el.innerHTML = `<div class="chart-empty">Pas encore de données</div>`;
    return;
  }
  const W = Math.max(280, el.clientWidth || 320);
  const H = height;
  const m = { t: 14, r: 12, b: 26, l: 40 };
  const xs = points.map((p) => parseDay(p.date).getTime());
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x1 - x0 < 6 * 86400000) { x0 -= 3 * 86400000; x1 += 3 * 86400000; }
  const vals = points.flatMap((p) => [p.y, p.raw].filter((v) => v != null));
  if (target != null) vals.push(target);
  let ymin = Math.min(...vals), ymax = Math.max(...vals);
  const pad = Math.max((ymax - ymin) * 0.12, Math.abs(ymax) * 0.02, 0.5);
  const { lo, hi, ticks, dec } = niceTicks(ymin - pad, ymax + pad);
  const X = (t) => m.l + ((t - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);

  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="chart" role="img">`;
  for (const t of ticks) {
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/>`;
    s += `<text x="${m.l - 6}" y="${Y(t) + 4}" class="axis" text-anchor="end">${fmt(t, dec)}</text>`;
  }
  // Repères de dates (3 max)
  const n = Math.min(3, points.length);
  for (let i = 0; i < n; i++) {
    const t = x0 + ((x1 - x0) * (n === 1 ? 0.5 : i / (n - 1)));
    const d = new Date(t);
    const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const anchor = n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    s += `<text x="${X(t)}" y="${H - 6}" class="axis" text-anchor="${anchor}">${label}</text>`;
  }
  if (target != null) {
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(target)}" y2="${Y(target)}" class="target"/>`;
    s += `<text x="${W - m.r}" y="${Y(target) - 5}" class="axis" text-anchor="end">Objectif ${fmt(target, decimals)}</text>`;
  }
  const raws = points.filter((p) => p.raw != null);
  for (const p of raws) s += `<circle cx="${X(parseDay(p.date).getTime())}" cy="${Y(p.raw)}" r="3" class="raw"/>`;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(parseDay(p.date).getTime()).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  s += `<path d="${path}" class="line"/>`;
  const lp = points[points.length - 1];
  s += `<circle cx="${X(parseDay(lp.date).getTime())}" cy="${Y(lp.y)}" r="4.5" class="dot"/>`;
  s += `<g class="hover" style="display:none"><line class="cross" y1="${m.t}" y2="${H - m.b}"/><circle r="5" class="dot"/></g>`;
  s += `<rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" class="hit"/>`;
  s += `</svg><div class="tip" hidden></div>`;
  el.innerHTML = s;
  el.classList.add('chart-wrap');

  const svg = el.querySelector('svg');
  const g = el.querySelector('.hover');
  const tip = el.querySelector('.tip');
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    let best = points[0], bd = Infinity;
    for (const p of points) {
      const d = Math.abs(X(parseDay(p.date).getTime()) - px);
      if (d < bd) { bd = d; best = p; }
    }
    const cx = X(parseDay(best.date).getTime());
    g.style.display = '';
    g.querySelector('line').setAttribute('x1', cx);
    g.querySelector('line').setAttribute('x2', cx);
    g.querySelector('circle').setAttribute('cx', cx);
    g.querySelector('circle').setAttribute('cy', Y(best.y));
    tip.hidden = false;
    tip.innerHTML = `<strong>${esc(fmtDate(best.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</strong>` +
      (best.raw != null ? `<span>${rawLabel} : ${fmt(best.raw, decimals)} ${unit}</span>` : '') +
      `<span>${lineLabel} : ${fmt(best.y, decimals)} ${unit}</span>`;
    const left = (cx / W) * r.width;
    tip.style.left = `${Math.min(Math.max(left, 70), r.width - 70)}px`;
  };
  const leave = () => { g.style.display = 'none'; tip.hidden = true; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', leave);
}

/** Histogramme simple : bars = [{ label, value, sub? }] */
export function barChart(el, bars, { unit = '', decimals = 0, height = 170 } = {}) {
  if (!bars.length || bars.every((b) => !b.value)) {
    el.innerHTML = `<div class="chart-empty">Pas encore de données</div>`;
    return;
  }
  const W = Math.max(280, el.clientWidth || 320);
  const H = height;
  const m = { t: 14, r: 8, b: 24, l: 8 };
  const max = Math.max(...bars.map((b) => b.value)) || 1;
  const bw = (W - m.l - m.r) / bars.length;
  const barW = Math.min(36, bw - 6);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="chart">`;
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}" class="grid"/>`;
  bars.forEach((b, i) => {
    const h = (b.value / max) * (H - m.t - m.b);
    const x = m.l + i * bw + (bw - barW) / 2;
    const y = H - m.b - h;
    const r = Math.min(4, h / 2);
    if (h > 0) s += `<path class="bar${i === bars.length - 1 ? ' current' : ''}" d="M${x},${H - m.b}V${y + r}Q${x},${y} ${x + r},${y}H${x + barW - r}Q${x + barW},${y} ${x + barW},${y + r}V${H - m.b}Z"><title>${esc(b.label)} : ${fmt(b.value, decimals)} ${unit}</title></path>`;
    s += `<text x="${x + barW / 2}" y="${H - 7}" class="axis" text-anchor="middle">${esc(b.label)}</text>`;
  });
  const lb = bars[bars.length - 1];
  if (lb.value) {
    const x = m.l + (bars.length - 1) * bw + bw / 2;
    const y = H - m.b - (lb.value / max) * (H - m.t - m.b) - 4;
    s += `<text x="${Math.min(x, W - 24)}" y="${Math.max(y, 11)}" class="axis strong" text-anchor="middle">${fmt(lb.value, decimals)}</text>`;
  }
  s += '</svg>';
  el.innerHTML = s;
}
