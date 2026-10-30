// Moteur d'illustration : silhouette articulée en vue de profil (cinématique directe).
// Convention d'angle (degrés, repère SVG) : 0 = vers le bas, 90 = vers l'avant (droite),
// 180 = vers le haut, -90 = vers l'arrière (gauche). Le personnage regarde vers la droite.

const L = { torso: 52, neck: 4, head: 10, uArm: 30, fArm: 27, thigh: 42, shin: 40, foot: 13 };
const GROUND = 180;
const rad = (d) => (d * Math.PI) / 180;
const add = (p, a, len) => [p[0] + Math.sin(rad(a)) * len, p[1] + Math.cos(rad(a)) * len];
const lerp = (a, b, t) => a + (b - a) * t;

function lerpPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[k] ?? b[k];
    const vb = b[k] ?? a[k];
    if (typeof va === 'number') out[k] = lerp(va, vb, t);
    else if (Array.isArray(va)) out[k] = va.map((v, i) => lerp(v, vb[i], t));
    else if (va && typeof va === 'object') out[k] = lerpPose(va, vb, t);
  }
  return out;
}

// Calcule toutes les articulations pour une pose donnée.
export function solve(pose, ex = {}) {
  const off = ex.armsRel ? pose.torso - 180 : 0;
  const far = { ...pose, ...(pose.far || {}) };
  delete far.far;
  const J = {};
  J.hip = [0, 0];
  J.shoulder = add(J.hip, pose.torso, L.torso);
  const headA = pose.head ?? pose.torso;
  J.neck = add(J.shoulder, headA, L.neck);
  J.head = add(J.shoulder, headA, L.neck + L.head);
  // Pédalier : les jambes suivent les pédales par cinématique inverse (hanche ancrée).
  const crank = ex.fig?.crank;
  if (crank && pose.crank != null && ex.anchor?.joint === 'hip') {
    const ik = (src, ang) => {
      const t = [crank.c[0] + crank.r * Math.cos(rad(ang)) - ex.anchor.at[0], crank.c[1] + crank.r * Math.sin(rad(ang)) - ex.anchor.at[1]];
      const d = Math.min(Math.hypot(t[0], t[1]), L.thigh + L.shin - 0.5);
      const a0 = (Math.atan2(t[0], t[1]) * 180) / Math.PI;
      const cosA = (L.thigh ** 2 + d * d - L.shin ** 2) / (2 * L.thigh * d);
      src.thigh = a0 + (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
      const k = add([0, 0], src.thigh, L.thigh);
      src.shin = (Math.atan2(t[0] - k[0], t[1] - k[1]) * 180) / Math.PI;
      src.foot = src.shin + 90;
    };
    pose = { ...pose };
    ik(pose, pose.crank);
    ik(far, pose.crank + 180);
  }
  const limbs = (src, pre) => {
    const uA = src.uArm + off;
    const fA = src.fArm + off;
    J[pre + 'elbow'] = add(J.shoulder, uA, L.uArm);
    J[pre + 'hand'] = add(J[pre + 'elbow'], fA, L.fArm);
    J[pre + 'knee'] = add(J.hip, src.thigh, L.thigh);
    J[pre + 'ankle'] = add(J[pre + 'knee'], src.shin, L.shin);
    J[pre + 'toe'] = add(J[pre + 'ankle'], src.foot ?? 90, L.foot);
  };
  limbs(pose, '');
  limbs(far, 'far');
  // Ancrage : soit une position de hanche explicite, soit une articulation fixée.
  let dx = 0, dy = 0;
  if (ex.anchor) {
    const j = J[ex.anchor.joint];
    dx = ex.anchor.at[0] - j[0];
    dy = ex.anchor.at[1] - j[1];
  } else if (pose.hip) {
    dx = pose.hip[0];
    dy = pose.hip[1];
  }
  for (const k in J) J[k] = [J[k][0] + dx, J[k][1] + dy];
  return J;
}

const f = (n) => Math.round(n * 10) / 10;
const line = (a, b, cls, w) =>
  `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" class="${cls}"${w ? ` stroke-width="${w}"` : ''}/>`;
const poly = (pts, cls, w) =>
  `<polyline points="${pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" class="${cls}"${w ? ` stroke-width="${w}"` : ''}/>`;

// Décalage latéral d'un segment (côté "dos" pour le tronc, côté "avant" pour les membres).
function sideSeg(a, b, from, to, offset) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = dy / len, ny = -dx / len;
  const p = (t) => [a[0] + dx * t + nx * offset, a[1] + dy * t + ny * offset];
  return [p(from), p(to)];
}

const MUSCLES = {
  lowback: (J) => sideSeg(J.hip, J.shoulder, 0.08, 0.5, 5),
  upperback: (J) => sideSeg(J.hip, J.shoulder, 0.55, 0.92, 5),
  lats: (J) => sideSeg(J.hip, J.shoulder, 0.35, 0.85, 5),
  chest: (J) => sideSeg(J.hip, J.shoulder, 0.6, 0.9, -5),
  abs: (J) => sideSeg(J.hip, J.shoulder, 0.1, 0.6, -5),
  core: (J) => sideSeg(J.hip, J.shoulder, 0.1, 0.65, 0),
  quads: (J) => sideSeg(J.hip, J.knee, 0.15, 0.85, 2.6),
  hams: (J) => sideSeg(J.hip, J.knee, 0.15, 0.85, -2.6),
  calves: (J) => sideSeg(J.knee, J.ankle, 0.12, 0.6, -2.4),
  biceps: (J) => sideSeg(J.shoulder, J.elbow, 0.2, 0.85, 2),
  triceps: (J) => sideSeg(J.shoulder, J.elbow, 0.2, 0.85, -2),
  forearms: (J) => sideSeg(J.elbow, J.hand, 0.1, 0.7, 0),
};

function drawEquipment(eq, J, layer) {
  let s = '';
  for (const e of eq) {
    if ((e.layer || 'back') !== layer) continue;
    const at = e.at ? J[e.at] : null;
    switch (e.t) {
      case 'barbell':
        s += `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="${e.r || 19}" class="eq-plate"/>`;
        s += `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="3" class="eq-solid"/>`;
        break;
      case 'dumbbell':
        s += `<rect x="${f(at[0] - 9)}" y="${f(at[1] - 5.5)}" width="18" height="11" rx="3" class="eq-db"/>`;
        break;
      case 'handle':
        s += `<circle cx="${f(at[0])}" cy="${f(at[1])}" r="4" class="eq-solid"/>`;
        break;
      case 'pad':
        s += `<circle cx="${f(at[0] + (e.dx || 0))}" cy="${f(at[1] + (e.dy || 0))}" r="${e.r || 6}" class="eq-pad"/>`;
        break;
      case 'platform': {
        const c = [at[0] + (e.dx || 0), at[1] + (e.dy || 0)];
        const a = add(c, e.angle, 22), b = add(c, e.angle + 180, 22);
        s += line(a, b, 'eq-line', 5);
        break;
      }
      case 'cable': {
        const to = J[e.to];
        s += line(e.from, to, 'eq-cable');
        s += `<circle cx="${e.from[0]}" cy="${e.from[1]}" r="5" class="eq-pulley"/>`;
        break;
      }
      case 'bench': {
        const h = e.h || 7;
        s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${h}" rx="3" class="eq-bench"/>`;
        if (e.legs !== false) {
          s += line([e.x + 8, e.y + h], [e.x + 8, GROUND], 'eq-line', 4);
          s += line([e.x + e.w - 8, e.y + h], [e.x + e.w - 8, GROUND], 'eq-line', 4);
        }
        break;
      }
      case 'rect':
        s += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="${e.rx ?? 3}" class="eq-bench"/>`;
        break;
      case 'line':
        s += poly(e.pts, e.thin ? 'eq-cable' : 'eq-line', e.w || 4);
        break;
      case 'lever': // bras de machine : d'un pivot fixe jusqu'à une articulation
        s += line(e.from, J[e.to], 'eq-line', e.w || 6);
        s += `<circle cx="${e.from[0]}" cy="${e.from[1]}" r="${(e.w || 6) * 0.8}" class="eq-pulley"/>`;
        break;
      case 'jline': { // coussin qui suit un segment du corps (dossier, appui poitrine…)
        const [p1, p2] = sideSeg(J[e.a], J[e.b], e.from ?? 0, e.to ?? 1, e.off || 0);
        s += line(p1, p2, e.cls || 'eq-bench-line', e.w || 8);
        break;
      }
      case 'circle':
        s += `<circle cx="${e.x}" cy="${e.y}" r="${e.r}" class="${e.cls || 'eq-pulley'}"/>`;
        break;
    }
  }
  return s;
}

export function renderSVG(ex, pose) {
  const J = solve(pose, ex);
  const fig = ex.fig || {};
  const eq = fig.eq || [];
  const hl = new Set(ex.highlight || []);
  let s = '';
  if (fig.ground !== false) s += line([8, GROUND + 2], [232, GROUND + 2], 'ground');
  s += drawEquipment(eq, J, 'back');
  // Membres côté opposé (plus clairs)
  s += poly([J.hip, J.farknee, J.farankle, J.fartoe], 'limb far', 11);
  s += poly([J.shoulder, J.farelbow, J.farhand], 'limb far', 9);
  s += drawEquipment(eq, J, 'mid');
  // Tronc + tête
  if (pose.spine) {
    const [c] = sideSeg(J.hip, J.shoulder, 0.5, 0.5, pose.spine);
    s += `<path d="M${f(J.hip[0])},${f(J.hip[1])} Q${f(c[0])},${f(c[1])} ${f(J.shoulder[0])},${f(J.shoulder[1])}" class="limb body" stroke-width="19"/>`;
  } else s += line(J.hip, J.shoulder, 'limb body', 19);
  s += `<circle cx="${f(J.head[0])}" cy="${f(J.head[1])}" r="${L.head}" class="head"/>`;
  // Membres côté proche
  s += poly([J.hip, J.knee, J.ankle, J.toe], 'limb body', 11);
  s += drawEquipment(eq, J, 'front');
  s += poly([J.shoulder, J.elbow, J.hand], 'limb body', 9);
  // Muscles sollicités
  for (const m of hl) {
    if (m === 'glutes') {
      const [a] = sideSeg(J.hip, J.shoulder, 0, 0, 6);
      s += `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="5" class="muscle-dot"/>`;
    } else if (m === 'shoulders') {
      s += `<circle cx="${f(J.shoulder[0])}" cy="${f(J.shoulder[1])}" r="4.5" class="muscle-dot"/>`;
    } else if (MUSCLES[m]) {
      const [a, b] = MUSCLES[m](J);
      s += line(a, b, 'muscle', m === 'core' ? 6 : 4);
    }
  }
  s += drawEquipment(eq, J, 'top');
  return s;
}

const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function poseAt(ex, phase) {
  // phase ∈ [0,1) sur un cycle complet aller-retour entre les images clés.
  const P = ex.fig.poses;
  if (P.length === 1) return P[0];
  phase = ((phase % 1) + 1) % 1;
  if (ex.fig.loop === 'linear') return lerpPose(P[0], P[1], phase);
  if (ex.fig.loop === 'cycle') {
    const n = P.length;
    const x = phase * n;
    const i = Math.floor(x) % n;
    return lerpPose(P[i], P[(i + 1) % n], ease(x - Math.floor(x)));
  }
  const n = P.length - 1;
  const x = phase < 0.5 ? phase * 2 * n : (1 - phase) * 2 * n;
  const i = Math.min(Math.floor(x), n - 1);
  // Petite pause aux extrémités
  const local = Math.min(1, Math.max(0, ((x - i) - 0.08) / 0.84));
  return lerpPose(P[i], P[i + 1], ease(local));
}

// Vignette statique ; phase 0.5 = dernière image clé (position la plus parlante).
export function figureSVG(ex, { phase = 0.5, cls = '' } = {}) {
  const pose = poseAt(ex, phase);
  return `<svg class="figure ${cls}" viewBox="0 0 240 190" role="img" aria-label="${ex.name}">${renderSVG(ex, pose)}</svg>`;
}

// Animation en boucle ; s'arrête d'elle-même si l'élément quitte le DOM.
export function animateFigure(container, ex) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  container.innerHTML = `<svg class="figure" viewBox="0 0 240 190" role="img" aria-label="Illustration animée : ${ex.name}"></svg>`;
  const svg = container.firstElementChild;
  const period = ex.fig.dur || 3200;
  let start = performance.now();
  let paused = reduce;
  let pausedAt = reduce ? 0.5 : 0;
  const draw = (phase) => { svg.innerHTML = renderSVG(ex, poseAt(ex, phase)); };
  draw(pausedAt);
  const tick = (now) => {
    if (!svg.isConnected) return;
    if (!paused) draw(((now - start) % period) / period);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    toggle() {
      if (paused) { start = performance.now() - pausedAt * period; paused = false; }
      else { pausedAt = ((performance.now() - start) % period) / period; paused = true; }
      return !paused;
    },
    get playing() { return !paused; },
  };
}
