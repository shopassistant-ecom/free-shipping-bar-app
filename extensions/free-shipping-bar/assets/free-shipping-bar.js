(function () {
  const container = document.getElementById('fsb-container');
  if (!container) return;

  const thresholdCents = Number(container.dataset.threshold || 0); // küszöb centben
  const currency = container.dataset.currency || (window.Shopify && Shopify.currency && Shopify.currency.active) || '';
  const initialTextTpl = container.dataset.initialText || '🎁 Ingyenes szállítás {{threshold}} felett!';
  const progressTextTpl = container.dataset.progressText || 'Már csak {{left}} hiányzik az ingyenes szállításhoz!';
  const successTextTpl = container.dataset.successText || '🎉 Megvan! A rendelésed ingyenes szállítással megy!';
  const position = container.dataset.position || 'top-fixed';

  // Formázó – a bolt formátumát imitálja (egyszerűsített)
  function moneyFormat(cents) {
    const value = (cents / 100).toFixed(2);
    // Ha HUF, tizedesek nélkül is jól mutat:
    if (currency === 'HUF') return Number(value).toLocaleString('hu-HU') + ' Ft';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  }

  // Template kitöltő
  function tpl(str, map) {
    return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => map[k] ?? '');
  }

  // Banner létrehozása
  const banner = document.createElement('div');
  banner.className = 'fsb-banner';
  if (position === 'top-fixed') banner.classList.add('fsb-fixed');

  const spacer = document.createElement('div');
  spacer.className = 'fsb-spacer';

  function mount() {
    if (position === 'top-fixed') {
      document.body.prepend(spacer);
      document.body.prepend(banner);
    } else {
      document.body.prepend(banner);
    }
  }

  function unmount() {
    banner.remove();
    spacer.remove();
  }

  async function fetchCart() {
    try {
      const res = await fetch('/cart.js');
      if (!res.ok) throw new Error('cart.js error');
      return await res.json();
    } catch (e) {
      console.warn('[FSB] cart fetch failed:', e);
      return null;
    }
  }

  function updateMessage(subtotalCents) {
    // Ha nincs threshold, csak kezdeti üzenet
    if (!thresholdCents || thresholdCents <= 0) {
      banner.textContent = tpl(initialTextTpl, { threshold: moneyFormat(0), left: moneyFormat(0) });
      return;
    }

    const left = Math.max(0, thresholdCents - subtotalCents);
    if (subtotalCents === 0) {
      banner.textContent = tpl(initialTextTpl, { threshold: moneyFormat(thresholdCents), left: moneyFormat(left) });
    } else if (left > 0) {
      banner.textContent = tpl(progressTextTpl, { threshold: moneyFormat(thresholdCents), left: moneyFormat(left) });
    } else {
      banner.textContent = tpl(successTextTpl, { threshold: moneyFormat(thresholdCents), left: moneyFormat(0) });
    }
  }

  async function refresh() {
    const cart = await fetchCart();
    const subtotalCents = cart ? cart.items_subtotal_price : 0; // centben
    updateMessage(subtotalCents);
  }

  // Események figyelése – egyszerű, de hatékony
  function wireUpListeners() {
    // 1) Időzített frissítés (ha a téma fetch-sel frissíti a kosarat)
    setInterval(refresh, 3000);

    // 2) 'add-to-cart' gombokra kattintás után is frissítünk
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, a, input[type="submit"]');
      if (!btn) return;
      const t = (btn.getAttribute('name') || btn.id || btn.className || '').toLowerCase();
      if (t.includes('add') && t.includes('cart')) {
        setTimeout(refresh, 800);
        setTimeout(refresh, 2000);
      }
    });

    // 3) Ha a téma dispatch-el egyéni eseményt kosárra
    document.addEventListener('cart:refresh', refresh);
    document.addEventListener('cart:updated', refresh);
  }

  // Mount + indítás
  mount();
  refresh();
  wireUpListeners();

  // Ha a block eltávolításra kerül (pl. theme editorban), takarítsunk
  document.addEventListener('shopify:section:unload', unmount);
})();
