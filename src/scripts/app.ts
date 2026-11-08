/** HYPSOS — global client entry (loaded on every page). Page-specific modules load from their own pages. */
import { initHeader } from './core/header';
import { initConsent } from './core/consent';
import { initCartUI } from './commerce/cart-ui';
import { cart } from './commerce/cart';
import { initSearch } from './commerce/search';
import { initFavorites } from './commerce/favorites';
import { initQuickAdd } from './commerce/quick-add';
import { initReveal } from './motion/reveal';
import { initCursor } from './motion/cursor';
import { initMagnetic } from './motion/magnetic';
import { initForms } from './core/forms';

function boot() {
  initHeader();
  initConsent();
  initCartUI();
  cart(); // load cart state
  initSearch();
  initFavorites();
  initQuickAdd();
  initReveal();
  initCursor();
  initMagnetic();
  initForms();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
