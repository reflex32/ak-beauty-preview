/* ==========================================================================
   The certificate, in 3D: it rises into place, leans gently, catches the light,
   and shows the name she types. Rebuilt 1:1 from the academy's real certificate.
   ========================================================================== */
(() => {
  'use strict';
  const card = document.getElementById('ctCard');
  if (!card) return;
  const stage = document.getElementById('ctStage'), nameEl = document.getElementById('ctName'), input = document.getElementById('ctInput');
  const courseEl = document.getElementById('ctCourse');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');
  const COURSES = ['עיצוב ושיקום גבות טבעיות', 'מיקרובליידינג', 'הרמת ריסים וגבות'];
  const d = new Date();
  document.getElementById('ctDate').textContent = `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;

  // her name, live
  const PLACE = 'השם שלך';
  input.addEventListener('input', () => {
    const v = input.value.trim();
    nameEl.textContent = v || PLACE; nameEl.classList.toggle('empty', !v);
    nameEl.classList.remove('pop'); void nameEl.offsetWidth; nameEl.classList.add('pop');
  });

  // tilt: idle sway + pointer (desktop) / phone tilt where the browser allows it without asking
  let tx = 0, ty = 0, rx = 0, ry = 0, enter = 0, t0 = 0, visible = false, raf = 0, started = false;
  if (matchMedia('(hover: hover)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - 0.5) * 22; tx = -((e.clientY - r.top) / r.height - 0.5) * 14;
    });
    stage.addEventListener('pointerleave', () => { tx = ty = 0; });
  }
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || !visible) return;
    ty = Math.max(-14, Math.min(14, e.gamma * 0.5)); tx = Math.max(-10, Math.min(10, (e.beta - 45) * -0.3));
  });
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const frame = (now) => {
    raf = 0;
    if (!visible || stage.classList.contains('gl')) return; // the 3D version took over
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    enter = ease(t / 1.5);
    const idleY = Math.sin(t * 0.7) * 7, idleX = Math.sin(t * 0.5 + 1) * 3.5;
    rx += (tx + idleX - rx) * 0.08; ry += (ty + idleY - ry) * 0.08;
    const lift = (1 - enter);
    card.style.transform = `translateY(${lift * 70}px) rotateX(${rx + lift * 62}deg) rotateY(${ry}deg)`;
    card.style.opacity = String(0.2 + 0.8 * enter);
    card.style.setProperty('--sx', `${(-ry * 6)}%`);
    card.style.setProperty('--glow', String(0.35 + Math.abs(ry) / 30));
    stage.style.setProperty('--sh', String(1 - Math.abs(rx) / 60));
    raf = requestAnimationFrame(frame);
  };
  const typeName = () => {
    if (input.value) return;
    let i = 0; nameEl.textContent = '';
    const step = () => { if (input.value) return; nameEl.textContent = PLACE.slice(0, ++i); if (i < PLACE.length) setTimeout(step, 110); };
    setTimeout(step, 900);
  };
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible && reduce()) { card.style.transform = 'rotateX(6deg) rotateY(-8deg)'; card.style.opacity = '1'; return; }
    if (visible && !started) { started = true; typeName(); }
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }, { threshold: 0.3 }).observe(stage);

  // the course line changes softly, one course after another
  let ci = 0;
  setInterval(() => {
    if (!visible || reduce()) return;
    courseEl.classList.add('out');
    setTimeout(() => { ci = (ci + 1) % COURSES.length; courseEl.textContent = COURSES[ci]; courseEl.classList.remove('out'); }, 380);
  }, 3400);
})();
