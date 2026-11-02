/* ==========================================================================
   The certificate as a real 3D object (Three.js, WebGL): a laminated board with
   thickness and rounded edges, studio light and reflections, a soft shadow, the
   academy's certificate as a sharp texture, and a back side. Drag to spin it.
   Loads only when the section comes near; without WebGL the CSS version stays.
   ========================================================================== */
const stage = document.getElementById('ctStage');
const cv = document.getElementById('ctGl');
const input = document.getElementById('ctInput');

if (stage && cv) {
  const near = new IntersectionObserver((en) => {
    if (!en[0].isIntersecting) return;
    near.disconnect();
    start().catch(() => { /* keep the CSS certificate */ });
  }, { rootMargin: '1600px 0px' }); // ready well before she gets there, so nothing jumps
  near.observe(stage);
}

async function start() {
  const THREE = await import('three');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  await Promise.all(['500 100px Heebo', '400 60px Heebo', '300 60px Heebo'].map((f) => document.fonts.load(f).catch(() => {})));

  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.5, 4.3);
  camera.lookAt(0, -0.08, 0);
  const key = new THREE.DirectionalLight(0xfff4ea, 1.1); key.position.set(-2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2d2, 0.5); rim.position.set(3, -1, -2); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  /* ---------- the artwork, drawn like the real certificate ---------- */
  const TW = 2048, TH = Math.round(TW / 1.414);
  const AK = [...document.querySelectorAll('#ak polygon')].map((pg) => pg.getAttribute('points').trim().split(/\s+/).map((p) => p.split(',').map(Number)));
  const logo = (ctx, cx, top, width, color) => { // the AK mark, from the site's own symbol (viewBox 110 40 716 546)
    if (!AK.length) return;
    const k = width / 716, h = 546 * k, x0 = cx - width / 2;
    ctx.beginPath();
    AK.forEach((poly) => { poly.forEach(([x, y], i) => { const X = x0 + (x - 110) * k, Y = top + (y - 40) * k; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); });
    ctx.fillStyle = color; ctx.fill();
    return h;
  };
  const spaced = (ctx, text, x, y, em) => {
    if ('letterSpacing' in ctx) { ctx.letterSpacing = `${em}em`; ctx.fillText(text, x, y); ctx.letterSpacing = '0px'; return; }
    ctx.fillText(text, x, y);
  };
  const grain = (() => { // fine paper grain, made once
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const c = g.getContext('2d'), d = c.createImageData(256, 256);
    let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < d.data.length; i += 4) { const v = 120 + rnd() * 60; d.data[i] = v; d.data[i + 1] = v * 0.94; d.data[i + 2] = v * 0.9; d.data[i + 3] = 14; }
    c.putImageData(d, 0, 0); return g;
  })();

  const front = document.createElement('canvas'); front.width = TW; front.height = TH;
  const fx = front.getContext('2d');
  const d0 = new Date(), DATE = `${d0.getDate()}.${d0.getMonth() + 1}.${String(d0.getFullYear()).slice(2)}`;
  const COURSES = ['עיצוב ושיקום גבות טבעיות', 'מיקרובליידינג', 'הרמת ריסים וגבות'];
  let NAME = '', course = 0;
  const INK = '#3b2a2e', GREY = '#6f6266';
  const drawFront = () => {
    const c = fx, W = TW, H = TH;
    c.save(); c.clearRect(0, 0, W, H);
    c.fillStyle = '#fdfbf8'; c.fillRect(0, 0, W, H);
    c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(0, 0, W, H);
    // frame
    c.strokeStyle = 'rgba(59, 42, 46, .6)'; c.lineWidth = 3; c.strokeRect(54, 54, W - 108, H - 108);
    // watermark
    c.globalAlpha = 0.06; logo(c, W / 2, H * 0.27, W * 0.62, INK); c.globalAlpha = 1;
    // logo + BEAUTY ACADEMY
    const lh = logo(c, W / 2, H * 0.085, W * 0.085, INK);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.direction = 'ltr';
    c.fillStyle = '#6f6266'; c.font = '400 23px Heebo'; spaced(c, 'BEAUTY ACADEMY', W / 2, H * 0.085 + lh + 36, 0.22);
    // title
    c.fillStyle = INK; c.font = '500 132px Heebo'; spaced(c, 'CERTIFICATE', W / 2, H * 0.365, 0.07);
    c.direction = 'rtl'; c.fillStyle = GREY; c.font = '400 44px Heebo'; spaced(c, 'וזאת לתעודה כי', W / 2, H * 0.425, 0.16);
    // name
    c.font = NAME ? '500 100px Heebo' : '400 92px Heebo'; c.fillStyle = NAME ? '#2a1c20' : 'rgba(59, 42, 46, .38)';
    c.fillText(NAME || 'השם שלך', W / 2, H * 0.545, W * 0.48);
    c.fillStyle = 'rgba(59, 42, 46, .55)'; c.fillRect(W * 0.25, H * 0.572, W * 0.5, 3);
    c.direction = 'ltr'; c.fillStyle = GREY; c.font = '400 21px Heebo'; spaced(c, 'NAME', W / 2, H * 0.6, 0.24);
    // course
    c.direction = 'rtl'; c.fillStyle = '#4f4347'; c.font = '400 50px Heebo';
    c.fillText(`סיימה בהצלחה קורס ${COURSES[course]}`, W / 2, H * 0.675);
    // signature (left) and date (right)
    const block = (x, text, label) => {
      c.direction = 'rtl'; c.fillStyle = INK; c.font = '400 44px Heebo'; c.fillText(text, x, H * 0.842);
      c.fillStyle = 'rgba(59, 42, 46, .55)'; c.fillRect(x - W * 0.12, H * 0.862, W * 0.24, 3);
      c.direction = 'ltr'; c.fillStyle = GREY; c.font = '400 21px Heebo'; spaced(c, label, x, H * 0.895, 0.24);
    };
    block(W * 0.24, 'אביגיל קקון', 'SIGNATURE');
    block(W * 0.76, DATE, 'DATE');
    c.restore();
  };
  const back = document.createElement('canvas'); back.width = 1024; back.height = Math.round(1024 / 1.414);
  (() => {
    const c = back.getContext('2d'), W = back.width, H = back.height;
    c.fillStyle = '#f6f2ed'; c.fillRect(0, 0, W, H);
    c.fillStyle = c.createPattern(grain, 'repeat'); c.fillRect(0, 0, W, H);
    const lh = logo(c, W / 2, H * 0.36, W * 0.13, 'rgba(59, 42, 46, .55)');
    c.textAlign = 'center'; c.fillStyle = 'rgba(59, 42, 46, .5)'; c.font = '400 16px Heebo';
    spaced(c, 'BEAUTY ACADEMY', W / 2, H * 0.36 + lh + 30, 0.24);
  })();
  drawFront();

  const tex = (canvas) => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const frontTex = tex(front), backTex = tex(back);

  /* ---------- the board ---------- */
  const BW = 2, BH = BW / 1.414, BD = 0.05;
  const geo = new RoundedBoxGeometry(BW, BH, BD, 5, 0.016);
  const edgeMat = new THREE.MeshPhysicalMaterial({ color: 0xf1ede7, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const frontMat = new THREE.MeshPhysicalMaterial({ map: frontTex, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.28 });
  const backMat = new THREE.MeshPhysicalMaterial({ map: backTex, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const board = new THREE.Mesh(geo, [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat]);
  const group = new THREE.Group(); group.add(board); scene.add(group);

  // soft shadow on the "floor"
  const sh = document.createElement('canvas'); sh.width = 256; sh.height = 128;
  (() => { const c = sh.getContext('2d'), g = c.createRadialGradient(128, 64, 4, 128, 64, 124); g.addColorStop(0, 'rgba(36,22,15,.55)'); g.addColorStop(1, 'rgba(36,22,15,0)'); c.fillStyle = g; c.scale(1, 0.5); c.fillRect(0, 0, 256, 256); })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.0), new THREE.MeshBasicMaterial({ map: tex(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -BH / 2 - 0.22; scene.add(shadow);

  /* ---------- size ---------- */
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight; // the stage keeps its own size (aspect-ratio), so nothing shifts
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    camera.position.z = Math.max((BW / 0.92) / (t2 * camera.aspect), (BH / 0.8) / t2); // the board fills ~92% of the width
    camera.lookAt(0, -0.06, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- motion ---------- */
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');
  let rotY = 0, rotX = 0, vel = 0, drag = null, lastDrag = -9, tiltX = 0, tiltY = 0, enterAt = null, visible = false, raf = 0;
  const clock = new THREE.Clock();
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4); // smooth landing, no bounce
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, t: performance.now() }; vel = 0; cv.setPointerCapture(e.pointerId); stage.classList.add('dragged'); });
  cv.addEventListener('pointermove', (e) => {
    if (drag) {
      const now = performance.now(), dx = e.clientX - drag.x;
      rotY += dx * 0.011; vel = (dx * 0.011) / Math.max(0.008, (now - drag.t) / 1000);
      drag = { x: e.clientX, t: now };
    } else if (e.pointerType === 'mouse') {
      const r = cv.getBoundingClientRect();
      tiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.35; tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.18;
    }
  });
  const release = () => { if (drag) { drag = null; lastDrag = clock.elapsedTime; } };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  cv.addEventListener('pointerleave', () => { tiltX = tiltY = 0; });
  addEventListener('deviceorientation', (e) => { // phones that allow it without asking (Android)
    if (e.gamma == null || !visible || drag) return;
    tiltY = Math.max(-0.3, Math.min(0.3, e.gamma / 60)); tiltX = Math.max(-0.15, Math.min(0.15, (e.beta - 50) / -200));
  });

  const frame = () => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (enterAt === null) enterAt = t;
    const e = reduce() ? 1 : easeOut((t - enterAt) / 1.6);
    const still = reduce();
    const idleY = still ? -0.1 : Math.sin(t * 0.55) * 0.13, idleX = still ? 0.04 : Math.sin(t * 0.42 + 1) * 0.045;
    if (!drag) {
      rotY += vel * dt; vel *= Math.pow(0.04, dt); // inertia
      if (Math.abs(vel) < 0.35 && t - lastDrag > 1.2) {
        const home = Math.round(rotY / (Math.PI * 2)) * Math.PI * 2;
        rotY += (home + idleY + tiltY - rotY) * Math.min(1, dt * 2.2);
      }
    }
    rotX += (idleX + tiltX - rotX) * Math.min(1, dt * 3);
    group.rotation.set(rotX + (1 - e) * 0.9, rotY - (1 - e) * 1.2, 0);
    group.position.y = (still ? 0 : Math.sin(t * 0.8) * 0.025) - (1 - e) * 0.35;
    const side = Math.abs(Math.sin(rotY));
    shadow.material.opacity = Math.min(1, e) * (0.42 - side * 0.15);
    shadow.scale.set(1 - side * 0.45, 1, 1);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }, { threshold: 0.15 }).observe(stage);

  /* ---------- her name, the course line ---------- */
  input && input.addEventListener('input', () => { NAME = input.value.trim(); drawFront(); frontTex.needsUpdate = true; });
  setInterval(() => { if (!visible || reduce() || drag) return; course = (course + 1) % COURSES.length; drawFront(); frontTex.needsUpdate = true; }, 3600);

  const r = stage.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) enterAt = -10;
  renderer.render(scene, camera);
  stage.classList.add('gl'); // the 3D one takes over from the CSS one
}
