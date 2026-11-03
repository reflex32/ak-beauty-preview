/* AK Beauty Academy · Avigail Kakoon */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG: change contact details and address here
     ------------------------------------------------------------------ */
  const CONFIG = {
    phone: '972502774797',
    instagram: 'https://www.instagram.com/avigail_kakoon/',
    // the street is not shown on the site; Waze / Google Maps use the exact point (ll)
    address: { street: 'גילדסגיים 4', city: 'רמת גן', label: 'AK Beauty Academy', ll: '32.0526698,34.8488945' },
    // Lead form → WhatsApp message to Avigail goes through the booking server (window.AK_API in index.html).
    // Until it is set, the form opens WhatsApp with the same message ready (so no lead is lost).
  };
  const WA_MSG = {
    hello: 'היי אביגיל, הגעתי מהאתר ואשמח לשמוע על הקורסים שלך',
    consult: 'היי אביגיל, אשמח לקבוע שיחת ייעוץ לגבי הקורסים',
    brows: 'היי אביגיל, אשמח לשמוע פרטים על קורס עיצוב ושיקום גבות טבעיות',
    micro: 'היי אביגיל, אשמח לשמוע פרטים על קורס המיקרובליידינג',
    lash: 'היי אביגיל, אשמח לשמוע פרטים על קורס הרמת ריסים והרמת גבות',
    triple: 'היי אביגיל, אשמח לשמוע על קורס הטריפל',
    treat: 'היי אביגיל, אשמח לקבוע תור לטיפול',
    't-brows': 'היי אביגיל, אשמח לקבוע תור לגבות',
    't-combo': 'היי אביגיל, אשמח לקבוע תור לטיפול המשולב של ריסים וגבות',
    't-help': 'היי אביגיל, אשמח להתייעץ איזה טיפול מתאים לי',
    't-micro': 'היי אביגיל, אשמח לקבוע תור למיקרובליידינג',
    't-lash': 'היי אביגיל, אשמח לקבוע תור להרמת ריסים',
    't-lift': 'היי אביגיל, אשמח לקבוע תור להרמת גבות',
  };
  const wa = (text) => `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(text)}`;

  /* ------------------------------------------------------------------
     DATA
     ------------------------------------------------------------------ */
  // most viewed reels, sorted by views (Instagram, Nov 2026)
  const REELS = [
    { id: 'DAVyQQkM5Jc', t: 'גבות זה החיים, לא?' },
    { id: 'DU5m8USiOI6', t: 'אחרי מיקרובליידינג', src: 'v-shelly' },
    { id: 'C8zojH2MNKi', t: 'פעם הייתי לוקחת ללב' },
    { id: 'DJUgu53sbDc', t: 'מפחדת להישאר לבד אחרי הקורס?' },
    { id: 'C7mnrQesYhY', t: 'את מעצבת יותר מדי את הגבה?' },
    { id: 'C9X0e0VMq99', t: 'כולה גבות, הוא אומר לי' },
    { id: 'C-SVtXuMPJC', t: 'גם לכן זה קורה?' },
    { id: 'C717AARMR8m', t: 'טיפ זהב שלא כדאי לפספס' },
    { id: 'C92KjPosTd1', t: 'חיילות יקרות, זה הזמן' },
    { id: 'DJUPZchsUCv', t: 'מחפשת את האחת שתיתן לך ביטחון?' },
    { id: 'DEApBpdM06r', t: 'בואו נדבר על זה' },
    { id: 'Co0CKHmDf0O', t: 'מיכל מתחדשת בהרמת ריסים ועיצוב גבות' },
    { id: 'DFsdO5IMlRc', t: 'ההרגשה אחרי מיקרובליידינג' },
  ];
  // graduation photos (Instagram, 2025)
  const GRADS = [
    { t: 'סיום קורס עיצוב ושיקום גבות טבעיות' },
    { t: 'סיום קורס עיצוב ושיקום גבות' },
    { t: 'סיום קורס הרמת ריסים והרמת גבות' },
    { t: 'סיום קורס עיצוב ושיקום גבות' },
    { t: 'סיום קורס עיצוב ושיקום גבות טבעיות' },
    { t: 'סיום קורס עיצוב ושיקום גבות טבעיות' },
    { t: 'עדי, קורס טריפל' },
    { t: 'יובל, קורס טריפל' },
    { t: 'דנה, הרמת ריסים וגבות אחת על אחת' },
    { t: 'פרידה, קורס פרטני בעיצוב ושיקום גבות' },
  ];
  const QUIZ = {
    brows: { name: 'עיצוב ושיקום גבות טבעיות', tab: 'brows' },
    micro: { name: 'מיקרובליידינג', tab: 'micro' },
    lash: { name: 'הרמת ריסים והרמת גבות', tab: 'lash' },
    triple: { name: 'טריפל: כל השלושה', tab: 'triple' },
  };
  const QUIZ_WHY = {
    zero: {
      brows: '3 מפגשים בקבוצה של עד 5 בנות. מקבלות ערכה מלאה ותעודה.',
      micro: 'קורס פרטני, אחת על אחת, 5 מפגשים.',
      lash: '2 מפגשים, ואפשר להתחיל לקבל לקוחות כבר למחרת.',
      triple: 'שלושת הקורסים ביחד. את החלוקה למפגשים נתאים בשיחה.',
    },
    beauty: {
      brows: 'עוד טיפול שתוכלי להציע ללקוחות שלך, והן חוזרות אליו כל כמה שבועות.',
      micro: 'קורס פרטני, ואחריו תוכלי להציע גם מיקרובליידינג.',
      lash: 'טיפול קצר ומבוקש, שקל להכניס בין תורים.',
      triple: 'לומדות את שלושת הטיפולים בקורס אחד.',
    },
    again: {
      brows: 'חוזרות על החומר כמה שצריך, ומסיימות במבחן מעשי על 2 מודליסטיות.',
      micro: 'אחת על אחת, בקצב שלך, עם ליווי גם אחרי הקורס.',
      lash: 'קבוצה של עד 5 בנות, ומבחן מעשי בסוף.',
      triple: 'שלושת הקורסים, עם ליווי לאורך כל הדרך.',
    },
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => matchMedia('(min-width: 1024px)').matches;

  /* ------------------------------------------------------------------
     WhatsApp + address links
     ------------------------------------------------------------------ */
  $$('[data-wa]').forEach((a) => { a.href = wa(WA_MSG[a.dataset.wa] || WA_MSG.hello); });
  (() => {
    const { street, city } = CONFIG.address;
    const full = street ? `${street}, ${city}` : city;
    const q = encodeURIComponent(full);
    const w = $('#wazeBtn'), m = $('#mapsBtn'), t = $('#addrText');
    if (w) w.href = CONFIG.address.ll ? `https://waze.com/ul?ll=${CONFIG.address.ll}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`;
    if (m) m.href = CONFIG.address.ll ? `https://www.google.com/maps/search/?api=1&query=${CONFIG.address.ll}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((street ? '' : CONFIG.address.label + ' ') + full)}`;
    if (t) t.textContent = full;
  })();
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Travel time to the clinic: rough from the visitor's area on load,
     exact from the phone's location when she taps the chip.
     ------------------------------------------------------------------ */
  /* about photos: each capsule drifts at its own pace while scrolling */
  (() => {
    const cols = $$('[data-am]'); if (!cols.length || reduce) return;
    const box = $('#aboutMedia'); let ticking = false;
    const run = () => {
      ticking = false;
      const r = box.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const off = r.top + r.height / 2 - innerHeight / 2;
      cols.forEach((c) => { c.style.translate = `0 ${(off * +c.dataset.am).toFixed(1)}px`; }); // `translate`, so the reveal transform keeps working
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  })();

  /* how to find us: a short walk to the door, on a loop while it's on screen */
  (() => {
    const box = $('#arrive'); if (!box) return;
    const zoom = $('.arrive-zoom', box), path = $('#arrivePath'), walker = $('.arrive-walker', box);
    const dotsG = $('.arrive-steps-dots', box), cap = $('#arriveCap'), num = $('.arrive-n', box), bars = $$('.arrive-dots i', box);
    const L = path.getTotalLength(), N = 15;
    const NS = 'http://www.w3.org/2000/svg';
    const steps = Array.from({ length: N }, (_, i) => {
      const p = path.getPointAtLength(L * (i + 0.5) / N), c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); c.setAttribute('r', '4.2');
      dotsG.appendChild(c); return c;
    });
    const CAPS = ['מגיעות לבניין של בית הרופאים', 'לא נכנסות ללובי, הכניסה מהרחוב', 'הדלת הלבנה עם הלוגו AK'];
    let phase = -1;
    const setPhase = (k) => {
      if (k === phase) return; phase = k;
      cap.textContent = CAPS[k]; num.textContent = k + 1;
      cap.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
      bars.forEach((b, i) => b.classList.toggle('on', i === k));
    };
    const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const T = 9200;
    let t0 = 0, raf = 0, on = false;
    const frame = (now) => {
      if (!t0) t0 = now;
      const e = ((now - t0) * 1.15) % T; // runs ~15% faster than the design timeline below
      // zoom: establish (0-1.2s), walk in (1.2-5.4s), hold, ease back (8.4-9.2s)
      let z = 1;
      if (e < 1200) z = 1 + 0.04 * (e / 1200);
      else if (e < 5400) z = 1.04 + 0.38 * ease((e - 1200) / 4200);
      else if (e < 8400) z = 1.42 + 0.02 * Math.sin((e - 5400) / 900);
      else z = 1.42 - 0.42 * ease((e - 8400) / 800);
      zoom.style.transform = `scale(${z.toFixed(4)})`;
      // walk along the path
      const w = e < 1200 ? 0 : e < 5200 ? ease((e - 1200) / 4000) : 1;
      const pt = path.getPointAtLength(L * w);
      walker.setAttribute('cx', pt.x.toFixed(1)); walker.setAttribute('cy', pt.y.toFixed(1));
      steps.forEach((c, i) => c.classList.toggle('on', e < 8400 && w * N > i + 0.5));
      box.classList.toggle('walking', e >= 900 && e < 5600);
      box.classList.toggle('no', e >= 1800 && e < 4400);
      box.classList.toggle('lit', e >= 5200 && e < 8600);
      setPhase(e < 1700 ? 0 : e < 5100 ? 1 : 2);
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (on) return; on = true; t0 = 0; raf = requestAnimationFrame(frame); };
    const stop = () => { on = false; cancelAnimationFrame(raf); };
    if (reduce) { zoom.style.transform = 'scale(1.2)'; steps.forEach((c) => c.classList.add('on')); box.classList.add('lit'); setPhase(2); return; }
    new IntersectionObserver((en) => { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.35 }).observe(box);
  })();

  window.akEta = (() => {
    const [toLat, toLon] = CONFIG.address.ll.split(',').map(Number);
    let cur = null; try { cur = JSON.parse(sessionStorage.getItem('akEta') || 'null'); } catch (e) {}
    const fmt = (m) => { if (m < 60) return `${m} דק׳`; const h = Math.floor(m / 60), r = m % 60; return `${h === 1 ? 'שעה' : `${h} שעות`}${r ? ` ו־${r} דק׳` : ''}`; };
    const label = (v) => (v.min <= 5 ? 'ממש קרוב אלייך' : `${v.exact ? '' : 'כ־'}${fmt(v.min)} נסיעה ממך`);
    const short = (v) => (v.min <= 5 ? 'ממש קרוב' : `${v.exact ? '' : 'כ־'}${fmt(v.min)} ממך`);
    const route = async (lat, lon) => {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon},${lat};${toLon},${toLat}?overview=false`);
      const d = await r.json(); return Math.max(1, Math.round(d.routes[0].duration / 60));
    };
    const paint = () => {
      $$('[data-eta]').forEach((b) => {
        const t = $('.eta-t', b); if (!t) return;
        t.innerHTML = cur ? `<b>${label(cur)}</b> · לניווט` : 'ניווט ב־Waze';
        b.classList.toggle('has', !!cur);
      });
      $$('.eta-inline').forEach((el) => { el.textContent = cur ? ` · ${short(cur)}` : ''; });
      $$('.eta-short').forEach((el) => { el.textContent = cur ? short(cur) : ''; });
    };
    const set = (v) => { cur = v; try { sessionStorage.setItem('akEta', JSON.stringify(v)); } catch (e) {} paint(); };
    const rough = async () => {
      if (cur) return;
      try {
        let g = await fetch('https://ipwho.is/').then((r) => r.json());
        let lat = g.latitude, lon = g.longitude, cc = g.country_code;
        if (!g.success) { g = await fetch('https://get.geojs.io/v1/ip/geo.json').then((r) => r.json()); lat = +g.latitude; lon = +g.longitude; cc = g.country_code; }
        if (cc && cc !== 'IL') return;
        const min = await route(lat, lon);
        if (min < 300 && !cur) set({ min, exact: false });
      } catch (e) { /* the chip still offers the exact check */ }
    };
    // tapping the chip always opens Waze to the clinic
    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-eta]')) return;
      window.open(`https://waze.com/ul?ll=${CONFIG.address.ll}&navigate=yes`, '_blank', 'noopener');
    });
    const near = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { near.disconnect(); rough(); } }, { rootMargin: '800px 0px' });
    $$('[data-eta]').forEach((b) => near.observe(b));
    paint();
    return { paint, get: () => cur };
  })();


  /* ------------------------------------------------------------------
     Build dynamic rows
     ------------------------------------------------------------------ */
  const reelsRow = $('#reelsRow');
  if (reelsRow) {
    reelsRow.innerHTML = REELS.map((r, i) => {
      const base = r.src || `r-${r.id}`;
      const link = r.src ? `https://www.instagram.com/p/${r.id}/` : `https://www.instagram.com/reel/${r.id}/`;
      return `
      <button class="reel rv" style="--i:${i % 4}" data-video="assets/video/${base}-full.mp4" data-link="${link}" aria-label="${r.t}">
        <div class="phone">
          <video muted playsinline loop preload="none" poster="assets/video/${base}.jpg" data-src="assets/video/${base}.mp4"></video>
          <span class="play"><svg class="icon"><use href="#i-play"/></svg></span>
        </div>
        <h3>${r.t}</h3>
      </button>`; }).join('');
  }
  const gradsRow = $('#gradsRow');
  if (gradsRow) {
    gradsRow.innerHTML = GRADS.map((g, i) => `
      <figure class="grad rv" style="--i:${i % 3};margin:0">
        <div class="ph"><img src="assets/img/grad-${i + 1}.webp" alt="${g.t}" loading="lazy"><span class="badge cert"><svg class="icon"><use href="#i-award"/></svg>תעודה</span></div>
        <figcaption><h3>${g.t}</h3></figcaption>
      </figure>`).join('');
  }
  const works = Array.from({ length: 14 }, (_, i) => `assets/img/work-${i + 1}.webp`);
  const fillRow = (el, list) => { if (!el) return; const html = list.map((s) => `<img src="${s}" alt="" loading="lazy">`).join(''); el.innerHTML = html + html; };
  fillRow($('#worksA'), works.slice(0, 7).concat(works.slice(0, 7)));
  fillRow($('#worksB'), works.slice(7).concat(works.slice(7)));
  const shots = $('#shots');
  if (shots) {
    shots.innerHTML = Array.from({ length: 8 }, (_, i) => `
      <button class="shot" data-img="assets/img/wa-${i + 1}.webp" aria-label="צילום מסך ${i + 1}"><img src="assets/img/wa-${i + 1}.webp" alt="צילום מסך של הודעה מתלמידה" loading="lazy"></button>`).join('');
  }
  // duplicate marquee content for seamless loop
  $$('[data-dup]').forEach((el) => { el.innerHTML += el.innerHTML; });

  /* ------------------------------------------------------------------
     Demos: build microblading strokes + lashes
     ------------------------------------------------------------------ */
  (() => {
    const g = $('#mbStrokes'); const guide = $('#mbGuide');
    if (!g) return;
    // brow: head at right (x≈320), tail at left (x≈70)
    const up = (t) => (t < 0.62 ? 150 - 42 * Math.sin((Math.PI / 2) * (t / 0.62)) : 108 + 50 * Math.pow((t - 0.62) / 0.38, 1.4));
    const low = (t) => (t < 0.62 ? 200 - 38 * Math.sin((Math.PI / 2) * (t / 0.62)) : 162 + 12 * ((t - 0.62) / 0.38));
    const X = (t) => 322 - 256 * t;
    let d = 'M' + X(0) + ' ' + low(0);
    for (let t = 0; t <= 1.001; t += 0.05) d += ' L' + X(t).toFixed(1) + ' ' + low(t).toFixed(1);
    for (let t = 1; t >= -0.001; t -= 0.05) d += ' L' + X(t).toFixed(1) + ' ' + up(t).toFixed(1);
    guide.setAttribute('d', d + 'Z');
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const N = 58; let html = '';
    for (let i = 0; i < N; i++) {
      const t = Math.max(0, Math.min(1, (i / (N - 1)) * 1.02 + (rnd() - 0.5) * 0.02));
      const h = low(t) - up(t);
      const bx = X(t) + (rnd() - 0.5) * 6;
      const by = low(t) - rnd() * h * 0.35;
      const ang = (-92 - 78 * Math.pow(t, 0.85) + (rnd() - 0.5) * 10) * Math.PI / 180;
      const len = h * (0.75 + rnd() * 0.45) * (t > 0.85 ? 1.6 : 1);
      const ex = bx + Math.cos(ang) * len; const ey = by + Math.sin(ang) * len;
      const cx = (bx + ex) / 2 + Math.cos(ang + Math.PI / 2) * len * 0.12;
      const cy = (by + ey) / 2 + Math.sin(ang + Math.PI / 2) * len * 0.12;
      const w = (1.3 + rnd() * 1.1).toFixed(2);
      const op = (0.7 + rnd() * 0.3).toFixed(2);
      html += `<path class="mb-stroke" style="--d:${Math.round(i * 55)};stroke-width:${w};opacity:${op}" d="M${bx.toFixed(1)} ${by.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}"/>`;
    }
    g.innerHTML = html;
  })();
  (() => {
    const g = $('#lashes'); if (!g) return;
    // upper lid: M70 190 Q200 92 330 190
    const P = (u) => ({ x: (1 - u) * (1 - u) * 70 + 2 * (1 - u) * u * 200 + u * u * 330, y: (1 - u) * (1 - u) * 190 + 2 * (1 - u) * u * 92 + u * u * 190 });
    let html = '';
    const n = 17;
    for (let i = 0; i < n; i++) {
      const u = 0.08 + (i / (n - 1)) * 0.86;
      const p = P(u);
      const side = (u - 0.5) * 2; // -1..1
      const len = 34 + (1 - Math.abs(side)) * 14;
      const a0 = (side * 70 + (side < 0 ? -18 : 18)) + 'deg'; // drooping outward
      const a1 = (side * 28) + 'deg'; // lifted
      html += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><path class="lash" style="--a0:${a0};--a1:${a1}" d="M0 0 Q ${(-side * 4).toFixed(1)} ${(-len * 0.55).toFixed(1)} ${(side * 9).toFixed(1)} ${(-len).toFixed(1)}"/></g>`;
    }
    g.innerHTML = html;
  })();

  /* ------------------------------------------------------------------
     Brow simulator: one brow, the whole process (AI photo stages)
     ------------------------------------------------------------------ */
  (() => {
    const stage = $('#simStage'); if (!stage) return;
    $('#simOutline').setAttribute('d', 'M216 424 C 380 345, 640 262, 846 258 C 1050 258, 1235 330, 1372 408 C 1300 320, 1130 160, 868 124 C 610 104, 345 205, 220 300 Z');
    const STEPS = [
      ['לפני', 'גבה טבעית, עם חורים ושערות שבורחות לכל הכיוונים.'],
      ['מיפוי', 'מודדות מהאף: איפה הגבה מתחילה, איפה הקשת ואיפה היא נגמרת.'],
      ['שרטוט', 'משרטטות את הצורה שמתאימה לפנים שלה.'],
      ['ניקוי', 'מורידות את כל מה שמחוץ לקו, בחוט, בשעווה ובפינצטה.'],
      ['מיקרובליידינג', 'עט עם להב דק מצייר קווים דקים כמו שערות, אחד אחד, בכיוון שבו השיער גדל.'],
      ['מילוי', 'עוד שערות דקות ובהירות יותר בין הקווים, כדי שהגבה תיראה מלאה וטבעית.'],
      ['התוצאה', 'לפני ואחרי, באותה גבה.'],
    ];
    const sp1 = $('.sp1', stage), brush = $('#simBrush');

    /* microblading: fine hair strokes drawn one by one by a blade pen (shapes in hairs.js) */
    const pen = $('#simPen'), hc = $('#simHc'), hctx = hc && hc.getContext('2d');
    let hairs = [], nMain = 0;
    if (hctx && window.AKHairs) {
      const cub = (a, b, c, d, t) => { const m = 1 - t; return [0, 1].map((k) => m * m * m * a[k] + 3 * m * m * t * b[k] + 3 * m * t * t * c[k] + t * t * t * d[k]); };
      const curve = (segs) => { const pts = []; segs.forEach((g) => { for (let i = 0; i <= 50; i++) pts.push(cub(...g, i / 50)); }); return pts.sort((a, b) => a[0] - b[0]); };
      const yAt = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * ((x - a[0]) / ((b[0] - a[0]) || 1)); } return pts[pts.length - 1][1]; };
      // the brow edges in the photo (1536 x 1024 space), the same shape as the dashed outline
      const LO = curve([[[216, 424], [380, 345], [640, 262], [846, 258]], [[846, 258], [1050, 258], [1235, 330], [1372, 408]]]);
      const UP = curve([[[1372, 408], [1300, 320], [1130, 160], [868, 124]], [[868, 124], [610, 104], [345, 205], [220, 300]]]);
      const edge = (u) => { const x = 224 + 1142 * u; return { lo: [x, yAt(LO, x) - 6], up: [x, yAt(UP, x) + 4] }; };
      hairs = AKHairs.plan(edge, { width: 3.9, seed: 11 });
      nMain = hairs.filter((h) => !h.tone).length;
    }
    let hraf = 0, shown = 0, fitted = false; // shown: how many hairs are fully drawn
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const fit = () => { const r = stage.getBoundingClientRect(), k = Math.min(3, (devicePixelRatio || 1) * 1.3); if (!r.width) return; hc.width = Math.round(r.width * k); hc.height = Math.round(r.width / 1.5 * k); fitted = true; };
    const paint = (prog) => {
      if (!hctx) return;
      if (!fitted) fit();
      const k = hc.width / 1536;
      hctx.clearRect(0, 0, hc.width, hc.height);
      AKHairs.draw(hctx, hairs, prog, { xf: (p) => [p[0] * k, p[1] * k], color: [104, 72, 52], color2: [152, 116, 92], alpha: 0.82 });
    };
    const stopHairs = () => { cancelAnimationFrame(hraf); stage.classList.remove('drawing'); };
    const setHairs = (n) => { stopHairs(); shown = n; paint((i) => (i < n ? 1 : 0)); };
    // draw hairs a..b one after the other over `span` ms, the pen riding on the newest one
    const drawRange = (a, b, span) => {
      setHairs(a);
      if (b <= a) return;
      const D = 150, T0 = 260, gap = span / (b - a);
      let px = null, py = null, t0 = 0;
      stage.classList.add('drawing');
      const f = (now) => {
        if (!t0) t0 = now;
        const t = now - t0 - T0;
        paint((i) => (i < a ? 1 : i >= b ? 0 : clamp01((t - (i - a) * gap) / D)));
        const k = Math.max(a, Math.min(b - 1, a + Math.floor(t / gap))), pt = AKHairs.point(hairs[k], clamp01((t - (k - a) * gap) / D));
        px = px === null ? pt[0] : px + (pt[0] - px) * 0.3; py = py === null ? pt[1] : py + (pt[1] - py) * 0.3;
        pen.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
        if (t < span + D) { hraf = requestAnimationFrame(f); return; }
        stage.classList.remove('drawing'); shown = b; paint((i) => (i < b ? 1 : 0));
      };
      hraf = requestAnimationFrame(f);
    };
    let rzT = 0;
    addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (hctx) { fit(); if (shown) paint((i) => (i < shown ? 1 : 0)); } }, 200); });
    const chips = $$('#simChips button'), title = $('#simTitle'), text = $('#simText'), bar = $('#simBar'), num = $('#simNum');
    let cur = -1, timer = null, visible = false, manual = false;
    const sweep = (slow) => { brush.classList.remove('go', 'slow'); void brush.offsetWidth; brush.classList.add('go'); if (slow) brush.classList.add('slow'); };
    const show = (n) => {
      const prev = cur; cur = n;
      if (n < prev) { stage.classList.add('reset'); void stage.offsetWidth; }
      for (let k = 1; k <= 6; k++) stage.classList.toggle('s' + k, k <= n);
      sp1.classList.toggle('on', n >= 3);
      if (n === 4) { if (prev !== 4) drawRange(0, nMain, 2300); }
      else if (n === 5) { if (prev !== 5) drawRange(nMain, hairs.length, 1350); }
      else setHairs(n === 6 ? hairs.length : 0);
      if (n < prev) requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('reset')));
      if (n === 3 && n > prev) sweep(false);
      chips.forEach((c, i) => c.classList.toggle('on', i === n));
      title.textContent = STEPS[n][0]; text.textContent = STEPS[n][1];
      title.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'ease-out' });
      bar.style.width = ((n + 1) / 7 * 100) + '%';
      num.textContent = String(n + 1).padStart(2, '0');
      const chip = chips[n]; const row = chip.parentElement;
      row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' });
    };
    const DUR = [1050, 1500, 1300, 1350, 2950, 1950, 3000];
    const tick = () => {
      clearTimeout(timer);
      if (!visible || manual) return;
      timer = setTimeout(() => { show((cur + 1) % 7); tick(); }, DUR[cur]);
    };
    // once she picks a step herself, the automatic run stops and stays on her choice
    chips.forEach((c, i) => c.addEventListener('click', () => { manual = true; clearTimeout(timer); show(i); }));
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) tick(); else clearTimeout(timer); }, { threshold: 0.4 }).observe(stage);
    show(0);
  })();


  /* ------------------------------------------------------------------
     Story Q&A player (her answers from Instagram stories)
     ------------------------------------------------------------------ */
  (() => {
    const box = $('#sq'); if (!box) return;
    const QA = [
      { q: 'מה החוויה הכי רעה שעברת עם גבות?', reply: 'הלכתי לעשות גבות ויצאתי בלי גבות', a: ['הסיוט של כל בחורה.', 'אין אחת שנכנסת אליי <mark>בלי לספר לי את זה</mark> במשפט הראשון.'], v: 'v-micro-work' },
      { q: 'מה זה קורס טריפל?', a: ['קורס שמשלב שלושה קורסים:', '<span class="li">עיצוב ושיקום גבות טבעיות</span>', '<span class="li">הרמת ריסים והרמת גבות</span>', '<span class="li">מיקרובליידינג</span>', 'הכל <mark>אחת על אחת</mark>, מותאם אלייך.'], v: 'v-taste' },
      { q: 'כמה זמן זה לוקח?', a: ['בממוצע <mark>חודש וחצי</mark>, ואת יוצאת עם מקצוע.', 'הכל תלוי בקצב שלך ובתאריכים הפנויים.'], v: 'v-funday' },
      { q: 'הקורס כולל חומרים וציוד לתחילת העבודה?', a: ['כמות חומרים שמספיקה להרבה זמן אחרי שמתחילים לעבוד.', 'אחרי הקורס אין לך מה לקנות <mark>חוץ ממיטה וכפפות</mark>.'], v: 'v-kit' },
      { q: 'למדתי עיצוב גבות ולא עשיתי עם זה כלום. מה עושים?', a: ['להתחיל מהמעגל הקרוב: חברות ומשפחה.', 'אחר כך לעבור למודליסטיות, להשתפשף ולא לוותר לעצמך.', 'והכי חשוב: כשאת נרשמת לקורס, <mark>תוודאי שיש לך ליווי</mark>.'], v: 'v-studio' },
      { q: 'את מקבלת גם לטיפולים?', a: ['בטח, זאת האהבה שלי.', 'אני מקבלת לטיפולים <mark>בקליניקה ברמת גן</mark>.'], v: 'v-lash-course', cta: true },
    ];
    const bars = $('#sqBars'), body = $('#sqBody'), bg = $('#sqBg'), poster = $('#sqPoster');
    // the next story's video loads in the background, so the switch is instant
    const warm = document.createElement('video'); warm.muted = true; warm.preload = 'auto'; warm.playsInline = true;
    const shown = () => bg.classList.remove('loading');
    ['playing', 'loadeddata'].forEach((ev) => bg.addEventListener(ev, () => { if (bg.readyState >= 2) shown(); }));
    bars.innerHTML = QA.map(() => '<span><i></i></span>').join('');
    const barEls = $$('span', bars);
    let i = 0, timer = null, visible = false, paused = false;
    const durOf = (it) => 2600 + it.a.join(' ').length * 55 + (it.reply ? 1400 : 0);
    const render = () => {
      const it = QA[i];
      // the still frame shows at once underneath; the video fades in only when it really plays (no black flash)
      poster.src = `assets/video/${it.v}.jpg`;
      if (!bg.src.endsWith(`${it.v}.mp4`)) { bg.classList.add('loading'); bg.poster = `assets/video/${it.v}.jpg`; bg.src = `assets/video/${it.v}.mp4`; }
      const p = bg.play(); if (p && p.catch) p.catch(() => {});
      body.innerHTML = `
        <div class="sq-q"><div class="sq-q-top">שאלה</div><div class="sq-q-txt">${it.q}</div></div>
        ${it.reply ? `<div class="sq-reply"><span>תשובה של עוקבת</span>${it.reply}</div>` : ''}
        <div class="sq-a">${it.a.map((l, k) => `<p style="--k:${k}">${l}</p>`).join('')}</div>
        ${it.cta ? '<a class="btn btn-light btn-sm sq-cta" href="#treat">לקביעת תור</a>' : ''}`;
      const d = durOf(it);
      barEls.forEach((b, k) => { b.classList.toggle('done', k < i); b.classList.remove('run'); b.style.setProperty('--d', d + 'ms'); });
      void bars.offsetWidth; barEls[i].classList.add('run');
      clearTimeout(timer);
      if (visible && !paused) timer = setTimeout(next, d);
      // preload the next one: its still frame and its video
      const n = QA[(i + 1) % QA.length]; const pre = new Image(); pre.src = `assets/video/${n.v}.jpg`;
      if (!warm.src.endsWith(`${n.v}.mp4`)) { warm.src = `assets/video/${n.v}.mp4`; try { warm.load(); } catch (e) {} }
    };
    const next = () => { i = (i + 1) % QA.length; render(); };
    const prev = () => { i = (i - 1 + QA.length) % QA.length; render(); };
    // RTL story behaviour: left side = next, right side = previous
    $('#sqNext').addEventListener('click', next);
    $('#sqPrev').addEventListener('click', prev);
    const hold = (on) => { paused = on; box.classList.toggle('paused', on); if (on) { clearTimeout(timer); bg.pause(); } else { render(); } };
    box.addEventListener('pointerdown', (e) => { box._t = setTimeout(() => hold(true), 350); });
    box.addEventListener('pointerup', () => { clearTimeout(box._t); if (paused) hold(false); });
    box.addEventListener('pointerleave', () => { clearTimeout(box._t); if (paused) hold(false); });
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      if (visible) { if (!body.innerHTML) render(); else { clearTimeout(timer); timer = setTimeout(next, durOf(QA[i]) * 0.6); bg.play().catch(() => {}); } }
      else { clearTimeout(timer); bg.pause(); }
    }, { threshold: 0.45 }).observe(box);
  })();


  /* ------------------------------------------------------------------
     Treatment line-art animations (no photos)
     ------------------------------------------------------------------ */
  (() => {
    const boxes = $$('.tc-anim'); if (!boxes.length) return;
    let seed = 3; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const X = (t) => 174 - 146 * t;
    const up = (t) => (t < 0.6 ? 72 - 25 * Math.sin((Math.PI / 2) * (t / 0.6)) : 47 + 16 * Math.pow((t - 0.6) / 0.4, 1.3));
    const low = (t) => (t < 0.6 ? 94 - 29 * Math.sin((Math.PI / 2) * (t / 0.6)) : 65 + 6 * ((t - 0.6) / 0.4));
    const outline = () => { let d = ''; for (let t = 0; t <= 1.001; t += 0.05) d += (d ? ' L' : 'M') + X(t).toFixed(1) + ' ' + low(t).toFixed(1); for (let t = 1; t >= -0.001; t -= 0.05) d += ' L' + X(t).toFixed(1) + ' ' + up(t).toFixed(1); return d + 'Z'; };
    const hair = (t, k = 1, angOff = 0) => {
      const h = low(t) - up(t); const bx = X(t) + (rnd() - 0.5) * 3; const by = low(t) - rnd() * h * 0.3;
      const a = (-95 - 70 * Math.pow(t, 0.85) + angOff + (rnd() - 0.5) * 10) * Math.PI / 180; const L = h * (0.8 + rnd() * 0.35) * k;
      const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L; const cx = (bx + ex) / 2 + Math.cos(a + 1.57) * L * 0.12, cy = (by + ey) / 2 + Math.sin(a + 1.57) * L * 0.12;
      return { d: `M${bx.toFixed(1)} ${by.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, bx, by };
    };
    const eye = '<path class="la-eye" d="M48 118 Q100 92 152 118 Q100 136 48 118Z"/><circle class="la-iris" cx="100" cy="116" r="11"/>';
    const build = {
      brows() {
        let h = ''; for (let i = 0; i < 30; i++) { const t = i / 29; h += `<path class="la-h" style="--d:${300 + i * 45}ms" d="${hair(t).d}"/>`; }
        let st = ''; for (let i = 0; i < 7; i++) { const t = 0.1 + rnd() * 0.8; const y = up(t) - 6 - rnd() * 10; st += `<path class="la-st" d="M${X(t).toFixed(1)} ${y.toFixed(1)} l${(rnd() * 6 - 3).toFixed(1)} -7"/>`; }
        return `<path class="la-out" d="${outline()}"/>${h}${st}`;
      },
      micro() {
        let h = ''; const pts = [];
        for (let i = 0; i < 34; i++) { const t = i / 33; const o = hair(t, 1.05); pts.push(o); h += `<path class="la-m" style="--d:${i * 70}ms" d="${o.d}"/>`; }
        return `<path class="la-guide" d="${outline()}"/>${h}<g class="la-blade" style="--x0:${pts[0].bx}px;--y0:${pts[0].by}px;--x1:${pts[pts.length - 1].bx}px;--y1:${pts[pts.length - 1].by}px"><line x1="0" y1="0" x2="16" y2="-16"/><circle cx="0" cy="0" r="2.2"/></g>`;
      },
      lash() {
        const P = (u) => ({ x: (1 - u) * (1 - u) * 40 + 2 * (1 - u) * u * 100 + u * u * 160, y: (1 - u) * (1 - u) * 92 + 2 * (1 - u) * u * 48 + u * u * 92 });
        let l = ''; for (let i = 0; i < 13; i++) { const u = 0.1 + (i / 12) * 0.8; const p = P(u); const s2 = (u - 0.5) * 2; const len = 16 + (1 - Math.abs(s2)) * 8;
          l += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><path class="la-l" style="--a0:${(s2 * 70 + (s2 < 0 ? -20 : 20)).toFixed(0)}deg;--a1:${(s2 * 26).toFixed(0)}deg" d="M0 0 Q ${(-s2 * 3).toFixed(1)} ${(-len * 0.55).toFixed(1)} ${(s2 * 7).toFixed(1)} ${(-len).toFixed(1)}"/></g>`; }
        return `<path class="la-eye" d="M40 92 Q100 48 160 92 Q100 124 40 92Z"/><circle class="la-iris" cx="100" cy="90" r="14"/>${l}`;
      },
      lift() {
        let h = ''; for (let i = 0; i < 26; i++) { const t = i / 25; const hh = low(t) - up(t); const bx = X(t), by = low(t) - 2; const L = hh * 0.85;
          const flat = (-170 + 20 * t), upA = (-95 - 40 * t);
          h += `<g transform="translate(${bx.toFixed(1)} ${by.toFixed(1)})"><line class="la-f" style="--a0:${(flat + 90).toFixed(0)}deg;--a1:${(upA + 90).toFixed(0)}deg;--d:${i * 25}ms" x1="0" y1="0" x2="0" y2="${(-L).toFixed(1)}"/></g>`; }
        return `${h}<g class="la-spool"><rect x="-26" y="-3" width="52" height="6" rx="3"/><line x1="26" y1="0" x2="58" y2="0"/></g>${eye}`;
      },
    };
    boxes.forEach((b) => { if (b.dataset.anim && build[b.dataset.anim]) b.innerHTML = `<svg viewBox="0 0 200 140" aria-hidden="true">${build[b.dataset.anim]()}</svg>`; });
    const io2 = new IntersectionObserver((en) => en.forEach((e) => e.target.classList.toggle('play', e.isIntersecting)), { threshold: 0.3 });
    boxes.forEach((b) => io2.observe(b));
  })();

  /* tint picker */
  (() => {
    const card = $('#tintCard'); if (!card) return;
    const imgs = $$('.tint-img', card), sws = $$('.sw', card), name = $('#tintName');
    const NAMES = ['חום בהיר', 'חום כהה', 'שחור רך'];
    let cur = 0, auto = true, t = null;
    const set = (n) => { cur = n; imgs.forEach((im) => im.classList.toggle('on', +im.dataset.t === n)); sws.forEach((b) => b.classList.toggle('on', +b.dataset.t === n)); name.textContent = NAMES[n]; };
    sws.forEach((b) => b.addEventListener('click', () => { auto = false; clearInterval(t); set(+b.dataset.t); }));
    new IntersectionObserver((en) => { clearInterval(t); if (en[0].isIntersecting && auto) t = setInterval(() => set((cur + 1) % 3), 2200); }, { threshold: 0.5 }).observe(card);
  })();

  /* lash before/after auto compare */
  $$('[data-compare]').forEach((el) => {
    new IntersectionObserver((en) => el.classList.toggle('run', en[0].isIntersecting && !el.classList.contains('held')), { threshold: 0.3 }).observe(el);
    const setX = (x) => { const r = el.getBoundingClientRect(); const p = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)); el.style.setProperty('--cmp', p + '%'); };
    let sx = 0, sy = 0, lock = null, down = false;
    el.addEventListener('pointerdown', (e) => { down = true; el.classList.add('held'); el.classList.remove('run'); setX(e.clientX); });
    el.addEventListener('pointermove', (e) => { if (down && e.pointerType === 'mouse') setX(e.clientX); });
    addEventListener('pointerup', () => { down = false; });
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; lock = null; }, { passive: true });
    el.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (lock === null) lock = Math.abs(t.clientX - sx) > Math.abs(t.clientY - sy) ? 'x' : 'y'; if (lock === 'x') { e.preventDefault(); el.classList.add('held'); el.classList.remove('run'); setX(t.clientX); } }, { passive: false });
  });

  /* ------------------------------------------------------------------
     Loader
     ------------------------------------------------------------------ */
  const loader = $('#loader');
  const hero = $('.hero');
  const heroImg = $('#heroImg');
  const startHero = () => {
    document.body.classList.remove('is-loading');
    // the loader locks scrolling, so honour a #section link once it lifts
    if (location.hash.length > 1) { try { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 60); } catch (e) {} }
    hero && hero.classList.add('ready');
    
    window.dispatchEvent(new Event('scroll'));
  };
  const imgReady = new Promise((res) => {
    if (!heroImg || heroImg.complete) return res();
    heroImg.addEventListener('load', res, { once: true });
    heroImg.addEventListener('error', res, { once: true });
  }).then(() => (heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : null));
  let quick = false;
  try { quick = !!sessionStorage.getItem('akSeen'); sessionStorage.setItem('akSeen', '1'); } catch (e) {}
  const minTime = new Promise((r) => setTimeout(r, reduce ? 200 : quick ? 250 : 2500));
  const maxTime = new Promise((r) => setTimeout(r, quick ? 2000 : 4800));

  // Closing: the logo fades softly, and the cream veil opens from the centre with a feathered edge.
  const veil = $('#ldVeil');
  const setVeil = () => {
    if (!veil) return;
    const vw = innerWidth, vh = innerHeight;
    veil.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    $('.ld-lid', veil).setAttribute('d', `M-2 -2H${vw + 2}V${vh + 2}H-2Z`);
    $('#ldBg').setAttribute('gradientTransform', `translate(${vw / 2} ${vh * 0.45}) scale(${vw * 0.8} ${vh * 0.8})`);
  };
  setVeil();
  addEventListener('resize', () => { if (!loaderRan) setVeil(); });
  const openVeil = () => {
    const vw = innerWidth, vh = innerHeight, R = Math.hypot(vw, vh) / 2, F = Math.max(vw, vh) * 0.35;
    const io = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const cl = (v) => Math.max(0, Math.min(1, v));
    const D0 = quick ? 0 : 160, D = quick ? 850 : 1250;
    let started = false, t0 = 0;
    loader.classList.add('closing');
    const step = (now) => {
      if (!t0) t0 = now;
      const e = now - t0;
      if (e >= D0 * 0.6 && !started) { started = true; startHero(); }
      const p = io(cl((e - D0) / D));
      const r = -F + p * (R + F * 2);                           // feathered circle grows from the centre
      const m = `radial-gradient(circle at 50% 46%, transparent ${r.toFixed(1)}px, #000 ${(r + F).toFixed(1)}px)`;
      loader.style.webkitMaskImage = m; loader.style.maskImage = m;
      if (e >= D0 + D) { loader.classList.add('done'); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  let loaderRan = false;
  const runLoader = () => {
    if (loaderRan) return; loaderRan = true;
    if (!loader) return startHero();
    if (reduce) { loader.classList.add('fade'); setTimeout(() => { loader.classList.add('done'); }, 750); setTimeout(startHero, 200); return; }
    try { openVeil(); } catch (e) {
      loader.classList.add('fade'); setTimeout(() => loader.classList.add('done'), 700); startHero();
    }
  };
  if (loader) loader.addEventListener('click', () => imgReady.then(runLoader));
  Promise.race([Promise.all([imgReady, minTime]), maxTime]).then(runLoader);

  /* ------------------------------------------------------------------
     Header, progress, bottom bar
     ------------------------------------------------------------------ */
  const hdr = $('#hdr'), mbar = $('#mbar'), prog = $('#progress');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    const heroH = hero ? hero.offsetHeight : 600;
    hdr.classList.toggle('solid', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) hdr.classList.toggle('hide', y > heroH && y > lastY + 4);
    if (y < lastY - 4) hdr.classList.remove('hide');
    mbar && mbar.classList.toggle('show', y > heroH * 0.65);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // menu
  const menuBtn = $('#menuBtn'), drawer = $('#drawer');
  const setMenu = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) hdr.classList.remove('hide');
  };
  menuBtn && menuBtn.addEventListener('click', () => setMenu(!document.documentElement.classList.contains('menu-open')));
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.rv, .rv-clip, .split:not(#heroTitle), #aboutMedia').forEach((el) => io.observe(el));

  /* ------------------------------------------------------------------
     Videos: lazy load + play only when visible
     ------------------------------------------------------------------ */
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        const p = v.play(); if (p && p.catch) p.catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '120px 0px', threshold: 0.2 });
  const watchVideos = (root = document) => $$('video[data-src]', root).forEach((v) => vio.observe(v));
  watchVideos();

  /* ------------------------------------------------------------------
     Counters
     ------------------------------------------------------------------ */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; cio.unobserve(el);
      const to = parseFloat(el.dataset.count); const dec = +(el.dataset.dec || 0);
      const t0 = performance.now(); const dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur); const ease = 1 - Math.pow(1 - k, 4);
        const val = to * ease;
        el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString('en-US');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ------------------------------------------------------------------
     Demos play when visible
     ------------------------------------------------------------------ */
  const dio = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('anim', e.isIntersecting));
  }, { threshold: 0.35 });
  $$('[data-demo]').forEach((el) => dio.observe(el));

  /* ------------------------------------------------------------------
     Course tabs
     ------------------------------------------------------------------ */
  const tabs = $$('.tab'), ind = $('#tabInd'), tabsEl = $('#tabs');
  const moveInd = (btn) => {
    if (!ind || !btn) return;
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = `translateX(${btn.offsetLeft - 6}px)`;
    ind.style.left = '6px';
  };
  const openTab = (name, scroll) => {
    tabs.forEach((t) => { const on = t.dataset.tab === name; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); if (on) { moveInd(t); t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } });
    $$('.panel').forEach((p) => p.classList.toggle('on', p.id === 'p-' + name));
    watchVideos($('#p-' + name));
    if (scroll) { const top = $('#courses').getBoundingClientRect().top + scrollY - 20; scrollTo({ top, behavior: 'smooth' }); }
  };
  tabs.forEach((t) => t.addEventListener('click', () => openTab(t.dataset.tab, false)));
  $$('.panel').forEach((panel) => {
    const blocks = $$('.c-block', panel).filter((b) => /תלמדי|בערכה/.test($('h4', b).textContent));
    if (blocks.length < 2) return;
    const sw = document.createElement('div');
    sw.className = 'c-switch';
    sw.innerHTML = blocks.map((b, i) => `<button class="${i ? '' : 'on'}">${$('h4', b).textContent}</button>`).join('');
    blocks[0].before(sw);
    blocks.forEach((b, i) => { b.classList.add('c-pane'); if (i) b.hidden = true; });
    $$('button', sw).forEach((btn, i) => btn.addEventListener('click', () => {
      $$('button', sw).forEach((x) => x.classList.toggle('on', x === btn));
      blocks.forEach((b, k) => { b.hidden = k !== i; if (k === i) { $$('.chip', b).forEach((c) => { c.style.animation = 'none'; c.offsetWidth; c.style.animation = ''; }); watchVideos(b); } });
    }));
  });
  addEventListener('resize', () => moveInd($('.tab.on')));
  setTimeout(() => moveInd($('.tab.on')), 60);
  document.fonts && document.fonts.ready.then(() => moveInd($('.tab.on')));

  /* ------------------------------------------------------------------
     Before / After slider
     ------------------------------------------------------------------ */
  const BA = [
    { b: 'ba1-before', a: 'ba1-after', t: 'עיצוב גבות והרמת ריסים', d: 'גררי את הקו כדי לראות את ההבדל.' },
    { b: 'ba2-before', a: 'ba2-after', t: 'מיקרובליידינג על גבה עבה', d: 'גבה עבה שחסר לה בכמה מקומות.' },
  ];
  const slider = $('#slider');
  if (slider) {
    const before = $('.before', slider), after = $('.after', slider);
    let pos = 50, dragging = false, touched = false;
    const set = (p) => { pos = Math.max(0, Math.min(100, p)); slider.style.setProperty('--pos', pos + '%'); slider.setAttribute('aria-valuenow', Math.round(pos)); };
    const fromEvent = (x) => { const r = slider.getBoundingClientRect(); return ((x - r.left) / r.width) * 100; };
    slider.addEventListener('pointerdown', (e) => { dragging = true; touched = true; slider.setPointerCapture(e.pointerId); set(fromEvent(e.clientX)); });
    slider.addEventListener('pointermove', (e) => { if (dragging) set(fromEvent(e.clientX)); });
    const end = () => { dragging = false; };
    slider.addEventListener('pointerup', end); slider.addEventListener('pointercancel', end);
    slider.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') set(pos - 5); if (e.key === 'ArrowRight') set(pos + 5); });
    // touch: horizontal drag moves the handle, vertical scroll still works
    let sx = 0, sy = 0, lock = null;
    slider.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; lock = null; }, { passive: true });
    slider.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (lock === null) lock = Math.abs(t.clientX - sx) > Math.abs(t.clientY - sy) ? 'x' : 'y';
      if (lock === 'x') { e.preventDefault(); touched = true; set(fromEvent(t.clientX)); }
    }, { passive: false });
    // hint animation when visible
    const hint = () => {
      if (touched || reduce) return;
      const t0 = performance.now();
      const anim = (t) => {
        if (touched) return;
        const k = (t - t0) / 2400;
        if (k >= 1) { set(50); return; }
        set(50 + Math.sin(k * Math.PI * 2) * 28);
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    };
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { setTimeout(hint, 400); o.disconnect(); } }, { threshold: 0.6 }).observe(slider);
    $$('.ba-pill').forEach((p) => p.addEventListener('click', () => {
      $$('.ba-pill').forEach((x) => x.classList.toggle('on', x === p));
      const it = BA[+p.dataset.ba];
      slider.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
      setTimeout(() => {
        before.src = `assets/img/${it.b}.webp`; after.src = `assets/img/${it.a}.webp`;
        $('#baTitle').textContent = it.t; $('#baDesc').textContent = it.d;
        touched = false; set(50); setTimeout(hint, 300);
      }, 180);
    }));
    // preload others
    BA.slice(1).forEach((it) => { [it.b, it.a].forEach((n) => { const i = new Image(); i.src = `assets/img/${n}.webp`; }); });
  }

  /* ------------------------------------------------------------------
     WhatsApp chat sequence
     ------------------------------------------------------------------ */
  const chat = $('#chat');
  if (chat) {
    const msgs = $$('.msg', chat), typing = $('#typing');
    const body = $('#chatBody');
    // every message is in the chat from the start; each one "arrives" (highlight + reaction) as it scrolls into view
    typing.classList.add('show');
    body.scrollTop = 0;
    const seen = new IntersectionObserver((en) => en.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('show'); seen.unobserve(e.target); }
    }), { root: body, threshold: 0.2 });
    msgs.forEach((m) => seen.observe(m));
    // slow auto-scroll while she just looks; the moment she touches the chat it is hers
    if (!reduce) {
      const SPEED = 20; // px per second
      let pos = 0, last = 0, raf = 0, visible = false, manual = false, holdUntil = 0;
      const stop = () => { manual = true; cancelAnimationFrame(raf); body.style.opacity = ''; };
      ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach((ev) => body.addEventListener(ev, stop, { passive: true }));
      const tick = (now) => {
        raf = 0;
        if (manual || !visible || document.documentElement.classList.contains('a11y-still')) return;
        const dt = last ? Math.min(now - last, 60) : 0; last = now;
        if (Math.abs(body.scrollTop - Math.round(pos)) > 3) { stop(); return; } // she scrolled some other way
        if (now >= holdUntil) {
          const max = body.scrollHeight - body.clientHeight;
          pos = Math.min(max, pos + SPEED * dt / 1000);
          body.scrollTop = pos;
          if (pos >= max - 1) { // end of the chat: a short pause, then back to the top
            holdUntil = now + 3200;
            setTimeout(() => {
              if (manual) return;
              body.style.opacity = '0';
              setTimeout(() => { if (manual) return; pos = 0; body.scrollTop = 0; body.style.opacity = ''; holdUntil = performance.now() + 1500; }, 450);
            }, 2600);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        if (visible && !manual && !raf) {
          if (!holdUntil) holdUntil = performance.now() + 1200; // a beat to read the first message
          last = 0; raf = requestAnimationFrame(tick);
        }
      }, { threshold: 0.6 }).observe(chat);
    }
    // the phone leans toward the pointer on desktop
    if (!reduce && matchMedia('(hover: hover)').matches) {
      const stage = chat.parentElement;
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        chat.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
        chat.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 6}deg`);
      });
      stage.addEventListener('pointerleave', () => { chat.style.setProperty('--ry', '0deg'); chat.style.setProperty('--rx', '0deg'); });
    }
  }

  /* ------------------------------------------------------------------
     Steps rail
     ------------------------------------------------------------------ */
  const steps = $('#steps'), rail = $('#rail');
  const stepEls = steps ? $$('.step', steps) : [];
  const onRail = () => {
    if (!steps) return;
    const r = steps.getBoundingClientRect();
    const mid = innerHeight * 0.6;
    const k = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    rail.style.height = (k * 100) + '%';
    stepEls.forEach((s) => { const sr = s.getBoundingClientRect(); s.classList.toggle('lit', sr.top < mid); });
  };

  /* ------------------------------------------------------------------
     Parallax (cheap, transform only)
     ------------------------------------------------------------------ */
  const plx = $$('[data-parallax]'), plxImg = $$('[data-parallax-img]');
  plxImg.forEach((img) => { img.style.transform = 'scale(1.12)'; img.style.willChange = 'transform'; });
  let ticking = false;
  const onFrame = () => {
    ticking = false;
    onRail();
    if (reduce) return;
    const y = scrollY;
    plx.forEach((el) => { if (isDesktop()) { el.style.transform = ''; return; } if (y < innerHeight * 1.2) el.style.transform = `translate3d(0, ${y * +el.dataset.parallax}px, 0)`; });
    plxImg.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `translate3d(0, ${(-k * 100 * +img.dataset.parallaxImg).toFixed(1)}%, 0) scale(1.12)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  onFrame();

  /* ------------------------------------------------------------------
     Horizontal scroll progress bars
     ------------------------------------------------------------------ */
  const bindBar = (row, bar) => {
    if (!row || !bar) return;
    const upd = () => {
      const max = row.scrollWidth - row.clientWidth;
      const k = max > 0 ? Math.abs(row.scrollLeft) / max : 0;
      bar.style.width = (18 + k * 82) + '%';
    };
    row.addEventListener('scroll', upd, { passive: true }); upd();
  };
  bindBar($('#reelsRow'), $('#reelsBar'));
  bindBar($('#gradsRow'), $('#gradsBar'));
  // the arrow next to "החליקי" moves the row one card forward (and back to the start at the end)
  $$('.hs-go').forEach((b) => b.addEventListener('click', () => {
    const row = document.getElementById(b.dataset.row); if (!row) return;
    const card = row.firstElementChild, step = card ? card.getBoundingClientRect().width + 12 : row.clientWidth * 0.8;
    const max = row.scrollWidth - row.clientWidth;
    const atEnd = Math.abs(row.scrollLeft) >= max - 8;
    row.scrollTo({ left: atEnd ? 0 : row.scrollLeft - step, behavior: 'smooth' }); // RTL: forward is negative
  }));

  /* ------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------ */
  const lb = $('#lb'), lbInner = $('#lbInner'), lbFoot = $('#lbFoot');
  const openLb = (html, foot, isImg) => {
    lbInner.className = 'lb-inner' + (isImg ? ' img' : '');
    lbInner.innerHTML = html; lbFoot.innerHTML = foot || '';
    lb.classList.add('open'); document.body.style.overflow = 'hidden';
    const v = $('video', lbInner); if (v) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  };
  const closeLb = () => { lb.classList.remove('open'); lbInner.innerHTML = ''; document.body.style.overflow = ''; };
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLb(); setMenu(false); } });
  document.addEventListener('click', (e) => {
    const vEl = e.target.closest('[data-video]');
    if (vEl) {
      e.preventDefault();
      const link = vEl.dataset.link;
      openLb(`<video src="${vEl.dataset.video}" controls playsinline autoplay></video>`,
        link ? `<a class="btn btn-ig btn-sm" style="width:auto" href="${link}" target="_blank" rel="noopener"><svg class="icon"><use href="#i-ig"/></svg>לצפייה באינסטגרם</a><a class="btn btn-wa btn-sm" href="${wa(WA_MSG.hello)}" target="_blank" rel="noopener"><svg class="icon fill"><use href="#i-wa"/></svg>לדבר עם אביגיל</a>` : '');
      return;
    }
    const iEl = e.target.closest('[data-img]');
    if (iEl) { e.preventDefault(); openLb(`<img src="${iEl.dataset.img}" alt="">`, '', true); }
  });

  /* ------------------------------------------------------------------
     Quiz
     ------------------------------------------------------------------ */
  (() => {
    const card = $('#quizCard'); if (!card) return;
    const steps = $$('.qz-step', card), bar = $('#qzBar');
    const keys = ['level', 'want', 'format', 'when'];
    const ans = {};
    const go = (i) => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); bar.style.width = [10, 34, 58, 80, 100][i] + '%'; };
    const TXT = {
      level: { zero: 'אני מתחילה מאפס', beauty: 'אני כבר עובדת בתחום היופי', again: 'עשיתי קורס, אבל אני עוד לא בטוחה בעצמי' },
      format: { group: 'אני מעדיפה ללמוד בקבוצה.', solo: 'אני מעדיפה ללמוד לבד, אחת על אחת.', any: '' },
      when: { asap: 'אני רוצה להתחיל כמה שיותר מהר.', soon: 'אני רוצה להתחיל בחודשיים הקרובים.', look: 'אני עוד לא יודעת מתי להתחיל.' },
    };
    const WHEN_NOTE = { asap: 'כתבי לאביגיל ותבדקו יחד את המועד הקרוב.', soon: 'אפשר כבר עכשיו לשריין מועד.', look: 'אפשר לשאול אותה הכל, בלי התחייבות.' };
    const showResult = () => {
      try { window.akTrack && window.akTrack('quiz'); } catch (_) {}
      const c = QUIZ[ans.want];
      let why = (QUIZ_WHY[ans.level] || QUIZ_WHY.zero)[ans.want];
      const group = ans.want === 'brows' || ans.want === 'lash';
      if (ans.format === 'solo' && group) why += ' אפשר ללמוד אותו גם בקורס פרטני, אחת על אחת.';
      if (ans.format === 'group' && !group && !why.includes('אחת על אחת')) why += ' הקורס הזה נלמד אחת על אחת, לא בקבוצה.';
      $('#qzName').textContent = c.name;
      $('#qzWhy').textContent = `${why} ${WHEN_NOTE[ans.when] || ''}`.trim();
      const msg = [`היי אביגיל, עשיתי את השאלון באתר. ${TXT.level[ans.level]}, ויצא לי שמתאים לי קורס ${c.name}.`, TXT.format[ans.format], TXT.when[ans.when], 'אשמח לשמוע פרטים'].filter(Boolean).join(' ');
      $('#qzWa').href = wa(msg);
    };
    keys.forEach((key, i) => {
      const opts = $$(`.qz-step[data-step="${i}"] .qz-opt`, card);
      opts.forEach((b) => b.addEventListener('click', () => {
        ans[key] = b.dataset.a; opts.forEach((x) => x.classList.toggle('picked', x === b));
        if (i === keys.length - 1) showResult();
        setTimeout(() => go(i + 1), 260);
      }));
    });
    $('#qzSee').addEventListener('click', () => openTab(QUIZ[ans.want || 'brows'].tab, true));
    $('#qzRestart').addEventListener('click', () => { $$('.qz-opt', card).forEach((x) => x.classList.remove('picked')); go(0); });
  })();

  /* ------------------------------------------------------------------
     Lead form → WhatsApp message to Avigail
     ------------------------------------------------------------------ */
  const form = $('#leadForm');
  const intlPhone = (p) => { const d = p.replace(/\D/g, ''); return d.startsWith('972') ? d : d.startsWith('0') ? '972' + d.slice(1) : d; };
  const sendLead = async (text) => {
    const r = await fetch(window.AK_API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'lead', text }) });
    const d = await r.json().catch(() => null);
    return !!(d && d.ok);
  };
  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    if ((f.get('company') || '').toString()) return; // bot trap
    const v = (k) => (f.get(k) || '').toString().trim();
    const name = v('name'), phone = v('phone');
    let bad = false;
    [['name', name.length < 2], ['phone', phone.replace(/\D/g, '').length < 9]].forEach(([k, isBad]) => { form[k].style.borderColor = isBad ? '#e9b9a6' : ''; if (isBad) bad = true; });
    if (bad) { (name.length < 2 ? form.name : form.phone).focus(); return; }
    try { const last = +localStorage.getItem('ak_lead_ts') || 0; if (Date.now() - last < 60000) return; } catch (_) {}
    const lines = [
      '*ליד חדש מהאתר*',
      '',
      `*שם:* ${name}`,
      `*טלפון:* ${phone}`,
      `*מתעניינת ב:* ${v('course')}`,
      `*ניסיון:* ${v('exp')}`,
      `*נוח לחזור:* ${v('when')}`,
    ];
    if (v('note')) lines.push(`*הערה:* ${v('note')}`);
    lines.push('', `לשליחת הודעה אליה: https://wa.me/${intlPhone(phone)}`);
    const text = lines.join('\n');
    const botReady = !!window.AK_API;
    if (!botReady) {
      window.open(wa(text), '_blank', 'noopener'); // until the bot key is set: open WhatsApp with the message ready
    } else {
      const btn = $('#leadBtn'); btn.disabled = true; btn.textContent = 'שולחת...';
      let ok = false;
      try { ok = await sendLead(text); } catch (_) { ok = false; }
      if (!ok) { btn.disabled = false; btn.textContent = 'שליחה'; location.href = wa(text); return; }
    }
    try { localStorage.setItem('ak_lead_ts', String(Date.now())); } catch (_) {}
    $('#doneName').textContent = name.split(' ')[0];
    $('#formIn').hidden = true; $('#formDone').hidden = false;
    try { window.akTrack && window.akTrack('lead', { course: v('course') }); } catch (_) {}
  });
})();
