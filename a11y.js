/* ==========================================================================
   Accessibility menu: a small button, a compact panel. Text size, high contrast,
   highlighted links, stop animations. Settings are remembered on this device.
   ========================================================================== */
(() => {
  'use strict';
  const KEY = 'akA11y', html = document.documentElement, ZOOM = [1, 1.1, 1.2, 1.3];
  let st = { z: 0, contrast: false, links: false, still: false };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

  const wrap = document.createElement('div');
  wrap.className = 'a11y';
  wrap.innerHTML = `
    <button type="button" class="a11y-btn" aria-label="תפריט נגישות" aria-expanded="false" aria-controls="a11yPanel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.6" r="1.9"/><path d="M5 8.6c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.6v4.6m0 0-3.2 6.2M12 14.2l3.2 6.2"/></svg>
    </button>
    <div class="a11y-panel" id="a11yPanel" role="dialog" aria-label="נגישות" hidden>
      <p class="a11y-h">נגישות</p>
      <div class="a11y-size"><span>גודל טקסט</span><div><button type="button" data-z="-1" aria-label="הקטנת טקסט">א-</button><button type="button" data-z="1" aria-label="הגדלת טקסט">א+</button></div></div>
      <button type="button" class="a11y-t" data-k="contrast" aria-pressed="false">ניגודיות גבוהה</button>
      <button type="button" class="a11y-t" data-k="links" aria-pressed="false">הדגשת קישורים</button>
      <button type="button" class="a11y-t" data-k="still" aria-pressed="false">עצירת אנימציות</button>
      <div class="a11y-foot"><button type="button" data-reset>איפוס</button><a href="accessibility.html">הצהרת נגישות</a></div>
    </div>`;
  document.body.appendChild(wrap);
  const btn = wrap.querySelector('.a11y-btn'), panel = wrap.querySelector('.a11y-panel');

  const apply = () => {
    document.body.style.zoom = st.z ? String(ZOOM[st.z]) : '';
    html.classList.toggle('a11y-contrast', !!st.contrast);
    html.classList.toggle('a11y-links', !!st.links);
    html.classList.toggle('a11y-still', !!st.still);
    if (st.still) document.querySelectorAll('video').forEach((v) => { try { v.pause(); } catch (e) {} });
    wrap.querySelectorAll('.a11y-t').forEach((b) => b.setAttribute('aria-pressed', String(!!st[b.dataset.k])));
    wrap.querySelector('[data-z="-1"]').disabled = st.z <= 0;
    wrap.querySelector('[data-z="1"]').disabled = st.z >= ZOOM.length - 1;
    wrap.classList.toggle('active', !!(st.z || st.contrast || st.links || st.still));
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  };
  const open = (yes) => {
    panel.hidden = !yes; btn.setAttribute('aria-expanded', String(yes)); wrap.classList.toggle('open', yes);
    if (yes) panel.querySelector('button').focus(); else btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => open(panel.hidden));
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.z) st.z = Math.max(0, Math.min(ZOOM.length - 1, st.z + +b.dataset.z));
    else if (b.dataset.k) st[b.dataset.k] = !st[b.dataset.k];
    else if ('reset' in b.dataset) st = { z: 0, contrast: false, links: false, still: false };
    apply();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) open(false); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !wrap.contains(e.target)) open(false); });
  apply();
})();
