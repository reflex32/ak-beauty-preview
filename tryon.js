/* ==========================================================================
   Microblading try-on: she takes a selfie (or picks a photo), the face points are
   found on the phone (MediaPipe Face Landmarker; the photo is never uploaded),
   and fine hair strokes are drawn into both brows (hairs.js).
   Before she tries, the same thing plays on a sample face (points precomputed).
   ========================================================================== */
(() => {
  'use strict';
  const sec = document.getElementById('tryon');
  if (!sec || !window.AKHairs) return;

  const V = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  // face points of the sample photo, x and y in 1/10000 of the width and height
  const SAMPLE = { src: 'assets/img/ba2-before.webp', p: {"70":[2294,4015],"63":[2572,3722],"105":[3060,3551],"66":[3762,3551],"107":[4615,3623],"46":[2465,4134],"53":[2738,3897],"52":[3182,3769],"65":[3828,3780],"55":[4749,3999],"300":[8466,3635],"293":[8203,3396],"334":[7771,3298],"296":[7160,3378],"336":[6383,3542],"276":[8366,3773],"283":[8112,3587],"282":[7702,3525],"295":[7127,3614],"285":[6312,3922],"234":[1901,5397],"454":[8777,4977],"10":[5397,2341],"152":[5986,9489],"33":[2992,4735],"133":[4547,4720],"263":[8017,4433],"362":[6574,4621],"159":[3610,4492],"386":[7415,4283],"145":[3747,4840],"374":[7355,4640],"168":[5589,4463],"6":[5642,4893]} };
  // brow points from the outer end to the inner end: upper edge, lower edge
  const BROWS = [{ U: [70, 63, 105, 66, 107], L: [46, 53, 52, 65, 55] }, { U: [300, 293, 334, 296, 336], L: [276, 283, 282, 295, 285] }];
  const SHADES = { light: [132, 98, 74], mid: [104, 72, 52], dark: [74, 54, 42] };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');

  const $ = (id) => document.getElementById(id);
  const stage = $('toStage'), cvB = $('toBefore'), cvA = $('toAfter'), range = $('toRange'), busy = $('toBusy'), busyT = $('toBusyT');
  const msg = $('toMsg'), tag = $('toTag'), afterAct = $('toAfterAct'), shadesEl = $('toShades'), viewBtn = $('toView');
  const track = (e, p) => { try { window.akTrack && window.akTrack(e, p); } catch (x) {} };

  /* ---------- small vector helpers ---------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const lerp = (a, b, t) => add(a, mul(sub(b, a), t)), dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // Catmull-Rom through points, t in 0..1 over the whole list
  const spline = (pts, t) => {
    const n = pts.length - 1, f = clamp(t, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), s = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const s2 = s * s, s3 = s2 * s;
    return [0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3));
  };

  /* ---------- state ---------- */
  const S = { img: null, W: 0, H: 0, P: null, hairs: [], color: SHADES.mid, color2: [150, 114, 90], shade: 'auto', auto: null, view: 'close', pos: 50, sample: true };
  const base = document.createElement('canvas'), res = document.createElement('canvas');

  /* ---------- the brows, the hairs and the colour ---------- */
  const browEdges = (b) => {
    const U = b.U.map(S.P).reverse(), L = b.L.map(S.P).reverse(); // inner (front) -> outer
    // the landmarks stop a little before the real tail: carry it on and close it in a point
    const dU = sub(U[4], U[3]), dL = sub(L[4], L[3]);
    const tail = lerp(add(U[4], mul(dU, 0.55)), add(L[4], mul(dL, 0.55)), 0.55);
    U.push(lerp(add(U[4], mul(dU, 0.3)), tail, 0.4)); L.push(lerp(add(L[4], mul(dL, 0.3)), tail, 0.4));
    U.push(tail); L.push(tail);
    return (u) => {
      const up = spline(U, u), lo = spline(L, u), c = lerp(up, lo, 0.5);
      return { up: lerp(c, up, 1.08), lo: lerp(c, lo, 1.08) }; // a touch fuller than the brow is today
    };
  };
  const planHairs = () => {
    const faceW = dist(S.P(234), S.P(454));
    S.soft = clamp(faceW / 950, 0.5, 1);
    S.hairs = BROWS.map((b, i) => AKHairs.plan(browEdges(b), { width: Math.max(1.6, faceW * 0.0026), seed: 11 + i * 12 }));
  };
  // her own brow colour: the darkest pixels inside the brows, kept in a natural brown range
  const sampleColour = () => {
    const ctx = base.getContext('2d', { willReadFrequently: true });
    let r = 0, g = 0, bl = 0, n = 0, skin = [0, 0, 0], sn = 0;
    BROWS.forEach((b) => {
      const poly = b.U.map(S.P).concat(b.L.map(S.P).reverse());
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const x0 = Math.floor(Math.min(...xs)), y0 = Math.floor(Math.min(...ys)), w = Math.ceil(Math.max(...xs)) - x0 + 1, h = Math.ceil(Math.max(...ys)) - y0 + 1;
      if (w < 3 || h < 3) return;
      const d = ctx.getImageData(x0, y0, w, h).data, path = new Path2D();
      poly.forEach((p, i) => (i ? path.lineTo(p[0] - x0, p[1] - y0) : path.moveTo(p[0] - x0, p[1] - y0))); path.closePath();
      const probe = document.createElement('canvas').getContext('2d'), px = [];
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (probe.isPointInPath(path, x, y)) { const k = (y * w + x) * 4; px.push([d[k], d[k + 1], d[k + 2]]); }
      px.sort((a, c) => (a[0] + a[1] + a[2]) - (c[0] + c[1] + c[2]));
      px.slice(0, Math.max(1, Math.round(px.length * 0.2))).forEach((c) => { r += c[0]; g += c[1]; bl += c[2]; n++; });
      // skin just under the brow, above the eye
      for (let i = 0; i < 5; i++) {
        const q = lerp(S.P(b.L[i]), S.P(i < 3 ? (b === BROWS[0] ? 159 : 386) : (b === BROWS[0] ? 133 : 362)), 0.45);
        const c = ctx.getImageData(Math.round(q[0]), Math.round(q[1]), 1, 1).data; skin = [skin[0] + c[0], skin[1] + c[1], skin[2] + c[2]]; sn++;
      }
    });
    if (!n) { S.auto = SHADES.mid; return; }
    let c = [r / n, g / n, bl / n];
    const lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    // keep it a believable pigment: not black, not paler than a light brown, a little warm
    const target = clamp(lum, 58, 118), k = target / (lum || 1);
    c = [c[0] * k + 10, c[1] * k + 2, c[2] * k - 4].map((v) => Math.round(clamp(v, 30, 170)));
    S.auto = c;
    S.skin = sn ? skin.map((v) => v / sn) : [215, 170, 145];
  };
  const setShade = (name) => {
    S.shade = name;
    S.color = name === 'auto' ? (S.auto || SHADES.mid) : SHADES[name];
    const sk = S.skin || [215, 170, 145];
    S.color2 = S.color.map((v, i) => Math.round(v * 0.62 + sk[i] * 0.38));
  };

  /* ---------- drawing ---------- */
  // the hairs are drawn on their own layer; on a small or soft photo the layer is
  // softened to the photo's own sharpness, so the strokes sit in the skin and don't look drawn on
  const layer = document.createElement('canvas'), small = document.createElement('canvas');
  const renderResult = (prog) => {
    if (layer.width !== S.W || layer.height !== S.H) { layer.width = S.W; layer.height = S.H; }
    const lctx = layer.getContext('2d');
    lctx.clearRect(0, 0, S.W, S.H);
    S.hairs.forEach((hs) => AKHairs.draw(lctx, hs, prog ? (i) => prog(i, hs.length) : null, { color: S.color, color2: S.color2, alpha: 0.85 }));
    const ctx = res.getContext('2d');
    ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    if (S.soft < 0.98) {
      const sw = Math.max(1, Math.round(S.W * S.soft)), sh = Math.max(1, Math.round(S.H * S.soft));
      if (small.width !== sw || small.height !== sh) { small.width = sw; small.height = sh; }
      const sctx = small.getContext('2d'); sctx.clearRect(0, 0, sw, sh); sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(layer, 0, 0, sw, sh);
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small, 0, 0, S.W, S.H);
    } else ctx.drawImage(layer, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  };
  // the part of the photo on screen: both brows and eyes up close, or the whole face
  const crop = () => {
    const ar = stage.clientWidth / Math.max(1, stage.clientHeight);
    const ids = S.view === 'close' ? [70, 300, 107, 336, 63, 293, 105, 334, 145, 374, 33, 263] : [10, 152, 234, 454];
    const pts = ids.map(S.P), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const mx = (x1 - x0) * (S.view === 'close' ? 0.16 : 0.12), my = (y1 - y0) * (S.view === 'close' ? 0.55 : 0.1);
    x0 -= mx; x1 += mx; y0 -= my; y1 += my;
    let w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (w / h > ar) h = w / ar; else w = h * ar;
    if (w > S.W) { w = S.W; h = w / ar; } if (h > S.H) { h = S.H; w = h * ar; }
    cx = clamp(cx, w / 2, S.W - w / 2); cy = clamp(cy, h / 2, S.H - h / 2);
    return [cx - w / 2, cy - h / 2, w, h];
  };
  const present = () => {
    const dpr = Math.min(2.5, devicePixelRatio || 1), w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (!w || !h || !S.W) return;
    const c = crop();
    [[cvB, base], [cvA, res]].forEach(([cv, src]) => {
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, c[0], c[1], c[2], c[3], 0, 0, w, h);
    });
  };
  const setPos = (p) => { S.pos = clamp(p, 0, 100); stage.style.setProperty('--pos', S.pos + '%'); range.value = S.pos; };

  // the reveal: a soft scan, then the hairs, front to tail, both brows together
  let raf = 0, hintRaf = 0, touched = false;
  const play = () => {
    cancelAnimationFrame(raf); cancelAnimationFrame(hintRaf);
    setPos(reduce() ? 50 : 0);
    if (reduce()) { renderResult(); present(); return; }
    stage.classList.remove('scan'); void stage.offsetWidth; stage.classList.add('scan');
    const T0 = 700, SPAN = 1900, D = 160;
    let t0 = 0;
    const f = (now) => {
      if (!t0) t0 = now;
      const t = now - t0 - T0;
      renderResult((i, n) => clamp((t - (i / n) * SPAN) / D, 0, 1)); present();
      if (t < SPAN + D) { raf = requestAnimationFrame(f); return; }
      renderResult(); present(); hint();
    };
    raf = requestAnimationFrame(f);
  };
  // show where the line is: after appears, then the line settles in the middle
  const hint = () => {
    if (touched) { setPos(50); return; }
    const t0 = performance.now();
    const f = (now) => {
      if (touched) return;
      const k = clamp((now - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - k, 3);
      setPos(e * 50 + Math.sin(k * Math.PI) * 18);
      if (k < 1) hintRaf = requestAnimationFrame(f);
    };
    hintRaf = requestAnimationFrame(f);
  };

  /* ---------- a photo in ---------- */
  const load = (img, P, isSample) => {
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    S.W = Math.round((img.naturalWidth || img.width) * k); S.H = Math.round((img.naturalHeight || img.height) * k);
    base.width = res.width = S.W; base.height = res.height = S.H;
    base.getContext('2d').drawImage(img, 0, 0, S.W, S.H);
    S.P = P; S.sample = isSample;
    sampleColour(); setShade(S.shade); planHairs();
    tag.hidden = !isSample; sec.classList.toggle('mine', !isSample);
    afterAct.hidden = isSample;
    touched = false; play();
  };

  let landmarker = null;
  const getLandmarker = async () => {
    if (landmarker) return landmarker;
    const { FaceLandmarker, FilesetResolver } = await import(`${V}/vision_bundle.mjs`);
    const fs = await FilesetResolver.forVisionTasks(`${V}/wasm`);
    const make = (delegate) => FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1 });
    try { landmarker = await make('GPU'); } catch (e) { landmarker = await make('CPU'); }
    return landmarker;
  };
  const fromFile = async (file) => {
    if (!file) return;
    busy.hidden = false; busyT.textContent = 'טוענת את ההדמיה'; msg.textContent = '';
    track('tryon');
    try {
      const url = URL.createObjectURL(file), img = new Image();
      img.src = url; await img.decode();
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const work = document.createElement('canvas'); work.width = Math.round(img.naturalWidth * k); work.height = Math.round(img.naturalHeight * k);
      work.getContext('2d').drawImage(img, 0, 0, work.width, work.height);
      URL.revokeObjectURL(url);
      const lm = await getLandmarker();
      busyT.textContent = 'מאתרת את הגבות';
      await new Promise((r) => setTimeout(r, 30));
      const out = lm.detect(work), f = out.faceLandmarks && out.faceLandmarks[0];
      if (!f) { busy.hidden = true; msg.textContent = 'לא מצאתי פנים בתמונה. נסי סלפי ישר, באור טוב, כשהגבות גלויות.'; msg.classList.add('err'); return; }
      msg.classList.remove('err');
      const W = work.width, H = work.height;
      busy.hidden = true;
      load(work, (i) => [f[i].x * W, f[i].y * H], false);
      msg.textContent = 'אפשר לגרור את הקו כדי להשוות, ולבחור גוון.';
      stage.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
    } catch (e) {
      busy.hidden = true; msg.classList.add('err');
      msg.textContent = 'ההדמיה לא נטענה. בדקי את החיבור לאינטרנט ונסי שוב.';
    }
  };
  ['toCam', 'toPick'].forEach((id) => { const inp = $(id); inp && inp.addEventListener('change', () => { fromFile(inp.files && inp.files[0]); inp.value = ''; }); });

  /* ---------- controls ---------- */
  range.addEventListener('input', () => { touched = true; cancelAnimationFrame(hintRaf); setPos(+range.value); });
  shadesEl.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !S.W) return;
    shadesEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    setShade(b.dataset.shade); renderResult(); present();
  });
  viewBtn.addEventListener('click', () => {
    S.view = S.view === 'close' ? 'face' : 'close';
    stage.classList.toggle('face', S.view === 'face');
    viewBtn.textContent = S.view === 'close' ? 'כל הפנים' : 'תקריב';
    requestAnimationFrame(present);
  });
  $('toBook').addEventListener('click', () => { if (window.akBooking && window.akBooking.start) window.akBooking.start(['micro']); else location.hash = '#treat'; });
  $('toSave').addEventListener('click', async () => {
    // the close-up, before and after side by side, at full size
    const c = crop(), out = document.createElement('canvas'), w = Math.round(c[2]), h = Math.round(c[3]);
    out.width = w * 2 + 12; out.height = h; const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, h);
    ctx.drawImage(base, c[0], c[1], c[2], c[3], 0, 0, w, h); ctx.drawImage(res, c[0], c[1], c[2], c[3], w + 12, 0, w, h);
    const blob = await new Promise((r) => out.toBlob(r, 'image/jpeg', 0.92));
    const file = new File([blob], 'microblading-preview.jpg', { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'ההדמיה שלי' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(present, 150); });

  /* ---------- the sample plays when the section comes into view ---------- */
  new IntersectionObserver((en, o) => {
    if (!en[0].isIntersecting) return;
    o.disconnect();
    const img = new Image(); img.src = SAMPLE.src;
    img.decode().then(() => {
      if (!S.sample && S.W) return; // she already loaded her own photo
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), W = img.naturalWidth * k, H = img.naturalHeight * k;
      load(img, (i) => [SAMPLE.p[i][0] / 10000 * W, SAMPLE.p[i][1] / 10000 * H], true);
    }).catch(() => {});
  }, { threshold: 0.35 }).observe(stage);
})();
