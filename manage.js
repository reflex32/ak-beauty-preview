/* ==========================================================================
   The customer's personal link (manage.html?t=...): see the appointment, move it
   to another free time, or cancel it, up to 19:00 on the evening before (the
   booking terms). Talks to Avigail's booking system through four functions that
   only work with the link's own token.
   ========================================================================== */
(() => {
  'use strict';
  const card = document.getElementById('card');
  const SB = window.AK_SB || {};
  const token = new URLSearchParams(location.search).get('t') || location.hash.replace('#', '');
  const TZ = 'Asia/Jerusalem';
  const DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const DAY_S = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const MONTH = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s) => card.querySelector(s);

  // Israel-time parts of a moment, whatever the phone's own time zone
  const parts = (d) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' })
      .formatToParts(d).map((x) => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { y: +p.year, m: +p.month, d: +p.day, hh: p.hour, mm: p.minute, dow };
  };
  const hm = (d) => { const p = parts(d); return `${p.hh}:${p.mm}`; };
  const dayLong = (d) => { const p = parts(d); return `יום ${DAY[p.dow]}, ${p.d} ב${MONTH[p.m - 1]}`; };
  const isoDay = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };

  const rpc = async (fn, args) => {
    const r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };

  let info = null;
  const biz = () => info.business || {};
  const waLink = (text) => `https://wa.me/972${String(biz().phone || '0502774797').replace(/\D/g, '').replace(/^0/, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const live = () => ['pending', 'booked', 'confirmed'].includes(info.status);
  const svc = () => (info.services || []).join(' + ') || 'טיפול';

  const ticket = (start, end) => {
    const s = new Date(start), p = parts(s);
    return `<div class="ticket">
      <div class="t-date"><small>${DAY[p.dow]}</small><b class="num">${p.d}</b><span>${MONTH[p.m - 1]}</span></div>
      <div class="t-time"><span class="num">${hm(s)}–${hm(new Date(end))}</span></div>
      <div class="t-svc">${h(svc())}</div>
      <div class="t-where">${h(biz().address || 'גילדסגיים 4, רמת גן')}</div>
    </div>`;
  };
  const icsHref = () => {
    const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AK Beauty//HE', 'BEGIN:VEVENT', `UID:${token}@akbeauty`, `DTSTAMP:${f(new Date())}`,
      `DTSTART:${f(info.start)}`, `DTEND:${f(info.end)}`, `SUMMARY:${svc()} אצל אביגיל קקון`, `LOCATION:${biz().address || ''}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  };

  /* ---------------- the appointment ---------------- */
  const main = () => {
    const s = new Date(info.start), first = info.first ? `היי ${h(info.first)},` : 'היי,';
    if (info.status === 'cancelled') {
      card.innerHTML = `<p class="hi">${first}</p><h1>התור הזה בוטל</h1>${ticket(info.start, info.end)}
        <div class="stack"><a class="btn primary" href="./#treat">לקביעת תור חדש</a></div>`;
      return;
    }
    if (!live() || new Date(info.end) < new Date()) {
      card.innerHTML = `<p class="hi">${first}</p><h1>התור הזה כבר עבר</h1>${ticket(info.start, info.end)}
        <div class="stack"><a class="btn primary" href="./#treat">לקביעת תור נוסף</a></div>`;
      return;
    }
    const dl = new Date(info.deadline);
    card.innerHTML = `
      <p class="hi">${first}</p>
      <h1>התור שלך אצל אביגיל</h1>
      ${info.status === 'pending' ? '<span class="status pending">מחכה לאישור של אביגיל</span>' : ''}
      ${ticket(info.start, info.end)}
      <div class="links">
        <a class="chip" href="https://waze.com/ul?q=${encodeURIComponent(biz().address || 'גילדסגיים 4 רמת גן')}&navigate=yes" target="_blank" rel="noopener"><svg class="ic"><use href="#i-pin"/></svg>ניווט</a>
        <a class="chip" href="${icsHref()}" download="appointment.ics"><svg class="ic"><use href="#i-cal"/></svg>הוספה ליומן</a>
      </div>
      ${info.status === 'confirmed' ? '<p class="confirmed"><svg class="ic"><use href="#i-check"/></svg>אישרת הגעה. תודה, מחכה לך!</p>'
        : info.status === 'booked' ? `<div class="stack" style="margin-bottom:10px"><button class="btn ok" id="goConfirm"><svg class="ic"><use href="#i-check"/></svg>אני מגיעה, מאשרת</button></div>` : ''}
      ${info.can_change ? `
        <div class="stack">
          <button class="btn ${['booked', 'confirmed'].includes(info.status) ? 'ghost' : 'primary'}" id="goMove"><svg class="ic"><use href="#i-move"/></svg>להזיז את התור</button>
          <button class="btn ghost" id="goCancel">לבטל את התור</button>
        </div>
        <p class="rule">אפשר להזיז או לבטל כאן עד ${dayLong(dl)} בשעה ${hm(dl)}.</p>` : `
        <p class="rule">לפי תקנון התורים, אפשר לשנות דרך האתר עד 19:00 בערב שלפני התור. כדי לשנות עכשיו, כתבי לאביגיל.</p>
        <div class="stack" style="margin-top:12px"><a class="btn wa" href="${waLink(`היי אביגיל, לגבי התור שלי ${dayLong(s)} בשעה ${hm(s)}`)}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-wa"/></svg>לכתוב לאביגיל בוואטסאפ</a></div>`}`;
    const gm = $('#goMove'), gc = $('#goCancel'), gf = $('#goConfirm');
    if (gf) gf.addEventListener('click', async () => {
      gf.disabled = true;
      try { const r = await rpc('booking_confirm', { p_token: token }); if (r && r.ok) { info = r; main(); } else throw new Error(); }
      catch (e) { gf.disabled = false; gf.textContent = 'משהו לא עבד. נסי שוב'; }
    });
    if (gm) gm.addEventListener('click', move);
    if (gc) gc.addEventListener('click', cancel);
  };

  /* ---------------- move ---------------- */
  const move = () => {
    const today = parts(new Date());
    const base = Date.UTC(today.y, today.m - 1, today.d, 12);
    const span = Math.min(28, info.horizon || 60);
    const days = Array.from({ length: span }, (_, i) => { const d = new Date(base + i * 864e5); return { iso: d.toISOString().slice(0, 10), dow: d.getUTCDay(), d: d.getUTCDate(), m: d.getUTCMonth() }; });
    const orig = parts(new Date(info.start)); const origIso = isoDay(orig.y, orig.m, orig.d);
    let day = days.find((x) => x.iso === origIso) ? origIso : days[1].iso, time = null;
    card.innerHTML = `
      <button class="back" id="back"><svg class="ic"><use href="#i-right"/></svg>חזרה</button>
      <h1 style="margin-bottom:6px">לאן להזיז את התור?</h1>
      <p class="rule" style="margin:0 0 14px">${h(svc())} · ${info.minutes} דק׳</p>
      <div class="days" id="days">${days.map((x, i) => `<button class="day" data-d="${x.iso}"><small>${i === 0 ? 'היום' : i === 1 ? 'מחר' : DAY_S[x.dow]}</small><b class="num">${x.d}</b><span>${MONTH[x.m].slice(0, 3)}׳</span></button>`).join('')}</div>
      <div class="times" id="times"><div class="spin" style="margin:10px auto;grid-column:1/-1"></div></div>
      <button class="btn primary" id="confirm" disabled>בחרי שעה</button>
      <p class="msg" id="msg"></p>`;
    $('#back').addEventListener('click', main);
    const times = $('#times'), btn = $('#confirm'), msg = $('#msg');
    const pick = async (iso) => {
      day = iso; time = null; btn.disabled = true; btn.textContent = 'בחרי שעה'; msg.textContent = '';
      card.querySelectorAll('.day').forEach((b) => b.classList.toggle('on', b.dataset.d === iso));
      const on = card.querySelector('.day.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      times.innerHTML = '<div class="spin" style="margin:10px auto;grid-column:1/-1"></div>';
      try {
        const list = await rpc('booking_free_times', { p_token: token, p_day: iso });
        if (day !== iso) return;
        if (!list || !list.length) { times.innerHTML = '<div class="empty">אין שעות פנויות ביום הזה. אפשר לבחור יום אחר.</div>'; card.querySelector(`.day[data-d="${iso}"]`).classList.add('closed'); return; }
        times.innerHTML = list.map((t) => `<button class="time" data-t="${t}">${t}</button>`).join('');
        times.querySelectorAll('.time').forEach((b) => b.addEventListener('click', () => {
          time = b.dataset.t; times.querySelectorAll('.time').forEach((x) => x.classList.toggle('on', x === b));
          const p = parts(fromIso(iso)); btn.disabled = false; btn.textContent = `להזיז ליום ${DAY[p.dow]} ${p.d}.${p.m} בשעה ${time}`;
        }));
      } catch (e) { times.innerHTML = '<div class="empty">לא הצלחתי לטעון את השעות. בדקי את החיבור ונסי שוב.</div>'; }
    };
    card.querySelectorAll('.day').forEach((b) => b.addEventListener('click', () => pick(b.dataset.d)));
    btn.addEventListener('click', async () => {
      if (!time) return; btn.disabled = true; msg.textContent = '';
      try {
        const r = await rpc('booking_reschedule', { p_token: token, p_day: day, p_time: time });
        if (!r.ok) {
          if (r.error === 'taken') { msg.textContent = 'השעה הזאת נתפסה הרגע. בחרי שעה אחרת.'; pick(day); return; }
          if (r.error === 'too_late') { info.can_change = false; main(); return; }
          throw new Error(r.error);
        }
        info = r;
        card.innerHTML = `<div class="done-ic"><svg class="ic"><use href="#i-check"/></svg></div><h1>התור הוזז</h1>${ticket(info.start, info.end)}
          <div class="links"><a class="chip" href="${icsHref()}" download="appointment.ics"><svg class="ic"><use href="#i-cal"/></svg>הוספה ליומן</a></div>
          <div class="stack"><button class="btn ghost" id="toMain">חזרה לפרטי התור</button></div>`;
        $('#toMain').addEventListener('click', main);
      } catch (e) { msg.textContent = 'משהו לא עבד. נסי שוב, או כתבי לאביגיל בוואטסאפ.'; btn.disabled = false; }
    });
    setTimeout(() => pick(day), 0);
  };

  /* ---------------- cancel ---------------- */
  const cancel = () => {
    card.innerHTML = `
      <button class="back" id="back"><svg class="ic"><use href="#i-right"/></svg>חזרה</button>
      <h1>לבטל את התור?</h1>
      ${ticket(info.start, info.end)}
      <div class="stack">
        <button class="btn danger" id="yes">כן, לבטל את התור</button>
        <button class="btn ghost" id="no">לא, להשאיר אותו</button>
      </div>
      <p class="rule">אם רק השעה לא מתאימה, אפשר <button class="chip" id="toMove" style="padding:4px 10px;font-size:13px">להזיז את התור</button> במקום לבטל.</p>
      <p class="msg" id="msg"></p>`;
    $('#back').addEventListener('click', main); $('#no').addEventListener('click', main); $('#toMove').addEventListener('click', move);
    $('#yes').addEventListener('click', async () => {
      const b = $('#yes'); b.disabled = true;
      try {
        const r = await rpc('booking_cancel', { p_token: token });
        if (!r.ok) { if (r.error === 'too_late') { info.can_change = false; main(); return; } throw new Error(r.error); }
        info = r;
        card.innerHTML = `<div class="done-ic bad"><svg class="ic"><use href="#i-x"/></svg></div><h1>התור בוטל</h1>
          <p class="rule" style="margin:-6px 0 16px">${dayLong(new Date(info.start))} בשעה ${hm(new Date(info.start))} התפנה. מחכה לראות אותך בפעם אחרת.</p>
          <div class="stack"><a class="btn primary" href="./#treat">לקביעת תור חדש</a></div>`;
      } catch (e) { $('#msg').textContent = 'משהו לא עבד. נסי שוב, או כתבי לאביגיל בוואטסאפ.'; b.disabled = false; }
    });
  };

  /* ---------------- start ---------------- */
  const bad = (text) => { card.innerHTML = `<h1>${text}</h1><p class="rule">אפשר לכתוב לאביגיל בוואטסאפ, והיא תעזור.</p><div class="stack" style="margin-top:14px"><a class="btn wa" href="https://wa.me/972502774797" target="_blank" rel="noopener"><svg class="ic"><use href="#i-wa"/></svg>לכתוב לאביגיל</a></div>`; };
  if (!/^[0-9a-f-]{36}$/i.test(token || '') || !SB.url) { bad('הקישור הזה לא שלם'); return; }
  rpc('booking_info', { p_token: token }).then((r) => { if (!r) { bad('לא מצאתי את התור הזה'); return; } info = r; main(); }).catch(() => bad('לא הצלחתי לטעון את התור'));
})();
