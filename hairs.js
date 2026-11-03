/* ==========================================================================
   Microblading hair strokes, shared by the brow simulator and the selfie try-on.

   What real microblading looks like (and what this draws):
   - every stroke is one fine, crisp hair line, a little thicker near the root and
     tapering to a point; brown, never black; skin shows between the strokes;
   - no outline and no fill: the edge of the brow is just where the strokes end;
   - front of the brow: short strokes that stand up, fanning, airy and lighter;
   - body: the lower row rises toward the tail, the upper row lies down onto it,
     and the two cross in the middle (the "feather" pattern);
   - tail: flat strokes that run along the brow and meet in a point;
   - a second, lighter and thinner set of strokes sits between the main ones.

   AKHairs.plan(edge, opts) -> hairs
     edge(u) gives { lo, up } (points on the lower and upper edge of the brow) for
     u = 0 at the front (by the nose) to u = 1 at the tail.
     opts: { width (px of a main stroke), seed, density (1 = normal) }
   AKHairs.draw(ctx, hairs, prog, opts)
     prog(i) -> 0..1, how much of hair i is drawn (default: all).
     opts: { color: [r,g,b], color2: [r,g,b], alpha: 1, xf: (p) => [x,y] }
   ========================================================================== */
window.AKHairs = (() => {
  'use strict';
  const R = Math.PI / 180;
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]), norm = (a) => mul(a, 1 / (len(a) || 1)), lerp = (a, b, t) => add(a, mul(sub(b, a), t));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  const plan = (edge, o = {}) => {
    let seed = o.seed || 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const jit = (k) => (rnd() - 0.5) * 2 * k;
    const W = o.width || 2, dens = o.density || 1;
    const at = (u) => {
      const e = edge(clamp(u, 0, 1)), e1 = edge(clamp(u - 0.01, 0, 1)), e2 = edge(clamp(u + 0.01, 0, 1));
      const m1 = lerp(e1.lo, e1.up, 0.5), m2 = lerp(e2.lo, e2.up, 0.5);
      return { lo: e.lo, up: e.up, th: len(sub(e.up, e.lo)), n: norm(sub(e.up, e.lo)), t: norm(sub(m2, m1)) };
    };
    // brow length and an average thickness, to space the strokes
    let Lb = 0, thSum = 0, prev = null;
    for (let i = 0; i <= 40; i++) { const g = at(i / 40), m = lerp(g.lo, g.up, 0.5); if (prev) Lb += len(sub(m, prev)); prev = m; thSum += g.th; }
    const thAvg = thSum / 41, gap = Math.max(W * 2.4, thAvg * 0.125) / dens; // px between neighbouring roots
    const du = gap / Lb;
    const hairs = [];
    const hair = (u, h0, angDeg, length, bend, tone, a, wk) => {
      const g = at(u), root = lerp(g.lo, g.up, h0);
      const ang = angDeg * R, d = norm(add(mul(g.t, Math.cos(ang)), mul(g.n, Math.sin(ang))));
      const tip = add(root, mul(d, length));
      // bend toward the tail (the part of the brow direction that is across the hair)
      const along = sub(g.t, mul(d, g.t[0] * d[0] + g.t[1] * d[1]));
      const c = add(lerp(root, tip, 0.5), mul(norm(along), length * bend));
      hairs.push({ u, root, c, tip, w: W * wk, tone, a });
    };
    // front: short, standing, fanning, airy
    for (let u = 0.004; u < 0.13; u += du * (0.9 + rnd() * 0.5)) {
      const g = at(u), k = u / 0.13;
      hair(u, 0.03 + rnd() * 0.3, 84 - k * 22 + jit(7), g.th * (0.42 + rnd() * 0.3), 0.06 + rnd() * 0.05, 0, 0.5 + k * 0.25 + rnd() * 0.12, 0.8 + rnd() * 0.15);
    }
    // body, lower row: rising toward the tail
    for (let u = 0.09; u < 0.86; u += du * (0.85 + rnd() * 0.4)) {
      const g = at(u), k = (u - 0.09) / 0.77, ang = 40 - k * 20 + jit(5), h0 = rnd() * 0.2, reach = 0.62 + rnd() * 0.26;
      hair(u, h0, ang, clamp(g.th * (reach - h0) / Math.sin(ang * R), g.th * 0.45, g.th * 2.3), 0.07 + rnd() * 0.05, 0, 0.72 + rnd() * 0.24, 0.9 + rnd() * 0.2);
    }
    // body, upper row: lying down onto the lower row, crossing it in the middle
    for (let u = 0.15; u < 0.9; u += du * (1.0 + rnd() * 0.45)) {
      const g = at(u), k = (u - 0.15) / 0.75, ang = -(28 - k * 14) + jit(5), h0 = 0.8 + rnd() * 0.18, reach = 0.36 + rnd() * 0.22;
      hair(u, h0, ang, clamp(g.th * (h0 - reach) / Math.sin(-ang * R), g.th * 0.45, g.th * 2.4), 0.05 + rnd() * 0.05, 0, 0.7 + rnd() * 0.24, 0.85 + rnd() * 0.2);
    }
    // tail: flat, along the brow, meeting in a point
    for (let u = 0.8; u < 0.985; u += du * (0.8 + rnd() * 0.35)) {
      const g = at(u), rest = (1 - u) * Lb;
      hair(u, 0.22 + rnd() * 0.56, jit(7) - 3, clamp(rest * (0.75 + rnd() * 0.3), g.th * 0.6, g.th * 2.2 + 4), 0.04 + rnd() * 0.04, 0, 0.75 + rnd() * 0.2, 0.75 + rnd() * 0.15);
    }
    // second set: lighter and thinner, in between
    for (let u = 0.05; u < 0.92; u += du * (1.25 + rnd() * 0.6)) {
      const g = at(u), h0 = 0.12 + rnd() * 0.72, k = clamp((u - 0.05) / 0.87, 0, 1);
      const ang = u < 0.12 ? 70 + jit(10) : h0 < 0.5 ? 34 - k * 16 + jit(6) : -(24 - k * 12) + jit(6);
      hair(u, h0, ang, g.th * (0.45 + rnd() * 0.35), 0.06 + rnd() * 0.05, 1, 0.5 + rnd() * 0.25, 0.6 + rnd() * 0.15);
    }
    // drawn from the front to the tail, the way a brow is worked
    const main = hairs.filter((h) => !h.tone).sort((a, b) => a.u - b.u), second = hairs.filter((h) => h.tone).sort((a, b) => a.u - b.u);
    return main.concat(second);
  };

  // a hair as a thin tapered shape: a little fuller near the root, a fine point at the tip
  const N = 12;
  const shape = (ctx, h, p, xf, sc) => {
    const q = (s) => { const m = 1 - s; return [m * m * h.root[0] + 2 * m * s * h.c[0] + s * s * h.tip[0], m * m * h.root[1] + 2 * m * s * h.c[1] + s * s * h.tip[1]]; };
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * p, a = q(s), b = q(Math.min(1, s + 0.02)), d = norm(sub(b, a)), nn = [-d[1], d[0]];
      const prof = s < 0.18 ? 0.55 + (s / 0.18) * 0.45 : 1 - Math.pow((s - 0.18) / 0.82, 1.5) * 0.9;
      const hw = (h.w * sc * prof) / 2;
      left.push(xf(add(a, mul(nn, hw / sc)))); right.push(xf(sub(a, mul(nn, hw / sc))));
    }
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
  };

  const draw = (ctx, hairs, prog, o = {}) => {
    const xf = o.xf || ((p) => p), sc = o.scale || 1, al = o.alpha == null ? 1 : o.alpha;
    const col = o.color || [96, 64, 46], col2 = o.color2 || [138, 104, 82];
    for (let i = 0; i < hairs.length; i++) {
      const p = prog ? prog(i) : 1;
      if (p <= 0) continue;
      const h = hairs[i], c = h.tone ? col2 : col;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(h.a * al).toFixed(3)})`;
      ctx.beginPath(); shape(ctx, h, p, xf, sc); ctx.fill();
    }
  };

  // where the tip of hair i is at progress p (for the pen)
  const point = (h, p) => { const m = 1 - p; return [m * m * h.root[0] + 2 * m * p * h.c[0] + p * p * h.tip[0], m * m * h.root[1] + 2 * m * p * h.c[1] + p * p * h.tip[1]]; };

  return { plan, draw, point };
})();
