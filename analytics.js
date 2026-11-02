/* ==========================================================================
   Measurement: Meta Pixel + Google Analytics 4.
   Nothing loads until the IDs are set in config.js, and then only after the
   visitor agrees (a small consent strip, "אישור" / "לא, תודה" side by side).
   Pages call window.akTrack('book' | 'lead' | 'waitlist' | 'voucher' | 'quiz' | 'whatsapp', params).
   ========================================================================== */
(() => {
  'use strict';
  const PIXEL = window.AK_META_PIXEL || '', GA4 = window.AK_GA4 || '';
  const KEY = 'akConsent';
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const put = (v) => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  // our event -> [Meta event, GA4 event, Meta custom?]
  const MAP = {
    book: ['Schedule', 'book_appointment'], lead: ['Lead', 'generate_lead'], voucher: ['InitiateCheckout', 'begin_checkout'],
    whatsapp: ['Contact', 'contact_whatsapp'], waitlist: ['JoinWaitlist', 'join_waitlist', 1], quiz: ['QuizComplete', 'quiz_complete', 1],
  };
  let on = false;
  window.akTrack = (ev, p = {}) => {
    if (!on) return;
    const m = MAP[ev] || [ev, ev, 1], params = Object.assign({}, p, p.value ? { currency: 'ILS' } : {});
    try { if (window.fbq && PIXEL) window.fbq(m[2] ? 'trackCustom' : 'track', m[0], params); } catch (e) {}
    try { if (window.gtag && GA4) window.gtag('event', m[1], params); } catch (e) {}
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) window.akTrack('whatsapp', { place: a.dataset.wa || ((a.closest('section') || {}).id || '') });
  });
  if (!PIXEL && !GA4) return;

  const load = () => {
    if (on) return; on = true;
    if (PIXEL) {
      /* Meta Pixel base code */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', PIXEL); window.fbq('track', 'PageView');
    }
    if (GA4) {
      const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4)}`; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', GA4);
    }
  };
  const strip = () => {
    const el = document.createElement('div');
    el.className = 'consent'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'עוגיות');
    el.innerHTML = '<p>האתר משתמש בעוגיות למדידה ולשיפור. <a href="privacy.html">פרטים</a></p><div><button type="button" data-v="yes">אישור</button><button type="button" data-v="no">לא, תודה</button></div>';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      put(b.dataset.v); if (b.dataset.v === 'yes') load();
      el.classList.add('out'); setTimeout(() => el.remove(), 400);
    });
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('in'));
  };
  const c = get();
  if (c === 'yes') load(); else if (c !== 'no') setTimeout(strip, 2500);
})();
