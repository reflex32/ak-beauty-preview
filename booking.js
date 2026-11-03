/* ==========================================================================
   Booking — Avigail's own booking system.
   Front: this file. Back: the Google Apps Script web app in backend/Code.gs
   (free times from her hours + calendar, saves the booking, puts it in her
   calendar and sends her a WhatsApp message).
   Until API_URL is set, the flow still works: free times come from the opening
   hours below and the booking is sent to Avigail as a ready WhatsApp message.
   ========================================================================== */
(() => {
  'use strict';
  const root = document.getElementById('bk');
  if (!root) return;

  const API_URL = window.AK_API || ''; // set once in config.js after deploying backend/Code.gs
  const AVIGAIL_WA = '972502774797';
  const PLACE = { ll: '32.0526698,34.8488945', label: 'AK Beauty Academy, בית הרופאים, גילדסגיים 4, רמת גן' };
  const DEMO = /[?&]bkdemo\b/.test(location.search); // preview only: fake busy slots, no messages

  // Shown right away; replaced by the live list from the sheet when the API answers.
  let SERVICES = [
    { key: 'brow', cat: 'גבות', name: 'עיצוב גבות טבעיות', price: 100, minutes: 30, deposit: 0 },
    { key: 'brow-lip', cat: 'גבות', name: 'עיצוב גבות + שפם', price: 120, minutes: 40, deposit: 0 },
    { key: 'lip', cat: 'גבות', name: 'שפם', price: 30, minutes: 10, deposit: 0 },
    { key: 'tint', cat: 'גבות', name: 'צבע גבות', price: 20, minutes: 15, deposit: 0 },
    { key: 'brow-lift', cat: 'גבות', name: 'הרמת גבות', price: 250, minutes: 60, deposit: 0 },
    { key: 'lash-lift', cat: 'ריסים', name: 'הרמת ריסים', price: 300, minutes: 60, deposit: 50 },
    { key: 'lash-brow-lift', cat: 'ריסים', name: 'הרמת ריסים + הרמת גבות', price: 500, minutes: 90, deposit: 50 },
    { key: 'micro', cat: 'מיקרובליידינג', name: 'מיקרובליידינג', price: 2000, minutes: 150, deposit: 200 },
    { key: 'micro-2', cat: 'מיקרובליידינג', name: 'מיקרובליידינג, טיפול שני', price: null, minutes: 90, deposit: 0 },
    { key: 'tattoo-s', cat: 'הסרת קעקועים', name: 'הסרת קעקוע קטן', price: 250, minutes: 15, deposit: 0 },
    { key: 'tattoo-m', cat: 'הסרת קעקועים', name: 'הסרת קעקוע בינוני', price: 300, minutes: 20, deposit: 0 },
    { key: 'tattoo-l', cat: 'הסרת קעקועים', name: 'הסרת קעקוע גדול', price: 350, minutes: 30, deposit: 0 },
  ];
  let HOURS = { 0: ['07:00', '19:30'], 1: ['07:00', '19:30'], 2: ['07:00', '20:00'], 3: ['07:00', '19:30'], 4: ['07:00', '19:30'], 5: null, 6: null };
  let STEP = 15;
  let HORIZON = 90; // days ahead clients can book
  const CATS = [
    { cat: 'גבות', img: 'assets/img/ill-brow-b.webp', sub: 'עיצוב, צבע, שפם' },
    { cat: 'ריסים', img: 'assets/img/ill-lash-b.webp', sub: 'הרמה וצבע' },
    { cat: 'מיקרובליידינג', img: 'assets/img/ill-brow-a.webp', sub: 'שערה אחרי שערה' },
    { cat: 'הסרת קעקועים', img: 'assets/img/ill-tattoo.webp', sub: 'לפי גודל' },
  ];

  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const ils = (n) => `₪${Number(n).toLocaleString('he-IL')}`;
  const DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAY_S = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const MONTH = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const localPhone = (v) => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('972')) d = '0' + d.slice(3); return d; };
  const HRS = { 60: 'שעה', 90: 'שעה וחצי', 120: 'שעתיים', 150: 'שעתיים וחצי', 180: '3 שעות' };
  const mins = (n) => (n < 60 ? `${n} דק׳` : HRS[n] || `${Math.floor(n / 60)}:${pad(n % 60)} ש׳`);
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };

  const S = { cat: 'גבות', sel: new Set(), days: [], day: null, time: null, from: null };
  const picked = () => SERVICES.filter((s) => S.sel.has(s.key));
  const sum = (f) => picked().reduce((a, s) => a + (s[f] || 0), 0);
  const deposit = () => picked().reduce((a, s) => Math.max(a, s.deposit || 0), 0);

  /* ---------------- API ---------------- */
  const api = {
    async config() {
      if (!API_URL) return null;
      const r = await fetch(`${API_URL}?action=config`); const d = await r.json();
      return d && d.ok ? d : null;
    },
    async week(from, minutes) {
      if (API_URL && !DEMO) {
        const r = await fetch(`${API_URL}?action=slots&from=${from}&minutes=${minutes}`); const d = await r.json();
        if (!d.ok) throw new Error(d.error || 'slots');
        return d.days;
      }
      return localWeek(from, minutes);
    },
    async book(b) {
      if (DEMO) { await new Promise((r) => setTimeout(r, 900)); return { ok: true, returning: !!recall(), name: b.name.split(' ')[0] }; }
      // text/plain keeps it a simple request (no CORS preflight) for Apps Script
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'book', ...b }) });
      return r.json();
    },
    async waitlist(b) {
      if (DEMO) { await new Promise((r) => setTimeout(r, 700)); return { ok: true, name: b.name.split(' ')[0] }; }
      const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'waitlist', ...b }) });
      return r.json();
    },
  };

  // free times from the opening hours (used until the API is connected, and in preview)
  function localWeek(from, minutes) {
    const out = [], now = Date.now() + 120 * 6e4, start = fromYmd(from);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const h = HOURS[d.getDay()], free = [];
      if (h) {
        const [oh, om] = h[0].split(':').map(Number), [ch, cm] = h[1].split(':').map(Number);
        const open = new Date(d).setHours(oh, om, 0, 0), close = new Date(d).setHours(ch, cm, 0, 0);
        for (let t = open; t + minutes * 6e4 <= close; t += STEP * 6e4) {
          if (t < now) continue;
          if (DEMO && ((t / 6e4 + d.getDate() * 7) % 97) < 38) continue;
          const x = new Date(t); free.push(`${pad(x.getHours())}:${pad(x.getMinutes())}`);
        }
      }
      out.push({ date: ymd(d), free, reason: h ? '' : 'סגור' });
    }
    return out;
  }

  /* ---------------- steps ---------------- */
  const panes = $$('.bk-pane'), steps = $$('.bk-steps li'), bar = $('#bkBar'), prog = $('#bkProg');
  const go = (n, opts = {}) => {
    panes.forEach((p) => p.classList.toggle('on', +p.dataset.pane === n));
    steps.forEach((li) => { const s = +li.dataset.s; li.classList.toggle('on', s === n); li.classList.toggle('done', s < n || n === 4); });
    root.dataset.step = n;
    prog.style.transform = `scaleX(${[0, 0.18, 0.55, 0.85, 1][n]})`;
    syncBar();
    if (!opts.stay) {
      const top = root.getBoundingClientRect().top + scrollY - 84;
      if (Math.abs(scrollY - top) > 60) scrollTo({ top, behavior: 'smooth' });
    }
  };
  $$('[data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
  steps.forEach((li) => li.addEventListener('click', () => {
    const s = +li.dataset.s, cur = +root.dataset.step;
    if (s >= cur) return;
    if (cur === 4 && s > 1 && S.day == null) return;
    if (cur === 4) S.days = []; // after a booking, free times must be fetched fresh
    go(s);
    if (s === 2) loadDates();
    if (s === 3) { renderTicket($('#bkTicket')); etaPaint(); prefill(); }
  }));

  /* ---------------- 1. treatment ---------------- */
  const catsEl = $('#bkCats'), listEl = $('#bkList');
  const fromPrice = (cat) => { const p = SERVICES.filter((s) => s.cat === cat && s.price).map((s) => s.price); return p.length ? Math.min(...p) : null; };
  const renderCats = () => {
    catsEl.innerHTML = CATS.map((c) => {
      const n = SERVICES.filter((s) => s.cat === c.cat && S.sel.has(s.key)).length;
      const fp = fromPrice(c.cat);
      return `<button type="button" class="bk-cat${S.cat === c.cat ? ' on' : ''}" data-cat="${c.cat}" role="tab" aria-selected="${S.cat === c.cat}">
        <span class="bk-cat-img"><img src="${c.img}" alt="" loading="lazy">${n ? `<i class="bk-cat-n">${n}</i>` : ''}</span>
        <b>${c.cat}</b><small>${fp ? `מ־${ils(fp)}` : c.sub}</small></button>`;
    }).join('');
    $$('.bk-cat', catsEl).forEach((b) => b.addEventListener('click', () => { if (S.cat !== b.dataset.cat) { S.cat = b.dataset.cat; buzz(); renderCats(); renderList(); } }));
  };
  const renderList = () => {
    const items = SERVICES.filter((s) => s.cat === S.cat);
    listEl.innerHTML = items.map((s, i) => `
      <button type="button" class="bk-item${S.sel.has(s.key) ? ' on' : ''}" data-k="${s.key}" aria-pressed="${S.sel.has(s.key)}" style="--i:${i}">
        <span class="bk-check"><svg class="icon"><use href="#i-check"/></svg></span>
        <span class="bk-item-t"><b>${s.name}</b><small>${mins(s.minutes)}${s.deposit ? ` · מקדמה ${ils(s.deposit)}` : ''}</small></span>
        <span class="bk-price">${s.price ? ils(s.price) : '<small>טיפול המשך</small>'}</span>
      </button>`).join('');
    $$('.bk-item', listEl).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.k;
      S.sel.has(k) ? S.sel.delete(k) : S.sel.add(k);
      b.classList.toggle('on', S.sel.has(k)); b.setAttribute('aria-pressed', S.sel.has(k));
      if (S.sel.has(k)) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); buzz(); }
      S.days = []; S.day = S.time = null; // the length changed, so free times must be fetched again
      renderCats(); syncBar();
    }));
  };
  const syncBar = () => {
    const n = S.sel.size, step = root.dataset.step;
    const t = $('#bkBarT'), sEl = $('#bkBarS');
    if (n) {
      t.textContent = n === 1 ? picked()[0].name : `${n} טיפולים`;
      sEl.textContent = [sum('price') ? ils(sum('price')) : '', mins(sum('minutes'))].filter(Boolean).join(' · ');
      bar.classList.add('bump'); setTimeout(() => bar.classList.remove('bump'), 300);
    }
    bar.classList.toggle('show', n > 0 && step === '1');
  };
  $('#bkToTime').addEventListener('click', () => { if (S.sel.size) { go(2); loadDates(); } });

  /* ---------------- 2. date & time ---------------- */
  const datesEl = $('#bkDates'), slotsEl = $('#bkSlots'), msg2 = $('#bkMsg2');
  const loadDates = async (more, startAt) => {
    const minutes = sum('minutes') || 30;
    $('#bkChosen2').textContent = picked().map((s) => s.name).join(' · ');
    if (!more) {
      if (S.days.length && !startAt) return renderDates();
      S.days = []; S.day = null; S.want = startAt || null;
      S.from = startAt || ymd(new Date());
      datesEl.innerHTML = '<div class="bk-skel">' + '<i></i>'.repeat(7) + '</div>';
      slotsEl.innerHTML = ''; msg2.textContent = '';
    }
    try {
      const weeks = more ? [S.from] : [S.from, ymd(new Date(fromYmd(S.from).getTime() + 7 * 864e5))];
      const res = await Promise.all(weeks.map((w) => api.week(w, minutes)));
      res.forEach((d) => S.days.push(...d));
      S.from = ymd(new Date(fromYmd(S.days[S.days.length - 1].date).getTime() + 864e5));
      renderDates();
    } catch (e) {
      datesEl.innerHTML = ''; msg2.innerHTML = 'לא הצלחנו לטעון מועדים. <a href="https://wa.me/' + AVIGAIL_WA + '" target="_blank" rel="noopener">כתבי לאביגיל בוואטסאפ</a>';
    }
  };
  const renderDates = () => {
    const today = ymd(new Date()), tomorrow = ymd(new Date(Date.now() + 864e5));
    datesEl.innerHTML = S.days.map((d, i) => {
      const dt = fromYmd(d.date), free = d.free.length;
      const label = d.date === today ? 'היום' : d.date === tomorrow ? 'מחר' : DAY_S[dt.getDay()];
      return `<button type="button" class="bk-date${free ? '' : ' off'}${S.day === i ? ' on' : ''}" data-i="${i}" ${free ? '' : 'disabled'} aria-label="${DAY[dt.getDay()]} ${dt.getDate()} ${MONTH[dt.getMonth()]}${free ? '' : ', אין מקום'}">
        <small>${label}</small><b>${dt.getDate()}</b><i>${free ? (free > 6 ? 'פנוי' : 'מעט') : (d.reason || 'מלא')}</i></button>`;
    }).join('') + '<button type="button" class="bk-date more" id="bkMore"><small>עוד</small><b>+</b><i>תאריכים</i></button>';
    $$('.bk-date[data-i]', datesEl).forEach((b) => b.addEventListener('click', () => { pickDay(+b.dataset.i); buzz(); }));
    $('#bkMore').addEventListener('click', () => loadDates(true));
    let first = S.day != null ? S.day : S.days.findIndex((d) => d.free.length);
    if (S.want) { const w = S.days.findIndex((d) => d.date >= S.want && d.free.length); if (w >= 0) first = w; S.want = null; }
    if (first >= 0) pickDay(first, true); else msg2.textContent = 'אין מקום בשבועיים הקרובים. אפשר לטעון עוד תאריכים.';
  };
  const pickDay = (i, quiet) => {
    S.day = i;
    const d = S.days[i], dt = fromYmd(d.date);
    $$('.bk-date[data-i]', datesEl).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    const cur = $(`.bk-date[data-i="${i}"]`, datesEl);
    if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: quiet ? 'auto' : 'smooth' });
    $('#bkMonth').textContent = `${DAY[dt.getDay()]}, ${dt.getDate()} ב${MONTH[dt.getMonth()]}`;
    const groups = [['בוקר', (h) => h < 12], ['צהריים', (h) => h >= 12 && h < 16], ['ערב', (h) => h >= 16]];
    slotsEl.innerHTML = groups.map(([g, f]) => {
      const ts = d.free.filter((t) => f(+t.slice(0, 2)));
      return ts.length ? `<div class="bk-slot-g"><p>${g}</p><div class="bk-slot-row">${ts.map((t, k) => `<button type="button" class="bk-slot${S.time === t && !quiet ? ' on' : ''}" data-t="${t}" style="--i:${k}">${t}</button>`).join('')}</div></div>` : '';
    }).join('');
    $$('.bk-slot', slotsEl).forEach((b) => b.addEventListener('click', () => {
      S.time = b.dataset.t; buzz();
      $$('.bk-slot', slotsEl).forEach((x) => x.classList.toggle('on', x === b));
      setTimeout(() => { renderTicket($('#bkTicket')); etaPaint(); prefill(); go(3); }, 220);
    }));
  };

  /* month calendar: jump straight to a later date */
  const calEl = $('#bkCal'), calBtn = $('#bkCalBtn');
  let calMonth = null;
  const lastDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + HORIZON); return d; };
  const renderCal = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const firstDow = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const minM = new Date(today.getFullYear(), today.getMonth(), 1), max = lastDay(), maxM = new Date(max.getFullYear(), max.getMonth(), 1);
    const selDate = S.day != null && S.days[S.day] ? S.days[S.day].date : '';
    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<i></i>';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d), key = ymd(dt);
      const off = dt < today || dt > max || !HOURS[dt.getDay()];
      cells += `<button type="button" data-d="${key}"${off ? ' disabled' : ''} class="${key === ymd(today) ? 'today' : ''}${key === selDate ? ' on' : ''}">${d}</button>`;
    }
    calEl.innerHTML = `
      <div class="bk-cal-h">
        <button type="button" class="bk-cal-nav" data-m="-1" aria-label="חודש קודם" ${calMonth <= minM ? 'disabled' : ''}><svg class="icon"><use href="#i-right"/></svg></button>
        <b>${MONTH[m]} ${y}</b>
        <button type="button" class="bk-cal-nav" data-m="1" aria-label="חודש הבא" ${calMonth >= maxM ? 'disabled' : ''}><svg class="icon"><use href="#i-left"/></svg></button>
      </div>
      <div class="bk-cal-w">${DAY_S.map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="bk-cal-g">${cells}</div>`;
    $$('.bk-cal-nav', calEl).forEach((b) => b.addEventListener('click', () => { calMonth = new Date(y, m + +b.dataset.m, 1); renderCal(); }));
    $$('.bk-cal-g button', calEl).forEach((b) => b.addEventListener('click', () => {
      buzz(); calEl.hidden = true; calBtn.setAttribute('aria-expanded', 'false');
      loadDates(false, b.dataset.d);
    }));
  };
  calBtn.addEventListener('click', () => {
    const open = calEl.hidden;
    if (open) {
      const base = S.day != null && S.days[S.day] ? fromYmd(S.days[S.day].date) : new Date();
      calMonth = new Date(base.getFullYear(), base.getMonth(), 1);
      renderCal();
    }
    calEl.hidden = !open; calBtn.setAttribute('aria-expanded', String(open));
  });

  /* ---------------- 3. details ---------------- */
  const endTime = () => { const [h, m] = S.time.split(':').map(Number); const t = h * 60 + m + (sum('minutes') || 30); return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; };
  const renderTicket = (el, stamp, opts = {}) => {
    const d = fromYmd(S.days[S.day].date), dep = deposit();
    const names = picked().map((s) => s.name).join(' + ');
    el.classList.add('iv');
    el.innerHTML = `
      <span class="iv-frame" aria-hidden="true"></span>
      ${stamp ? `<span class="iv-seal" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="o" cx="32" cy="32" r="29"/><circle class="i" cx="32" cy="32" r="23.5"/><path d="M22.5 32.5l6.8 6.8L42 26"/></svg><em>${opts.pending ? 'נשלח' : 'נקבע'}</em></span>` : ''}
      <svg class="iv-mono" viewBox="110 40 716 546" aria-hidden="true"><use href="#ak"/></svg>
      <p class="iv-brand">AK BEAUTY ACADEMY</p>
      <div class="iv-rule" aria-hidden="true"><i></i></div>
      <p class="iv-day">יום ${DAY[d.getDay()]}</p>
      <p class="iv-num">${d.getDate()}</p>
      <p class="iv-month">${MONTH[d.getMonth()]}</p>
      <p class="iv-time"><bdi dir="ltr">${S.time} — ${endTime()}</bdi></p>
      <div class="iv-rule" aria-hidden="true"><i></i></div>
      <p class="iv-treat">${names}</p>
      ${dep ? `<p class="iv-dep">מקדמה ${ils(dep)}, יורדת מהמחיר</p>` : ''}
      <div class="iv-meta">
        <div><small>איפה</small><b>גילדסגיים 4</b><span class="eta-short"></span></div>
        <div><small>משך</small><b>${mins(sum('minutes') || 30)}</b></div>
        <div><small>סה״כ</small><b>${sum('price') ? ils(sum('price')) : '—'}</b></div>
      </div>
      ${stamp ? `<div class="iv-actions"><a class="iv-btn" href="${opts.ics || '#'}" download="AK-Beauty.ics"><svg class="icon"><use href="#i-cal"/></svg>הוספה ליומן</a><a class="iv-btn ghost" href="https://waze.com/ul?ll=${PLACE.ll}&navigate=yes" target="_blank" rel="noopener"><svg class="icon"><use href="#i-waze"/></svg>ניווט</a></div>` : ''}
      <p class="iv-note">${API_URL ? 'ביטול דרך הקישור בוואטסאפ, עד 19:00 בערב שלפני' : 'שינוי או ביטול בוואטסאפ, עד 19:00 בערב שלפני'}</p>`;
    el.classList.toggle('stamped', !!stamp);
  };
  let lastDone = null;
  const etaPaint = () => { try { window.akEta && window.akEta.paint(); } catch (e) {} };
  const recall = () => { try { return JSON.parse(localStorage.getItem('akClient') || 'null'); } catch (e) { return null; } };
  const remember = (c) => { try { localStorage.setItem('akClient', JSON.stringify(c)); } catch (e) {} };
  const form = $('#bkForm'), hello = $('#bkHello');
  const prefill = () => {
    const c = recall();
    if (c && c.name && !form.name.value) {
      form.name.value = c.name; form.phone.value = c.phone || '';
      hello.innerHTML = `היי ${c.name.split(' ')[0]}, טוב לראות אותך שוב <button type="button" class="bk-inline" id="bkNotMe">לא את?</button>`;
      hello.hidden = false;
      $('#bkNotMe').addEventListener('click', () => { form.name.value = ''; form.phone.value = ''; hello.hidden = true; try { localStorage.removeItem('akClient'); } catch (e) {} form.name.focus(); });
    }
    const dep = deposit(), depEl = $('#bkDep');
    depEl.hidden = !dep;
    if (dep) depEl.textContent = `לתור הזה נדרשת מקדמה של ${ils(dep)}, שמקוזזת ממחיר הטיפול. אביגיל תשלח לך פרטים לתשלום.`;
  };
  const msg3 = $('#bkMsg3');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg3.textContent = '';
    const name = form.name.value.trim(), phone = localPhone(form.phone.value);
    if (name.length < 2) { msg3.textContent = 'מה השם המלא שלך?'; form.name.focus(); return; }
    if (!/^05\d{8}$/.test(phone)) { msg3.textContent = 'מספר הטלפון לא נראה תקין.'; form.phone.focus(); return; }
    if (!form.agree.checked) {
      msg3.textContent = 'כדי לקבוע תור צריך לסמן שקראת ואישרת את התקנון.';
      const ag = $('#bkAgree'); ag.classList.remove('nudge'); void ag.offsetWidth; ag.classList.add('nudge'); form.agree.focus(); return;
    }
    const btn = $('.bk-cta', form);
    const body = { name, phone, services: [...S.sel], date: S.days[S.day].date, time: S.time, note: form.note.value.trim(), company: form.company.value, terms: new Date().toISOString() };

    // without the API: open WhatsApp now (synchronously, so phones don't block it)
    if (!API_URL && !DEMO) {
      window.open(`https://wa.me/${AVIGAIL_WA}?text=${encodeURIComponent(waText(body))}`, '_blank', 'noopener');
      remember({ name, phone }); done({ viaWhatsApp: true, name: name.split(' ')[0] }); return;
    }
    btn.disabled = true; btn.classList.add('busy');
    try {
      const r = await api.book(body);
      if (!r || !r.ok) {
        if (r && r.error === 'taken') { msg3.textContent = 'השעה הזאת נתפסה הרגע. בחרי שעה אחרת.'; S.days = []; setTimeout(() => { go(2); loadDates(); }, 1200); return; }
        throw new Error(r && r.error);
      }
      remember({ name, phone });
      done(r);
    } catch (err) {
      msg3.innerHTML = `משהו לא עבד. <a href="https://wa.me/${AVIGAIL_WA}?text=${encodeURIComponent(waText(body))}" target="_blank" rel="noopener">שלחי לאביגיל בוואטסאפ</a>`;
    } finally { btn.disabled = false; btn.classList.remove('busy'); }
  });
  const waText = (b) => {
    const d = fromYmd(b.date);
    return ['היי אביגיל, אני רוצה לקבוע תור דרך האתר', picked().map((s) => s.name).join(' + '), `יום ${DAY[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1} בשעה ${b.time}`, `שם: ${b.name}`, `טלפון: ${b.phone}`, b.note ? `הערה: ${b.note}` : '', b.terms ? 'קראתי ואישרתי את תקנון התורים' : ''].filter(Boolean).join('\n');
  };

  /* ---------------- done ---------------- */
  const done = (r) => {
    lastDone = r;
    const d = fromYmd(S.days[S.day].date);
    const first = r.name || '';
    const st = new Date(d); const [h, m] = S.time.split(':').map(Number); st.setHours(h, m, 0, 0);
    const en = new Date(st.getTime() + (sum('minutes') || 30) * 6e4);
    const z = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AK Beauty//HE', 'BEGIN:VEVENT', `UID:${Date.now()}@akbeauty`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(st)}`, `DTEND:${z(en)}`,
      `SUMMARY:${picked().map((s) => s.name).join(' + ')} · אביגיל קקון`, `LOCATION:${PLACE.label}`, `DESCRIPTION:ניווט: https://waze.com/ul?ll=${PLACE.ll}&navigate=yes`,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:תור אצל אביגיל', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    renderTicket($('#bkTicketDone'), true, { pending: !!r.viaWhatsApp, ics: 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics) }); etaPaint();
    $('#bkDoneH').textContent = r.viaWhatsApp ? 'כמעט שם' : (r.returning ? `תודה ${first}, נתראה` : `התור נקבע${first ? `, ${first}` : ''}`);
    const pay = $('#bkPay');
    pay.hidden = !(r.payUrl && deposit());
    if (!pay.hidden) { pay.href = r.payUrl; $('span', pay).textContent = `לתשלום המקדמה, ${ils(deposit())}`; }
    $('#bkDoneTxt').textContent = r.viaWhatsApp
      ? 'נפתחה לך הודעה מוכנה לאביגיל בוואטסאפ. שולחות, והיא מאשרת את התור.'
      : (r.clientNotified ? 'שלחתי לך אישור בוואטסאפ, ותזכורת תגיע יום לפני.' : 'כדאי לשמור את התור ביומן או לצלם את הכרטיס.');
    go(4);
    burst();
    try { window.akTrack && window.akTrack('book', { value: sum('price') || 0, via: r.viaWhatsApp ? 'whatsapp' : 'site' }); } catch (e) {}
  };
  $('#bkDoneBack').addEventListener('click', () => {
    if (lastDone && lastDone.viaWhatsApp) { go(3); return; } // the message wasn't a booking yet: edit and resend
    $('#bkAgain').click();
  });
  $('#bkAgain').addEventListener('click', () => { S.sel.clear(); S.days = []; S.day = S.time = null; form.reset(); hello.hidden = true; renderCats(); renderList(); go(1); });

  // a soft shower of rose-gold specks behind the ticket
  const burst = () => {
    const host = $('.bk-done'); if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'bk-burst';
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i');
      s.style.setProperty('--x', `${(Math.random() * 2 - 1) * 160}px`); s.style.setProperty('--y', `${-60 - Math.random() * 140}px`);
      s.style.setProperty('--d', `${Math.random() * 0.35}s`); s.style.setProperty('--s', `${3 + Math.random() * 5}px`);
      box.appendChild(s);
    }
    host.appendChild(box); setTimeout(() => box.remove(), 2200);
  };

  /* ---------------- sheets (policy, waiting list) ---------------- */
  const sheet = (el) => {
    document.body.appendChild(el); // out of the section's stacking context, so nothing paints over it
    const open = () => { el.hidden = false; requestAnimationFrame(() => el.classList.add('open')); document.documentElement.classList.add('sheet-open'); };
    const close = () => { el.classList.remove('open'); document.documentElement.classList.remove('sheet-open'); setTimeout(() => { el.hidden = true; }, 380); };
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-close]')) close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) close(); });
    return { open, close };
  };
  const pol = sheet(document.getElementById('bkPolicy'));
  document.querySelectorAll('[data-policy]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); pol.open(); }));

  /* waiting list: she found no good time, so she leaves a day and a part of the day */
  const waitEl = document.getElementById('bkWait'), wait = sheet(waitEl);
  const wForm = document.getElementById('bkWaitForm'), wDone = document.getElementById('bkWaitDone'), wMsg = document.getElementById('bkWaitMsg');
  const chips = (name) => wForm.querySelector(`.bk-chips[data-name="${name}"]`);
  const chipVal = (name) => { const on = chips(name).querySelector('.on'); return on ? on.dataset.v : ''; };
  wForm.addEventListener('click', (e) => {
    const b = e.target.closest('.bk-chips button'); if (!b) return;
    b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); buzz();
  });
  document.getElementById('bkWaitBtn').addEventListener('click', () => {
    const d = S.day != null && S.days[S.day] ? S.days[S.day].date : '';
    const dt = d ? fromYmd(d) : null;
    document.getElementById('bkWaitFor').textContent = picked().map((s) => s.name).join(' + ');
    document.getElementById('bkWaitDays').innerHTML = (dt ? `<button type="button" data-v="${d}" class="on">יום ${DAY[dt.getDay()]}, ${dt.getDate()}.${dt.getMonth() + 1}</button>` : '') +
      `<button type="button" data-v="any"${dt ? '' : ' class="on"'}>כל יום שמתפנה</button>`;
    const c = recall();
    if (c && !wForm.name.value) { wForm.name.value = c.name || ''; wForm.phone.value = c.phone || ''; }
    wForm.hidden = false; wDone.hidden = true; wMsg.textContent = '';
    wait.open();
  });
  wForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    wMsg.textContent = '';
    const name = wForm.name.value.trim(), phone = localPhone(wForm.phone.value);
    if (name.length < 2) { wMsg.textContent = 'מה השם המלא שלך?'; wForm.name.focus(); return; }
    if (!/^05\d{8}$/.test(phone)) { wMsg.textContent = 'מספר הטלפון לא נראה תקין.'; wForm.phone.focus(); return; }
    const body = { name, phone, services: [...S.sel], date: chipVal('date') || 'any', part: chipVal('part') || 'לא משנה', company: wForm.company.value };
    const label = wForm.querySelector('#bkWaitDays .on'), when = label ? label.textContent : 'כל יום שמתפנה';
    const finish = (txt) => { remember({ name, phone }); wForm.hidden = true; wDone.hidden = false; document.getElementById('bkWaitDoneTxt').textContent = txt; };
    if (!API_URL && !DEMO) { // without the server: a ready message to Avigail
      const text = ['היי אביגיל, לא מצאתי שעה באתר ואשמח להיכנס לרשימת ההמתנה', picked().map((s) => s.name).join(' + '), `${when} · ${body.part}`, `שם: ${name}`, `טלפון: ${phone}`].join('\n');
      window.open(`https://wa.me/${AVIGAIL_WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      finish('נפתחה לך הודעה מוכנה לאביגיל בוואטסאפ. שולחות, והיא תעדכן כשמתפנה תור.'); return;
    }
    const btn = wForm.querySelector('.bk-cta'); btn.disabled = true; btn.classList.add('busy');
    try {
      const r = await api.waitlist(body);
      if (!r || !r.ok) throw new Error(r && r.error);
      finish('ברגע שמתפנה תור שמתאים לך, אשלח לך הודעה בוואטסאפ עם קישור לקביעה.');
      try { window.akTrack && window.akTrack('waitlist'); } catch (x) {}
    } catch (err) {
      wMsg.innerHTML = `משהו לא עבד. <a href="https://wa.me/${AVIGAIL_WA}" target="_blank" rel="noopener">כתבי לאביגיל בוואטסאפ</a>`;
    } finally { btn.disabled = false; btn.classList.remove('busy'); }
  });

  /* ---------------- start ---------------- */
  renderCats(); renderList(); go(1, { stay: true });
  // a link from a waiting-list message (?bk=brow,tint&bkdate=2026-11-11#treat) opens straight on that day
  (() => {
    const q = new URLSearchParams(location.search);
    const note = (q.get('bknote') || '').slice(0, 120); // e.g. a gift voucher code
    if (note) { form.note.value = note; form.note.closest('details').open = true; }
    const keys = (q.get('bk') || '').split(',').filter((k) => SERVICES.some((s) => s.key === k));
    if (!keys.length) return;
    keys.forEach((k) => S.sel.add(k));
    S.cat = SERVICES.find((s) => s.key === keys[0]).cat;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(q.get('bkdate') || '') && q.get('bkdate') >= ymd(new Date()) ? q.get('bkdate') : undefined;
    renderCats(); renderList(); go(2, { stay: true }); loadDates(false, d);
  })();
  api.config().then((c) => {
    if (!c) return;
    if (c.services && c.services.length) SERVICES = c.services;
    if (c.hours) HOURS = c.hours;
    if (c.step) STEP = c.step;
    if (c.horizon) HORIZON = c.horizon;
    S.sel.forEach((k) => { if (!SERVICES.some((s) => s.key === k)) S.sel.delete(k); });
    renderCats(); renderList(); syncBar();
  }).catch(() => {});

  // open the booking on given treatments, straight at the date step (used by the brow mapping)
  const start = (keys) => {
    S.sel.clear(); keys.forEach((k) => { if (SERVICES.some((s) => s.key === k)) S.sel.add(k); });
    if (!S.sel.size) return;
    S.cat = SERVICES.find((s) => S.sel.has(s.key)).cat; S.days = []; S.day = S.time = null;
    renderCats(); renderList(); go(2, { stay: true });
    const toCard = () => scrollTo({ top: root.getBoundingClientRect().top + scrollY - 84, behavior: 'smooth' });
    toCard(); loadDates().then(() => setTimeout(toCard, 60));
  };
  // open the booking on one category, at the treatment step (used by the tattoo section)
  const openCat = (cat) => {
    if (!CATS.some((c) => c.cat === cat)) return;
    S.cat = cat; go(1, { stay: true }); renderCats(); renderList(); syncBar();
    scrollTo({ top: root.getBoundingClientRect().top + scrollY - 84, behavior: 'smooth' });
  };
  window.akBooking = { state: S, go, start, openCat };
})();
