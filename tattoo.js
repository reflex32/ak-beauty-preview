/* ==========================================================================
   Tattoo removal: a fine-line tattoo is drawn on skin, then a soft light passes
   over it and the ink lifts off as rose-gold dust, leaving clean skin. Loops
   while the section is on screen.
   ========================================================================== */
(() => {
  'use strict';
  const cv = document.getElementById('ttCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');

  /* ---------- the tattoo, in a 300 x 375 design space ---------- */
  const DW = 300, DH = 375;
  const tattoo = () => {
    const p = new Path2D();
    // stem
    p.moveTo(150, 335); p.bezierCurveTo(147, 285, 154, 235, 150, 190); p.bezierCurveTo(147, 160, 152, 135, 150, 112);
    // leaves, alternating, smaller toward the top
    [[300, 1, 1], [270, -1, 0.95], [238, 1, 0.85], [206, -1, 0.75], [176, 1, 0.62]].forEach(([y, d, k]) => {
      const X = (dx) => 150 + d * dx * k, Y = (dy) => y - dy * k;
      p.moveTo(150, y); p.bezierCurveTo(X(18), Y(4), X(48), Y(18), X(62), Y(40)); p.bezierCurveTo(X(40), Y(42), X(14), Y(30), 150, y);
      p.moveTo(150, y); p.quadraticCurveTo(X(30), Y(17), X(50), Y(32)); // vein
    });
    // blossom
    const c = [150, 92];
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72) * Math.PI / 180, P = (r, o) => [c[0] + r * Math.cos(a + o), c[1] + r * Math.sin(a + o)];
      const t = P(30, 0), a1 = P(18, -0.55), a2 = P(33, -0.22), b1 = P(33, 0.22), b2 = P(18, 0.55);
      p.moveTo(c[0], c[1]); p.bezierCurveTo(a1[0], a1[1], a2[0], a2[1], t[0], t[1]); p.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], c[0], c[1]);
    }
    p.moveTo(154, 92); p.arc(150, 92, 4, 0, Math.PI * 2);
    return p;
  };
  const DOTS = [[212, 118, 2.4], [224, 134, 1.8], [88, 150, 2.2], [80, 166, 1.6]];

  /* ---------- layers: skin (once), ink (once per size), particles ---------- */
  let W = 0, H = 0, DPR = 1, skin = null, ink = null, parts = [];
  const layer = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const build = () => {
    const r = cv.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1);
    W = Math.round(r.width * DPR); H = Math.round(r.height * DPR);
    if (!W || !H) return false;
    cv.width = W; cv.height = H;
    // skin: warm base, soft light from the top, fine grain
    skin = layer(); const s = skin.getContext('2d');
    let g = s.createRadialGradient(W * 0.42, H * 0.38, W * 0.05, W * 0.5, H * 0.55, W * 0.95);
    g.addColorStop(0, '#f0cfb7'); g.addColorStop(0.55, '#e3b393'); g.addColorStop(1, '#c98f6f');
    s.fillStyle = g; s.fillRect(0, 0, W, H);
    g = s.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, W * 0.7);
    g.addColorStop(0, 'rgba(255, 244, 236, .45)'); g.addColorStop(1, 'rgba(255, 244, 236, 0)');
    s.fillStyle = g; s.fillRect(0, 0, W, H);
    const n = s.getImageData(0, 0, W, H), d = n.data; let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < d.length; i += 4) { const v = (rnd() - 0.5) * 14; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    s.putImageData(n, 0, 0);
    s.strokeStyle = 'rgba(150, 90, 65, .07)'; s.lineWidth = 1 * DPR; // a few faint skin lines
    for (let i = 0; i < 5; i++) { const y = H * (0.2 + i * 0.16); s.beginPath(); s.moveTo(-10, y); s.bezierCurveTo(W * 0.3, y - 10 * DPR, W * 0.7, y + 12 * DPR, W + 10, y - 4 * DPR); s.stroke(); }
    // ink
    ink = layer(); const k = ink.getContext('2d');
    const sc = Math.min(W / DW, H / DH) * 0.92, ox = (W - DW * sc) / 2, oy = (H - DH * sc) / 2;
    k.setTransform(sc, 0, 0, sc, ox, oy);
    k.strokeStyle = 'rgba(38, 36, 48, .92)'; k.lineWidth = 2.1; k.lineCap = 'round'; k.lineJoin = 'round';
    k.stroke(tattoo());
    k.fillStyle = 'rgba(38, 36, 48, .92)'; DOTS.forEach(([x, y, r]) => { k.beginPath(); k.arc(x, y, r, 0, Math.PI * 2); k.fill(); });
    k.setTransform(1, 0, 0, 1, 0, 0);
    // particles: one per inked 2x2 cell
    parts = []; const id = k.getImageData(0, 0, W, H).data, st = Math.max(2, Math.round(DPR * 1.5));
    for (let y = 0; y < H; y += st) for (let x = 0; x < W; x += st) {
      if (id[(y * W + x) * 4 + 3] > 90) parts.push({ x, y, vx: (rnd() - 0.5) * 26 * DPR, vy: -(18 + rnd() * 46) * DPR, life: 1 + rnd() * 0.8, sz: (1 + rnd() * 1.2) * DPR, ph: rnd() * 6 });
    }
    return true;
  };

  /* ---------- the loop ---------- */
  const T = 8; // seconds per cycle
  const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  const lerp = (a, b, t) => a + (b - a) * t;
  let raf = 0, t0 = 0, visible = false;
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    if (!t0) t0 = now;
    const t = ((now - t0) / 1000) % T;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(skin, 0, 0);
    const bw = W * 0.22;
    if (t < 1.4) { // drawn from the bottom up, with a little light at the needle
      const y = lerp(H, 0, ease(t / 1.4));
      ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, H - y); ctx.clip(); ctx.drawImage(ink, 0, 0); ctx.restore();
      const g = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, W * 0.35);
      g.addColorStop(0, 'rgba(255, 236, 222, .35)'); g.addColorStop(1, 'rgba(255, 236, 222, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, y - W * 0.35, W, W * 0.7);
    } else if (t < 2.4) {
      ctx.drawImage(ink, 0, 0);
    } else if (t < 6.4) { // the light passes right to left; the ink behind it lifts away
      const p = Math.min(1, (t - 2.4) / 2.6), bx = lerp(W + bw, -bw, p);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, bx), H); ctx.clip(); ctx.drawImage(ink, 0, 0); ctx.restore();
      const g = ctx.createLinearGradient(bx - bw, 0, bx + bw, 0);
      g.addColorStop(0, 'rgba(255, 228, 210, 0)'); g.addColorStop(0.5, 'rgba(255, 228, 210, .5)'); g.addColorStop(1, 'rgba(255, 228, 210, 0)');
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(bx - bw, 0, bw * 2, H); ctx.globalCompositeOperation = 'source-over';
      const speed = (W + bw * 2) / 2.6;
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        if (q.x < bx) continue;
        const age = (q.x - bx) / speed; // seconds since the light passed this grain
        if (age > q.life) continue;
        const a = age / q.life, x = q.x + q.vx * age + Math.sin(q.ph + age * 4) * 3 * DPR, y = q.y + q.vy * age - 10 * DPR * age * age;
        const r = Math.round(lerp(38, 241, Math.min(1, a * 2))), gg = Math.round(lerp(36, 205, Math.min(1, a * 2))), b = Math.round(lerp(48, 181, Math.min(1, a * 2)));
        ctx.globalAlpha = (1 - a) * 0.95; ctx.fillStyle = `rgb(${r},${gg},${b})`;
        const z = q.sz * (1 - a * 0.6); ctx.fillRect(x - z / 2, y - z / 2, z, z);
      }
      ctx.globalAlpha = 1;
    } else { // clean skin, a soft shimmer
      const a = Math.sin(Math.PI * Math.min(1, (t - 6.4) / 1.6)) * 0.18;
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.5);
      g.addColorStop(0, `rgba(255, 240, 228, ${a})`); g.addColorStop(1, 'rgba(255, 240, 228, 0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    raf = requestAnimationFrame(frame);
  };
  const still = () => { if (!build()) return; ctx.drawImage(skin, 0, 0); ctx.drawImage(ink, 0, 0); };
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (!visible) return;
    if (!skin && !build()) return;
    if (reduce()) { still(); return; }
    if (!raf) { t0 = 0; raf = requestAnimationFrame(frame); }
  }, { threshold: 0.3 }).observe(cv);
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (skin) build(); }, 200); });

  const book = document.getElementById('ttBook');
  book && book.addEventListener('click', () => {
    if (window.akBooking && window.akBooking.openCat) window.akBooking.openCat('הסרת קעקועים'); else location.hash = '#treat';
  });
})();
