(function () {
  // beállítások a <script ... data-*> attribútumaiból
  const s = document.currentScript;
  const cfg = {
    threshold: Number(s.dataset.threshold || 0) * (s.dataset.currency === 'HUF' ? 1 : 1), // pénznemfüggetlenül cent helyett bruttó egység
    currency: s.dataset.currency || (window.Shopify && Shopify.currency && Shopify.currency.active) || 'HUF',
    initialText: s.dataset.initialText || '🎁 Ingyenes szállítás {{threshold}} felett!',
    progressText: s.dataset.progressText || 'Már csak {{left}} hiányzik az ingyenes szállításhoz!',
    successText: s.dataset.successText || '🎉 Megvan! A rendelésed ingyenes szállítással megy!',
    position: s.dataset.position || 'top-fixed',
    bg: s.dataset.bg || '#111827',
    fg: s.dataset.fg || '#ffffff',
    fontSize: s.dataset.fontSize || '14'
  };

  function injectCss(href){
    if (document.querySelector('link[data-fsb]')) return;
    const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; l.setAttribute('data-fsb','1');
    document.head.appendChild(l);
  }

  function moneyFormat(amount, currency) {
    if (currency === 'HUF') return Number(amount).toLocaleString('hu-HU') + ' Ft';
    try { return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(amount); }
    catch { return amount + ' ' + currency; }
  }

  function tpl(str, map){ return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_,k)=> map[k] ?? ''); }

  const banner = document.createElement('div');
  banner.className = 'fsb-banner';
  banner.style.setProperty('--fsb-bg', cfg.bg);
  banner.style.setProperty('--fsb-fg', cfg.fg);
  banner.style.setProperty('--fsb-font-size', cfg.fontSize + 'px');
  if (cfg.position === 'top-fixed') banner.classList.add('fsb-fixed');

  const spacer = document.createElement('div'); spacer.className='fsb-spacer';

  function mount(){
    if (cfg.position === 'top-fixed'){ document.body.prepend(spacer); document.body.prepend(banner); }
    else { document.body.prepend(banner); }
  }
  function unmount(){ banner.remove(); spacer.remove(); }

  async function fetchCart(){
    try { const r = await fetch('/cart.js'); if(!r.ok) throw 0; return await r.json(); }
    catch { return null; }
  }

  function update(subtotal){
    const threshold = Number(cfg.threshold || 0);
    const left = Math.max(0, threshold - subtotal);
    if (!threshold || subtotal === 0) {
      banner.textContent = tpl(cfg.initialText, { threshold: moneyFormat(threshold, cfg.currency), left: moneyFormat(left, cfg.currency) });
    } else if (left > 0) {
      banner.textContent = tpl(cfg.progressText, { threshold: moneyFormat(threshold, cfg.currency), left: moneyFormat(left, cfg.currency) });
    } else {
      banner.textContent = tpl(cfg.successText, { threshold: moneyFormat(threshold, cfg.currency), left: moneyFormat(0, cfg.currency) });
    }
  }

  async function refresh(){
    const cart = await fetchCart();
    const subtotal = cart ? (cart.items_subtotal_price/100) : 0; // Shopify forintban: /100 nem változtat, más valutánál is jó
    update(subtotal);
  }

  function listen(){
    setInterval(refresh, 3000);
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('button, a, input[type="submit"]');
      if(!btn) return;
      const t=(btn.name||btn.id||btn.className||'').toLowerCase();
      if(t.includes('add') && t.includes('cart')){ setTimeout(refresh,800); setTimeout(refresh,2000); }
    });
    document.addEventListener('cart:updated', refresh);
    document.addEventListener('cart:refresh', refresh);
    document.addEventListener('shopify:section:unload', unmount);
  }

  // CSS betöltése a saját szerverről (azonos útvonal)
  const base = new URL(s.src).origin;
  injectCss(base + '/fsb.css');

  mount(); refresh(); listen();
})();
