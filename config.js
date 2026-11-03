/* Booking server address: paste the Apps Script web-app URL here (see backend/README.md).
   Used by the booking on the home page and by cancel.html. */
window.AK_API = '';

/* Measurement (optional): Meta Pixel ID and Google Analytics 4 ID (G-XXXXXXX).
   Empty = nothing loads. When set, visitors are asked once before anything is measured. */
window.AK_META_PIXEL = '';
window.AK_GA4 = '';

/* Avigail's booking system (Supabase). The publishable key is public by design: the data is locked,
   and the site only reaches it through a few functions (e.g. a customer's personal link to move or cancel). */
window.AK_SB = { url: 'https://frarpypjfdhquryidico.supabase.co', key: 'sb_publishable_LHaxMBM_CJ42pPVj88sABw_CuhjJX4o' };
