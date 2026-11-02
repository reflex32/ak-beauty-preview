/* ==========================================================================
   Gift voucher: live preview of the card while she types, then the order goes
   to the booking server (sheet "שוברים" + WhatsApp with the payment link).
   Without the server, a ready WhatsApp message to Avigail.
   ========================================================================== */
(() => {
  'use strict';
  const form = document.getElementById('gvForm');
  if (!form) return;

  const API_URL = window.AK_API || '';
  const AVIGAIL_WA = '972502774797';
  const DEMO = /[?&]bkdemo\b/.test(location.search);
  // what an amount is enough for (same prices as the booking list)
  const TREATS = [['עיצוב גבות טבעיות', 100], ['עיצוב גבות + שפם', 120], ['הרמת גבות', 250], ['הרמת ריסים', 300], ['הרמת ריסים + הרמת גבות', 500], ['מיקרובליידינג', 2000]];

  const $ = (id) => document.getElementById(id);
  const card = $('gvCard'), amtEl = $('gvAmt'), toEl = $('gvTo'), fromEl = $('gvFrom'), msgEl = $('gvMsg');
  const chips = $('gvAmounts'), other = $('gvOther'), covers = $('gvCovers'), err = $('gvMsgErr');
  const localPhone = (v) => { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('972')) d = '0' + d.slice(3); return d; };
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };
  let amount = 300;

  const bump = (el) => { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); };
  const paint = () => {
    amtEl.textContent = amount ? amount.toLocaleString('he-IL') : '—';
    const best = TREATS.filter(([, p]) => p <= amount).pop();
    covers.textContent = best ? `מספיק למשל ל${best[0]}` : '';
    toEl.textContent = form.to.value.trim() ? `ל${form.to.value.trim()}` : 'למי שאת אוהבת';
    fromEl.textContent = form.from.value.trim() ? `מ${form.from.value.trim()}` : 'ממך';
    msgEl.textContent = form.message.value.trim() || 'מגיע לך פינוק';
  };

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    chips.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); buzz();
    other.hidden = b.dataset.v !== 'other';
    if (b.dataset.v === 'other') { form.other.focus(); amount = Math.round(+form.other.value || 0); }
    else amount = +b.dataset.v;
    paint(); bump(amtEl);
  });
  form.other.addEventListener('input', () => { amount = Math.round(+form.other.value || 0); paint(); });
  ['to', 'from', 'message'].forEach((n) => form[n].addEventListener('input', paint));

  // the card leans toward the pointer (desktop), and floats gently on phones
  const stage = $('gvStage');
  if (matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
      card.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 10}deg`);
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    });
    stage.addEventListener('pointerleave', () => { card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); });
  }

  const done = (txt, payUrl) => {
    form.hidden = true; $('gvDone').hidden = false;
    $('gvDoneTxt').textContent = txt;
    const pay = $('gvPay');
    pay.hidden = !payUrl;
    if (payUrl) { pay.href = payUrl; pay.querySelector('span').textContent = `לתשלום ₪${amount.toLocaleString('he-IL')}`; }
    card.classList.add('sent');
    sheet.querySelector('.bk-sheet-in').scrollTo({ top: 0, behavior: 'smooth' });
  };
  $('gvAgain').addEventListener('click', () => { form.reset(); amount = 300; chips.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.v === '300')); other.hidden = true; paint(); card.classList.remove('sent'); form.hidden = false; $('gvDone').hidden = true; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const to = form.to.value.trim(), from = form.from.value.trim(), message = form.message.value.trim(), phone = localPhone(form.phone.value);
    if (!(amount >= 50 && amount <= 5000)) { err.textContent = 'סכום בין ₪50 ל־₪5,000.'; (other.hidden ? chips : form.other).focus(); return; }
    if (to.length < 2) { err.textContent = 'למי השובר?'; form.to.focus(); return; }
    if (from.length < 2) { err.textContent = 'ממי השובר?'; form.from.focus(); return; }
    if (!/^05\d{8}$/.test(phone)) { err.textContent = 'מספר הטלפון לא נראה תקין.'; form.phone.focus(); return; }
    const body = { action: 'voucher', amount, to, from, message, phone, company: form.company.value };
    try { window.akTrack && window.akTrack('voucher', { value: amount }); } catch (x) {}

    if (!API_URL && !DEMO) { // without the server: a ready message to Avigail
      const text = ['היי אביגיל, אני רוצה להזמין שובר מתנה', `סכום: ₪${amount}`, `למי: ${to}`, `ממי: ${from}`, message ? `הקדשה: ${message}` : '', `טלפון: ${phone}`].filter(Boolean).join('\n');
      window.open(`https://wa.me/${AVIGAIL_WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      done('נפתחה הודעה מוכנה לאביגיל בוואטסאפ. אחרי ששולחים, היא שולחת קישור לתשלום ואז את השובר המעוצב.');
      return;
    }
    const btn = form.querySelector('.bk-cta'); btn.disabled = true; btn.classList.add('busy');
    try {
      const r = DEMO ? (await new Promise((res) => setTimeout(res, 800)), { ok: true, payUrl: '' })
        : await (await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })).json();
      if (!r || !r.ok) throw new Error(r && r.error);
      done(r.payUrl ? 'שלחתי לך הודעה בוואטסאפ. אפשר לשלם כבר עכשיו, ומיד אחרי התשלום אשלח את השובר המעוצב.' : 'שלחתי לך הודעה בוואטסאפ עם קישור לתשלום. מיד אחרי התשלום אשלח את השובר המעוצב.', r.payUrl);
    } catch (x) {
      err.innerHTML = `משהו לא עבד. <a href="https://wa.me/${AVIGAIL_WA}" target="_blank" rel="noopener">כתבי לאביגיל בוואטסאפ</a>`;
    } finally { btn.disabled = false; btn.classList.remove('busy'); }
  });

  /* the voucher lives in a sheet: opened from the footer, the menu or a #gift link */
  const sheet = $('gift');
  const openGift = () => {
    sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('open'));
    document.documentElement.classList.add('sheet-open'); paint();
  };
  const closeGift = () => {
    sheet.classList.remove('open'); document.documentElement.classList.remove('sheet-open');
    setTimeout(() => { sheet.hidden = true; }, 380);
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-gift], a[href="#gift"]');
    if (t) { e.preventDefault(); openGift(); }
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('[data-close]')) closeGift(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeGift(); });
  if (location.hash === '#gift') openGift();

  paint();
})();
