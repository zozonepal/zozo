// Zozo Nepal - Complete Wishlist & Saved Items Component
(function () {
  'use strict';

  // Inject Styles for Heart Buttons, Wishlist Drawer, and Badges
  const wishlistStyles = `
    /* Floating Circular Heart Icon on Product Cards */
    .card-wishlist-heart-btn {
      position: absolute !important;
      top: 10px !important;
      right: 10px !important;
      z-index: 20 !important;
      width: 34px !important;
      height: 34px !important;
      min-width: 34px !important;
      min-height: 34px !important;
      max-width: 34px !important;
      max-height: 34px !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.94) !important;
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
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
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
      border-color: rgba(244, 63, 94, 0.4) !important;
      box-shadow: 0 2px 10px rgba(244, 63, 94, 0.28) !important;
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

    /* Wishlist Slideout Drawer */
    #zozoWishlistDrawerOverlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 100000;
      display: none;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    #zozoWishlistDrawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 100%;
      max-width: 440px;
      height: 100vh;
      background: var(--bg-card, #ffffff);
      color: var(--text-main, #111827);
      box-shadow: -6px 0 30px rgba(0, 0, 0, 0.25);
      z-index: 100001;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }
    #zozoWishlistDrawer.is-open {
      transform: translateX(0);
    }
    .wishlist-drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card, #ffffff);
    }
    .wishlist-drawer-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main, #111827);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .wishlist-drawer-badge {
      background: #fff1f2;
      color: #f43f5e;
      border: 1px solid #fda4af;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .wishlist-drawer-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--text-muted, #64748b);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .wishlist-drawer-close:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .wishlist-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .wishlist-item-card {
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
    .wishlist-item-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: #cbd5e1;
    }
    .wishlist-item-img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      flex-shrink: 0;
      cursor: pointer;
    }
    .wishlist-item-info {
      flex: 1;
      min-width: 0;
    }
    .wishlist-item-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main, #111827);
      margin: 0 0 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    .wishlist-item-name:hover {
      color: var(--nepal-blue, #9333ea);
    }
    .wishlist-item-price-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .wishlist-item-price {
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--nepal-blue, #9333ea);
    }
    .wishlist-item-oldprice {
      font-size: 0.78rem;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .wishlist-item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .wishlist-add-cart-btn {
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
    .wishlist-add-cart-btn:hover {
      background: #7e22ce;
    }
    .wishlist-item-remove-btn {
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
    .wishlist-item-remove-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
    .wishlist-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }
    .wishlist-empty-icon {
      font-size: 3.5rem;
      margin-bottom: 12px;
      opacity: 0.85;
    }
    .wishlist-drawer-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-card, #ffffff);
      display: flex;
      gap: 10px;
    }
  `;

  function injectStyles() {
    if (document.getElementById('zozo-wishlist-injected-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'zozo-wishlist-injected-styles';
    styleEl.textContent = wishlistStyles;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
    }
  }
  injectStyles();

  // Create & Inject Wishlist Drawer DOM
  function createWishlistDrawer() {
    if (document.getElementById('zozoWishlistDrawerOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'zozoWishlistDrawerOverlay';
    overlay.onclick = function (e) {
      if (e.target === overlay) window.closeWishlistModal();
    };

    const drawer = document.createElement('div');
    drawer.id = 'zozoWishlistDrawer';
    drawer.innerHTML = `
      <div class="wishlist-drawer-header">
        <h3 class="wishlist-drawer-title">
          <span>❤️</span>
          <span>Saved for Later</span>
          <span class="wishlist-drawer-badge" id="wishlistDrawerCountBadge">0 items</span>
        </h3>
        <button class="wishlist-drawer-close" onclick="window.closeWishlistModal()" title="Close Wishlist" aria-label="Close Wishlist">✕</button>
      </div>
      <div class="wishlist-drawer-body" id="wishlistDrawerItemsList">
        <!-- Dynamically rendered -->
      </div>
      <div class="wishlist-drawer-footer" id="wishlistDrawerFooter" style="display:none;">
        <button class="btn" style="flex:1; background:#f1f5f9; color:#475569; font-weight:700; border:1px solid #cbd5e1; font-size:0.85rem;" onclick="window.ZozoWishlist.clearAll()">
          🗑️ Clear All
        </button>
        <button class="btn btn-crimson" style="flex:2; font-weight:800; font-size:0.85rem;" onclick="window.ZozoWishlist.moveAllToCart()">
          🛒 Add All to Bag
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
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
        console.warn("Storage quota exceeded or unavailable:", e);
      }

      // Sync all heart buttons on screen
      this.syncAllHeartButtons(cleanId, isNowSaved);
      this.updateDetailPageButton(cleanId);
      this.updateBadges();

      // Dispatch global event for listeners (like toast notification)
      window.dispatchEvent(new CustomEvent("zozo_wishlist_updated", {
        detail: {
          list,
          productId: cleanId,
          isNowSaved,
          productName: customDetails.name || customDetails.productName,
          image: customDetails.image
        }
      }));

      // If wishlist drawer is currently open, refresh its contents
      if (document.getElementById('zozoWishlistDrawer')?.classList.contains('is-open')) {
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
        if (window.globalProductsCatalog && Array.isArray(window.globalProductsCatalog)) {
          const found = window.globalProductsCatalog.find(p => String(p.id) === cleanId);
          if (found) {
            productDetails = { productName: found.name, name: found.name, image: found.image };
          }
        } else if (window.currentSelectedProduct && String(window.currentSelectedProduct.id) === cleanId) {
          productDetails = { productName: window.currentSelectedProduct.name, name: window.currentSelectedProduct.name, image: window.currentSelectedProduct.image };
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
        // Full scan across all heart buttons on page
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

    // Lookup full product items from catalogs
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
          // Fallback placeholder item if product catalog is loading or missing
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
      createWishlistDrawer();
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
          <div class="wishlist-empty-state">
            <div class="wishlist-empty-icon">🤍</div>
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
        const isCombo = !!p.isCombo || p.category === 'combo-deals';
        return `
          <div class="wishlist-item-card" id="wishlist-drawer-item-${p.id}">
            <img src="${p.image || 'zozonepal.png'}" 
                 alt="${p.name}" 
                 class="wishlist-item-img" 
                 onclick="window.ZozoWishlist.openProduct('${p.id}')"
                 onerror="this.onerror=null; this.src='zozonepal.png';">
            <div class="wishlist-item-info">
              <h4 class="wishlist-item-name" onclick="window.ZozoWishlist.openProduct('${p.id}')" title="${p.name}">
                ${p.name}
              </h4>
              <div class="wishlist-item-price-row">
                <span class="wishlist-item-price">Rs. ${Number(p.price || 0).toLocaleString()}</span>
                ${p.oldPrice && p.oldPrice > p.price ? `<span class="wishlist-item-oldprice">Rs. ${Number(p.oldPrice).toLocaleString()}</span>` : ''}
              </div>
              <div class="wishlist-item-actions">
                <button class="wishlist-add-cart-btn" onclick="window.ZozoWishlist.addItemToCart('${p.id}')">
                  <span>🛒</span> Add to Bag
                </button>
                <button class="wishlist-item-remove-btn" onclick="window.ZozoWishlist.removeItem('${p.id}', event)" title="Remove item">
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
        // If addToCart or addCurrentDetailPageItemToCart is available
        if (typeof window.addToCart === 'function') {
          window.addToCart(product.id, product.name, product.price, product.image, 1, 'Standard');
        } else if (window.systemCart && Array.isArray(window.systemCart)) {
          // Direct fallback to cart array
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
          localStorage.setItem("zozo_cart", JSON.stringify(window.systemCart));
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
    createWishlistDrawer();
    const overlay = document.getElementById('zozoWishlistDrawerOverlay');
    const drawer = document.getElementById('zozoWishlistDrawer');
    if (!overlay || !drawer) return;

    window.ZozoWishlist.renderDrawerContents();

    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawer.classList.add('is-open');
    });
  };

  window.closeWishlistModal = function () {
    const overlay = document.getElementById('zozoWishlistDrawerOverlay');
    const drawer = document.getElementById('zozoWishlistDrawer');
    if (!overlay || !drawer) return;

    drawer.classList.remove('is-open');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 280);
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
      window.ZozoWishlist.updateBadges();
      window.ZozoWishlist.syncAllHeartButtons();
      createWishlistDrawer();
    });
  } else {
    window.ZozoWishlist.updateBadges();
    window.ZozoWishlist.syncAllHeartButtons();
    createWishlistDrawer();
  }

})();
