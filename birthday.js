/* ==========================================================================
   A client's personal birthday link (birthday.html?t=...), sent in Avigail's
   message to all her clients: she picks her date of birth, so Avigail can send
   her a greeting on the day. Works only with the link's own token.
   ========================================================================== */
(() => {
  'use strict';
  const card = document.getElementById('card');
  const SB = window.AK_SB || {};
  const token = new URLSearchParams(location.search).get('t') || '';
  const MONTH = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s) => card.querySelector(s);
  const rpc = async (fn, args) => {
    const r = await fetch(`${SB.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };
  const bad = (msg) => { card.innerHTML = `<div class="done-ic bad"><svg class="ic"><use href="#i-x"/></svg></div><h1>${h(msg)}</h1><p class="rule">אפשר לכתוב לאביגיל בוואטסאפ, והיא תעדכן.</p>`; };
  const opts = (list, ph) => `<option value="" disabled selected>${ph}</option>` + list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');

  const form = (info) => {
    const now = new Date().getFullYear();
    const days = Array.from({ length: 31 }, (_, i) => [i + 1, i + 1]);
    const months = MONTH.map((m, i) => [i + 1, m]);
    const years = Array.from({ length: now - 10 - 1930 + 1 }, (_, i) => [now - 10 - i, now - 10 - i]);
    card.innerHTML = `<p class="hi">${info.first ? `היי ${h(info.first)},` : 'היי,'}</p>
      <h1>מתי יום ההולדת שלך?</h1>
      <p class="sub">${info.has ? 'כבר יש לי את התאריך שלך. אם צריך, אפשר לעדכן אותו כאן.' : 'כדי שאוכל לשלוח לך ברכה ביום ההולדת.'}</p>
      <div class="bday">
        <label>יום<select id="bd" aria-label="יום">${opts(days, 'יום')}</select></label>
        <label>חודש<select id="bm" aria-label="חודש">${opts(months, 'חודש')}</select></label>
        <label>שנה<select id="by" aria-label="שנה">${opts(years, 'שנה')}</select></label>
      </div>
      <div class="stack"><button class="btn primary" id="save">שמירה</button></div>
      <p class="msg" id="msg" aria-live="polite"></p>
      <p class="rule">התאריך נשמר רק אצל אביגיל.</p>`;
    $('#save').addEventListener('click', async () => {
      const d = +$('#bd').value, m = +$('#bm').value, y = +$('#by').value;
      if (!d || !m || !y) { $('#msg').textContent = 'צריך לבחור יום, חודש ושנה'; return; }
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCMonth() !== m - 1) { $('#msg').textContent = `אין ${d} ב${MONTH[m - 1]}`; return; }
      const btn = $('#save'); btn.disabled = true; $('#msg').textContent = '';
      try {
        const r = await rpc('birthday_save', { p_token: token, p_date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
        if (!r || !r.ok) throw new Error(r && r.error);
        card.innerHTML = `<div class="done-ic"><svg class="ic"><use href="#i-check"/></svg></div><h1>תודה${info.first ? `, ${h(info.first)}` : ''}!</h1>
          <p class="rule" style="margin-top:0">שמרתי: ${d} ב${MONTH[m - 1]}.</p>
          <div class="stack" style="margin-top:16px"><a class="btn ghost" href="./#treat">לקביעת תור</a></div>`;
      } catch (e) { btn.disabled = false; $('#msg').textContent = 'משהו לא עבד. נסי שוב'; }
    });
  };

  if (!/^[0-9a-f-]{36}$/i.test(token) || !SB.url) { bad('הקישור לא שלם'); return; }
  rpc('birthday_info', { p_token: token }).then((r) => { if (!r) { bad('לא מצאתי את הקישור הזה'); return; } form(r); }).catch(() => bad('לא הצלחתי לטעון. נסי שוב עוד מעט'));
})();
