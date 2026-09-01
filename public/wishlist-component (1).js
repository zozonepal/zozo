// Zozo Nepal - Unified Wishlist & Saved Items Manager
(function () {
  'use strict';

  // Inject Styles for Heart Buttons, Wishlist Drawer, and Badges
  const wishlistStyles = `
    /* Floating Circular Heart Icon on Product Cards */
    .card-wishlist-heart-btn {
      position: absolute !important;
      top: 10px !important;
      right: 10px !important;
      z-index: 25 !important;
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      min-height: 34px !important;
      max-width: 34px !important;
      max-height: 34px !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #64748b !important;
      cursor: pointer !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease !important;
      outline: none !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent !important;
      box-sizing: border-box !important;
    }
    .card-wishlist-heart-btn:hover {
      background: #ffffff !important;
      color: #f43f5e !important;
      transform: scale(1.12) !important;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.25) !important;
      border-color: rgba(244, 63, 94, 0.3) !important;
    }
    .card-wishlist-heart-btn:active {
      transform: scale(0.9) !important;
    }
    .card-wishlist-heart-btn.is-saved {
      background: #ffffff !important;
      color: #f43f5e !important;
      border-color: rgba(244, 63, 94, 0.35) !important;
      box-shadow: 0 2px 10px rgba(244, 63, 94, 0.25) !important;
    }
    .card-wishlist-heart-btn svg {
      width: 18px !important;
      height: 18px !important;
      display: block !important;
      pointer-events: none !important;
      transition: transform 0.2s ease, fill 0.2s ease, stroke 0.2s ease !important;
    }
    .card-wishlist-heart-btn.is-saved svg {
      fill: #f43f5e !important;
      stroke: #f43f5e !important;
    }

    /* Wishlist Backdrop & Slideout Drawer */
    .wishlist-sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      z-index: 100100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      display: block;
    }
    .wishlist-sidebar-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }
    .wishlist-sidebar-layer {
      position: fixed;
      top: 0;
      right: 0;
      width: 100%;
      max-width: 440px;
      height: 100%;
      background: var(--bg-card, #ffffff);
      color: var(--text-main, #111827);
      box-shadow: -8px 0 30px rgba(0, 0, 0, 0.2);
      z-index: 100101;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }
    .wishlist-sidebar-layer.open {
      transform: translateX(0);
    }
    .wishlist-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card, #ffffff);
      flex-shrink: 0;
    }
    .wishlist-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main, #111827);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .wishlist-header-badge {
      background: #fff1f2;
      color: #f43f5e;
      border: 1px solid #fda4af;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .wishlist-close-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .wishlist-close-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .wishlist-items-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .wishlist-item-row {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: var(--input-bg, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      position: relative;
      align-items: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .wishlist-item-row:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: #cbd5e1;
    }
    .wishlist-item-thumb {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
      cursor: pointer;
    }
    .wishlist-item-details {
      flex: 1;
      min-width: 0;
    }
    .wishlist-item-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main, #111827);
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    .wishlist-item-title:hover {
      color: var(--nepal-blue, #9333ea);
    }
    .wishlist-item-price-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .wishlist-price-tag {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--nepal-blue, #9333ea);
    }
    .wishlist-oldprice-tag {
      font-size: 0.78rem;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .wishlist-btn-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .wishlist-move-cart-btn {
      background: var(--nepal-blue, #9333ea);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s ease;
    }
    .wishlist-move-cart-btn:hover {
      background: #7e22ce;
    }
    .wishlist-remove-btn {
      background: none;
      border: 1px solid #e2e8f0;
      color: #ef4444;
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: background 0.15s ease;
    }
    .wishlist-remove-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
    .wishlist-empty-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }
    .wishlist-empty-symbol {
      font-size: 3.5rem;
      margin-bottom: 12px;
      opacity: 0.85;
    }
    .wishlist-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-card, #ffffff);
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }
  `;

  function injectWishlistStyles() {
    if (document.getElementById('zozo-wishlist-injected-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'zozo-wishlist-injected-styles';
    styleEl.textContent = wishlistStyles;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('zozo-wishlist-injected-styles')) {
          document.head.appendChild(styleEl);
        }
      });
    }
  }
  injectWishlistStyles();

  // Create & Inject Wishlist Drawer DOM
  function ensureWishlistDOM() {
    if (document.getElementById('wishlistSidebarLayer')) return;
    if (!document.body) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'wishlistSidebarBackdrop';
    backdrop.className = 'wishlist-sidebar-backdrop';
    backdrop.onclick = function () {
      window.closeWishlistModal();
    };

    const drawer = document.createElement('div');
    drawer.id = 'wishlistSidebarLayer';
    drawer.className = 'wishlist-sidebar-layer';
    drawer.innerHTML = `
      <div class="wishlist-header">
        <h3 class="wishlist-title">
          <span>❤️</span>
          <span>Saved for Later</span>
          <span class="wishlist-header-badge" id="wishlistDrawerCountBadge">0 items</span>
        </h3>
        <button class="wishlist-close-btn" onclick="window.closeWishlistModal()" title="Close Wishlist" aria-label="Close Wishlist">✕</button>
      </div>
      <div class="wishlist-items-container" id="wishlistDrawerItemsList">
        <!-- Dynamically rendered -->
      </div>
      <div class="wishlist-footer" id="wishlistDrawerFooter" style="display:none;">
        <button class="btn" style="flex:1; background:#f1f5f9; color:#475569; font-weight:700; border:1px solid #cbd5e1; font-size:0.85rem;" onclick="window.ZozoWishlist.clearAll()">
          🗑️ Clear All
        </button>
        <button class="btn btn-crimson" style="flex:2; font-weight:800; font-size:0.85rem;" onclick="window.ZozoWishlist.moveAllToCart()">
          🛒 Add All to Bag
        </button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
  }

  // Core ZozoWishlist Object
  window.ZozoWishlist = {
    getSavedIds() {
      try {
        const raw = localStorage.getItem("zozo_saved_items");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },

    isSaved(productId) {
      if (!productId) return false;
      const list = this.getSavedIds();
      return list.includes(String(productId));
    },

    toggleSave(productId, customDetails = {}) {
      if (!productId) return false;
      const cleanId = String(productId);
      let list = this.getSavedIds();
      let isNowSaved = false;

      if (list.includes(cleanId)) {
        list = list.filter(id => id !== cleanId);
        isNowSaved = false;
      } else {
        list.push(cleanId);
        isNowSaved = true;
      }

      try {
        localStorage.setItem("zozo_saved_items", JSON.stringify(list));
      } catch (e) {
        console.warn("Storage quota warning:", e);
      }

      // Sync all heart buttons on screen
      this.syncAllHeartButtons(cleanId, isNowSaved);
      this.updateDetailPageButton(cleanId);
      this.updateBadges();

      // Show Toast Notification
      const itemName = customDetails.name || customDetails.productName || 'Item';
      if (window.ZozoToast) {
        if (isNowSaved) {
          ZozoToast.show(`❤️ Saved "${itemName}" for Later!`, { image: customDetails.image || null });
        } else {
          ZozoToast.info(`Removed "${itemName}" from Saved Items`);
        }
      } else if (typeof window.showToastNotification === 'function') {
        window.showToastNotification(isNowSaved ? `❤️ Saved "${itemName}" for Later!` : `Removed "${itemName}" from Saved`);
      }

      // Dispatch global event
      window.dispatchEvent(new CustomEvent("zozo_wishlist_updated", {
        detail: {
          list,
          productId: cleanId,
          isNowSaved,
          productName: itemName,
          image: customDetails.image
        }
      }));

      // If wishlist drawer is currently open, refresh its contents
      const layer = document.getElementById('wishlistSidebarLayer');
      if (layer && layer.classList.contains('open')) {
        this.renderDrawerContents();
      }

      return isNowSaved;
    },

    toggle(productOrId, event) {
      if (!productOrId) return false;
      const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
      const customDetails = typeof productOrId === 'object' ? productOrId : {};
      return this.handleCardWishlistToggle(productId, event, customDetails);
    },

    handleCardWishlistToggle(productId, event, customDetails = {}) {
      if (event) {
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
        if (typeof event.preventDefault === 'function') event.preventDefault();
      }
      if (!productId) return false;

      const cleanId = String(productId);

      // Look up product details if available
      let productDetails = { ...customDetails };
      if (!productDetails.productName && !productDetails.name) {
        const catalog = window.globalProductsCatalog || [];
        const found = catalog.find(p => String(p.id) === cleanId);
        if (found) {
          productDetails = { productName: found.name, name: found.name, image: found.image, price: found.price };
        } else if (window.currentSelectedProduct && String(window.currentSelectedProduct.id) === cleanId) {
          productDetails = { productName: window.currentSelectedProduct.name, name: window.currentSelectedProduct.name, image: window.currentSelectedProduct.image, price: window.currentSelectedProduct.price };
        }
      }

      const isNowSaved = this.toggleSave(cleanId, productDetails);

      // Animate clicked button if event was provided
      const targetBtn = (event && (event.currentTarget || event.target?.closest('.card-wishlist-heart-btn'))) || 
                        document.getElementById(`wishlist-btn-${cleanId}`) || 
                        document.getElementById('detailWishlistBtn');
                        
      if (targetBtn && window.gsap) {
        gsap.timeline()
          .to(targetBtn, { scale: 1.3, duration: 0.15, ease: "back.out(2)" })
          .to(targetBtn, { scale: 1, duration: 0.2, ease: "power2.out" });
      }

      return isNowSaved;
    },

    syncAllHeartButtons(productId, isSaved) {
      if (productId) {
        const cleanId = String(productId);
        const saved = (typeof isSaved === 'boolean') ? isSaved : this.isSaved(cleanId);
        const buttons = document.querySelectorAll(`[data-product-id="${cleanId}"], #wishlist-btn-${cleanId}`);
        buttons.forEach(btn => {
          const svg = btn.querySelector('svg');
          if (saved) {
            btn.classList.add('is-saved');
            btn.setAttribute('title', 'Remove from Saved for Later');
            if (svg) {
              svg.setAttribute('fill', '#f43f5e');
              svg.setAttribute('stroke', '#f43f5e');
            }
          } else {
            btn.classList.remove('is-saved');
            btn.setAttribute('title', 'Save for Later');
            if (svg) {
              svg.setAttribute('fill', 'none');
              svg.setAttribute('stroke', 'currentColor');
            }
          }
        });
      } else {
        const savedIds = this.getSavedIds();
        const buttons = document.querySelectorAll('.card-wishlist-heart-btn');
        buttons.forEach(btn => {
          const cardId = btn.getAttribute('data-product-id') || (btn.id ? btn.id.replace('wishlist-btn-', '') : null);
          if (cardId) {
            const isItemSaved = savedIds.includes(String(cardId));
            const svg = btn.querySelector('svg');
            if (isItemSaved) {
              btn.classList.add('is-saved');
              btn.setAttribute('title', 'Remove from Saved for Later');
              if (svg) {
                svg.setAttribute('fill', '#f43f5e');
                svg.setAttribute('stroke', '#f43f5e');
              }
            } else {
              btn.classList.remove('is-saved');
              btn.setAttribute('title', 'Save for Later');
              if (svg) {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
              }
            }
          }
        });
      }
    },

    updateDetailPageButton(productId) {
      const btn = document.getElementById('detailWishlistBtn') || document.getElementById('detailWishlistToggleBtn') || document.getElementById('quickViewWishlistBtn');
      const icon = (btn ? btn.querySelector('.wishlist-btn-icon') : null) || document.getElementById('detailWishlistIcon') || document.getElementById('quickViewWishlistIcon');
      const text = (btn ? btn.querySelector('.wishlist-btn-text') : null) || document.getElementById('detailWishlistText') || document.getElementById('quickViewWishlistText');

      const checkId = productId || (window.currentSelectedProduct ? window.currentSelectedProduct.id : null);
      if (!checkId) return;

      const isSaved = this.isSaved(checkId);
      if (icon) icon.innerText = isSaved ? '❤️' : '🤍';
      if (text) text.innerText = isSaved ? 'Saved in Wishlist' : 'Save for Later';
      if (btn) {
        if (isSaved) {
          btn.classList.add('is-saved');
          btn.style.borderColor = '#f43f5e';
          btn.style.color = '#f43f5e';
          btn.style.background = '#fff1f2';
        } else {
          btn.classList.remove('is-saved');
          btn.style.borderColor = 'var(--border-color, #e5e7eb)';
          btn.style.color = 'var(--text-main, #111827)';
          btn.style.background = 'var(--bg-card, #ffffff)';
        }
      }
    },

    updateBadges() {
      const count = this.getSavedIds().length;
      const badges = document.querySelectorAll('.wishlist-count-badge, .drawer-wishlist-count, #navWishlistBadge, #drawerWishlistBadge, #wishlistDrawerCountBadge');
      badges.forEach(b => {
        if (!b) return;
        if (b.classList.contains('drawer-wishlist-count') || b.id === 'wishlistDrawerCountBadge') {
          b.innerText = `${count} item${count === 1 ? '' : 's'}`;
        } else {
          b.innerText = count;
          b.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (window.gsap && count > 0) {
          gsap.fromTo(b, { scale: 1.3 }, { scale: 1, duration: 0.25, ease: "elastic.out(1, 0.4)" });
        }
      });
    },

    getSavedProducts() {
      const savedIds = this.getSavedIds();
      const allProducts = window.globalProductsCatalog || [];
      const result = [];

      savedIds.forEach(id => {
        const cleanId = String(id);
        const product = allProducts.find(p => String(p.id) === cleanId);
        if (product) {
          result.push(product);
        } else {
          result.push({
            id: cleanId,
            name: `Product #${cleanId}`,
            price: 0,
            image: 'zozonepal.png',
            description: ''
          });
        }
      });

      return result;
    },

    renderDrawerContents() {
      ensureWishlistDOM();
      const listEl = document.getElementById('wishlistDrawerItemsList');
      const footerEl = document.getElementById('wishlistDrawerFooter');
      const countBadge = document.getElementById('wishlistDrawerCountBadge');
      if (!listEl) return;

      const savedProducts = this.getSavedProducts();
      const count = savedProducts.length;

      if (countBadge) {
        countBadge.innerText = `${count} item${count === 1 ? '' : 's'}`;
      }

      if (count === 0) {
        if (footerEl) footerEl.style.display = 'none';
        listEl.innerHTML = `
          <div class="wishlist-empty-box">
            <div class="wishlist-empty-symbol">🤍</div>
            <h4 style="font-size:1.1rem; font-weight:800; color:var(--text-main, #111827); margin:0 0 6px 0;">Your Wishlist is Empty</h4>
            <p style="font-size:0.85rem; color:var(--text-muted, #64748b); margin:0 0 20px 0; max-width:280px; line-height:1.5;">
              Tap the heart icon on any product to save it here and shop anytime later.
            </p>
            <button class="btn btn-crimson" style="font-weight:700; font-size:0.85rem; padding:8px 18px;" onclick="window.closeWishlistModal()">
              🛍️ Explore Products
            </button>
          </div>
        `;
        return;
      }

      if (footerEl) footerEl.style.display = 'flex';

      listEl.innerHTML = savedProducts.map(p => {
        return `
          <div class="wishlist-item-row" id="wishlist-drawer-item-${p.id}">
            <img src="${p.image || 'zozonepal.png'}" 
                 alt="${p.name}" 
                 class="wishlist-item-thumb" 
                 onclick="window.ZozoWishlist.openProduct('${p.id}')"
                 onerror="this.onerror=null; this.src='zozonepal.png';">
            <div class="wishlist-item-details">
              <h4 class="wishlist-item-title" onclick="window.ZozoWishlist.openProduct('${p.id}')" title="${p.name}">
                ${p.name}
              </h4>
              <div class="wishlist-item-price-wrap">
                <span class="wishlist-price-tag">Rs. ${Number(p.price || 0).toLocaleString()}</span>
                ${p.oldPrice && p.oldPrice > p.price ? `<span class="wishlist-oldprice-tag">Rs. ${Number(p.oldPrice).toLocaleString()}</span>` : ''}
              </div>
              <div class="wishlist-btn-row">
                <button class="wishlist-move-cart-btn" onclick="window.ZozoWishlist.addItemToCart('${p.id}')">
                  <span>🛒</span> Add to Bag
                </button>
                <button class="wishlist-remove-btn" onclick="window.ZozoWishlist.removeItem('${p.id}', event)" title="Remove item">
                  <span>🗑️</span> Remove
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    openProduct(productId) {
      window.closeWishlistModal();
      if (typeof window.openProductDetailPage === 'function') {
        window.openProductDetailPage(productId);
      } else if (typeof window.openProductQuickViewModal === 'function') {
        window.openProductQuickViewModal(productId);
      } else {
        window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
      }
    },

    addItemToCart(productId) {
      const allProducts = window.globalProductsCatalog || [];
      const product = allProducts.find(p => String(p.id) === String(productId));

      if (product) {
        if (typeof window.addToCart === 'function') {
          window.addToCart(product.id, product.name, product.price, product.image, 1, 'Standard');
        } else if (window.systemCart && Array.isArray(window.systemCart)) {
          const existing = window.systemCart.find(i => String(i.id) === String(product.id));
          if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            window.systemCart.push({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: 1,
              selectedColor: 'Standard'
            });
          }
          try {
            localStorage.setItem("zozo_cart", JSON.stringify(window.systemCart));
          } catch(e) {}
          if (typeof window.synchronizeShoppingBagUIState === 'function') {
            window.synchronizeShoppingBagUIState();
          }
        }
      }

      if (window.ZozoToast) {
        ZozoToast.cart(product ? product.name : 'Item', { image: product ? product.image : null });
      } else if (typeof window.showToastNotification === 'function') {
        window.showToastNotification(`🛒 Added "${product ? product.name : 'Item'}" to Cart!`);
      }
    },

    moveAllToCart() {
      const savedProducts = this.getSavedProducts();
      savedProducts.forEach(p => {
        this.addItemToCart(p.id);
      });
      if (window.ZozoToast) {
        ZozoToast.success(`Added ${savedProducts.length} items to your shopping bag!`);
      }
      window.closeWishlistModal();
      if (typeof window.toggleCartSidebar === 'function') {
        window.toggleCartSidebar(true);
      }
    },

    removeItem(productId, event) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      this.toggleSave(productId);
    },

    clearAll() {
      try {
        localStorage.setItem("zozo_saved_items", JSON.stringify([]));
      } catch (e) {}
      this.syncAllHeartButtons();
      this.updateDetailPageButton();
      this.updateBadges();
      this.renderDrawerContents();
      if (window.ZozoToast) {
        ZozoToast.info('Saved items list cleared');
      }
    }
  };

  // Global Shorthands
  window.handleCardWishlistToggle = function (productId, event) {
    return window.ZozoWishlist.handleCardWishlistToggle(productId, event);
  };

  window.openWishlistModal = function () {
    ensureWishlistDOM();
    const backdrop = document.getElementById('wishlistSidebarBackdrop');
    const drawer = document.getElementById('wishlistSidebarLayer');
    if (!backdrop || !drawer) return;

    window.ZozoWishlist.renderDrawerContents();

    backdrop.classList.add('open');
    drawer.classList.add('open');
  };

  window.closeWishlistModal = function () {
    const backdrop = document.getElementById('wishlistSidebarBackdrop');
    const drawer = document.getElementById('wishlistSidebarLayer');
    if (!backdrop || !drawer) return;

    backdrop.classList.remove('open');
    drawer.classList.remove('open');
  };

  window.toggleDetailPageWishlist = function (event) {
    if (window.currentSelectedProduct) {
      window.ZozoWishlist.handleCardWishlistToggle(window.currentSelectedProduct.id, event, window.currentSelectedProduct);
    }
  };

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeWishlistModal();
    }
  });

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureWishlistDOM();
      window.ZozoWishlist.updateBadges();
      window.ZozoWishlist.syncAllHeartButtons();
    });
  } else {
    ensureWishlistDOM();
    window.ZozoWishlist.updateBadges();
    window.ZozoWishlist.syncAllHeartButtons();
  }

})();
