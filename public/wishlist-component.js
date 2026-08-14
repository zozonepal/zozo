/**
 * Zozo Nepal - Saved for Later / Wishlist System
 * Stores saved products in localStorage ('zozo_saved_for_later')
 * Provides responsive modal, heart icon state synchronization, and cart transfer.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'zozo_saved_for_later';

  const ZozoWishlist = {
    modalEl: null,
    searchQuery: '',

    init: function () {
      this.injectStyles();
      this.injectModal();
      this.updateBadges();
      this.syncAllHeartButtons();

      // Listen for cross-tab or external changes
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.updateBadges();
          this.syncAllHeartButtons();
          if (this.isModalOpen()) {
            this.renderModal();
          }
        }
      });

      // Dispatch initial event
      window.dispatchEvent(new CustomEvent('zozo-wishlist-ready', { detail: { count: this.getCount() } }));
    },

    // --- STORAGE HELPERS ---
    getWishlist: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Error reading wishlist from localStorage:', err);
        return [];
      }
    },

    saveWishlist: function (list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        if (err.name === 'QuotaExceededError' || err.code === 22) {
          console.warn('Storage quota exceeded, clearing obsolete caches...');
          try {
            localStorage.removeItem('zozo_products_cache');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          } catch (retryErr) {
            console.error('Failed to save wishlist after cache clear:', retryErr);
          }
        } else {
          console.error('Storage error while saving wishlist:', err);
        }
      }
      this.updateBadges();
      this.syncAllHeartButtons();
      window.dispatchEvent(new CustomEvent('zozo-wishlist-updated', { detail: { count: list.length, items: list } }));
    },

    getCount: function () {
      return this.getWishlist().length;
    },

    isSaved: function (productId) {
      if (!productId) return false;
      const list = this.getWishlist();
      return list.some((item) => String(item.id) === String(productId));
    },

    // --- ACTIONS ---
    toggle: function (productOrId, event) {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }

      let product = null;
      if (typeof productOrId === 'object' && productOrId !== null && productOrId.id) {
        product = productOrId;
      } else if (typeof productOrId === 'string' || typeof productOrId === 'number') {
        const idStr = String(productOrId);
        // Look up in globalProductsCatalog if available
        if (window.globalProductsCatalog && Array.isArray(window.globalProductsCatalog)) {
          product = window.globalProductsCatalog.find((p) => String(p.id) === idStr);
        }
        // Look up in currentSelectedProduct if on product detail page
        if (!product && window.currentSelectedProduct && String(window.currentSelectedProduct.id) === idStr) {
          product = window.currentSelectedProduct;
        }
        // Look up in existing wishlist
        if (!product) {
          product = this.getWishlist().find((p) => String(p.id) === idStr);
        }
        // Fallback placeholder object if ID only
        if (!product) {
          product = { id: idStr, name: 'Saved Product', price: 0, image: 'zozonepal.png' };
        }
      }

      if (!product || !product.id) return false;

      const pId = String(product.id);
      const list = this.getWishlist();
      const existingIdx = list.findIndex((item) => String(item.id) === pId);

      let isNowSaved = false;

      if (existingIdx > -1) {
        // Remove
        list.splice(existingIdx, 1);
        this.saveWishlist(list);
        isNowSaved = false;
        this.showToast(`💔 Removed "${product.name || 'Product'}" from Saved list.`);
      } else {
        // Add
        const itemToSave = {
          id: pId,
          name: product.name || 'Product',
          price: Number(product.price || 0),
          oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
          image: product.image || 'zozonepal.png',
          description: product.description || '',
          category: product.category || 'General',
          addedAt: new Date().toISOString()
        };
        list.unshift(itemToSave);
        this.saveWishlist(list);
        isNowSaved = true;
        this.showToast(`❤️ Saved "${product.name || 'Product'}" for later!`);
      }

      // Animate trigger element if available
      const targetBtn = (event && event.currentTarget) || document.getElementById(`wishlist-btn-${pId}`);
      if (targetBtn) {
        targetBtn.classList.remove('heart-pop-anim');
        void targetBtn.offsetWidth; // force reflow
        targetBtn.classList.add('heart-pop-anim');
        setTimeout(() => targetBtn.classList.remove('heart-pop-anim'), 600);
      }

      // Also trigger detail page button animation if present
      const detailBtn = document.getElementById('detailWishlistBtn');
      if (detailBtn && window.currentSelectedProduct && String(window.currentSelectedProduct.id) === pId) {
        detailBtn.classList.remove('heart-pop-anim');
        void detailBtn.offsetWidth;
        detailBtn.classList.add('heart-pop-anim');
        this.updateDetailPageButton();
      }

      if (this.isModalOpen()) {
        this.renderModal();
      }

      return isNowSaved;
    },

    remove: function (productId) {
      if (!productId) return;
      const list = this.getWishlist().filter((item) => String(item.id) !== String(productId));
      this.saveWishlist(list);
      this.showToast('🗑️ Item removed from Saved for Later.');
      if (this.isModalOpen()) {
        this.renderModal();
      }
    },

    clearAll: function () {
      if (this.getCount() === 0) return;
      if (confirm('Are you sure you want to remove all saved products?')) {
        this.saveWishlist([]);
        this.showToast('🧹 Cleared all saved products.');
        if (this.isModalOpen()) {
          this.renderModal();
        }
      }
    },

    moveToCart: function (productId) {
      const item = this.getWishlist().find((p) => String(p.id) === String(productId));
      if (!item) return;

      // Add to shopping cart
      try {
        let cart = [];
        const rawCart = localStorage.getItem('zozo_cart');
        if (rawCart) {
          cart = JSON.parse(rawCart);
        }

        const cartItemId = `${item.id}-Standard`;
        const matchIdx = cart.findIndex((c) => c.cartId === cartItemId || c.id === item.id);

        if (matchIdx > -1) {
          cart[matchIdx].quantity = (cart[matchIdx].quantity || 1) + 1;
        } else {
          cart.push({
            cartId: cartItemId,
            id: item.id,
            name: item.name,
            price: Number(item.price || 0),
            image: item.image || 'zozonepal.png',
            color: 'Standard',
            quantity: 1
          });
        }

        localStorage.setItem('zozo_cart', JSON.stringify(cart));

        if (window.systemCart) {
          window.systemCart = cart;
        }

        if (typeof window.synchronizeShoppingBagUIState === 'function') {
          window.synchronizeShoppingBagUIState(true);
        }
        if (typeof window.triggerCartBadgeAnimation === 'function') {
          window.triggerCartBadgeAnimation();
        }

        // Remove from wishlist
        this.remove(item.id);
        this.showToast(`🛍️ Moved "${item.name}" to your Shopping Bag!`);
      } catch (err) {
        console.error('Error moving item to cart:', err);
        this.showToast('⚠️ Could not move item to cart. Please try again.');
      }
    },

    moveAllToCart: function () {
      const items = this.getWishlist();
      if (items.length === 0) return;

      try {
        let cart = [];
        const rawCart = localStorage.getItem('zozo_cart');
        if (rawCart) {
          cart = JSON.parse(rawCart);
        }

        items.forEach((item) => {
          const cartItemId = `${item.id}-Standard`;
          const matchIdx = cart.findIndex((c) => c.cartId === cartItemId || c.id === item.id);
          if (matchIdx > -1) {
            cart[matchIdx].quantity = (cart[matchIdx].quantity || 1) + 1;
          } else {
            cart.push({
              cartId: cartItemId,
              id: item.id,
              name: item.name,
              price: Number(item.price || 0),
              image: item.image || 'zozonepal.png',
              color: 'Standard',
              quantity: 1
            });
          }
        });

        localStorage.setItem('zozo_cart', JSON.stringify(cart));
        if (window.systemCart) {
          window.systemCart = cart;
        }
        if (typeof window.synchronizeShoppingBagUIState === 'function') {
          window.synchronizeShoppingBagUIState(true);
        }
        if (typeof window.triggerCartBadgeAnimation === 'function') {
          window.triggerCartBadgeAnimation();
        }

        this.saveWishlist([]);
        this.showToast(`✨ Moved all ${items.length} items to your Shopping Bag!`);
        if (this.isModalOpen()) {
          this.renderModal();
        }
      } catch (err) {
        console.error('Error moving all to cart:', err);
      }
    },

    buyNow: function (productId) {
      this.moveToCart(productId);
      this.closeModal();
      window.location.href = 'checkout.html';
    },

    // --- UI UPDATES & SYNC ---
    updateBadges: function () {
      const count = this.getCount();
      const badges = document.querySelectorAll('.wishlist-count-badge');
      badges.forEach((b) => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-flex' : 'none';
      });

      const drawerBadges = document.querySelectorAll('.drawer-wishlist-count');
      drawerBadges.forEach((db) => {
        db.textContent = count > 0 ? `${count} items` : '0';
      });
    },

    syncAllHeartButtons: function () {
      const list = this.getWishlist();
      const savedIds = new Set(list.map((item) => String(item.id)));

      // Sync all buttons with data-product-id or matching id
      document.querySelectorAll('.card-wishlist-heart-btn, [data-wishlist-toggle-id]').forEach((btn) => {
        const pId = btn.getAttribute('data-product-id') || btn.getAttribute('data-wishlist-toggle-id');
        if (!pId) return;

        const isSaved = savedIds.has(String(pId));
        if (isSaved) {
          btn.classList.add('is-saved');
          btn.title = 'Remove from Saved for Later';
          btn.setAttribute('aria-label', 'Remove from Saved for Later');
        } else {
          btn.classList.remove('is-saved');
          btn.title = 'Save for Later';
          btn.setAttribute('aria-label', 'Save for Later');
        }

        const svgPath = btn.querySelector('svg path');
        const svg = btn.querySelector('svg');
        if (svg) {
          if (isSaved) {
            svg.setAttribute('fill', '#f43f5e');
            svg.setAttribute('stroke', '#f43f5e');
          } else {
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
          }
        }
      });

      this.updateDetailPageButton();
    },

    updateDetailPageButton: function () {
      const detailBtn = document.getElementById('detailWishlistBtn');
      if (!detailBtn || !window.currentSelectedProduct) return;

      const isSaved = this.isSaved(window.currentSelectedProduct.id);
      const iconSpan = detailBtn.querySelector('.wishlist-btn-icon');
      const textSpan = detailBtn.querySelector('.wishlist-btn-text');

      if (isSaved) {
        detailBtn.classList.add('is-saved');
        detailBtn.style.background = '#fff1f2';
        detailBtn.style.borderColor = '#fda4af';
        detailBtn.style.color = '#e11d48';
        if (iconSpan) iconSpan.innerHTML = '❤️';
        if (textSpan) textSpan.innerText = 'Saved in Wishlist';
      } else {
        detailBtn.classList.remove('is-saved');
        detailBtn.style.background = 'var(--bg-card, #ffffff)';
        detailBtn.style.borderColor = 'var(--border-color, #e2e8f0)';
        detailBtn.style.color = 'var(--text-main, #0f172a)';
        if (iconSpan) iconSpan.innerHTML = '🤍';
        if (textSpan) textSpan.innerText = 'Save for Later';
      }
    },

    showToast: function (msg) {
      if (typeof window.showToastNotification === 'function') {
        window.showToastNotification(msg);
        return;
      }
      let toast = document.getElementById('appToastNotice');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appToastNotice';
        toast.style.cssText = `
          position: fixed; bottom: 24px; right: 24px; z-index: 99999;
          background: #1e293b; color: #ffffff; padding: 12px 20px;
          border-radius: 10px; font-weight: 700; font-size: 0.9rem;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border-left: 4px solid #f43f5e;
          transition: all 0.3s ease; opacity: 0; transform: translateY(20px); pointer-events: none;
        `;
        document.body.appendChild(toast);
      }
      toast.innerText = msg;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      clearTimeout(toast.timeoutId);
      toast.timeoutId = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
      }, 3000);
    },

    // --- MODAL HANDLING ---
    isModalOpen: function () {
      return this.modalEl && this.modalEl.style.display === 'flex';
    },

    openModal: function () {
      if (!this.modalEl) this.injectModal();
      this.searchQuery = '';
      const searchInput = document.getElementById('wishlistSearchInput');
      if (searchInput) searchInput.value = '';
      this.modalEl.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.renderModal();
    },

    closeModal: function () {
      if (this.modalEl) {
        this.modalEl.style.display = 'none';
        document.body.style.overflow = '';
      }
    },

    renderModal: function () {
      const itemsContainer = document.getElementById('wishlistItemsList');
      const countEl = document.getElementById('wishlistModalCountText');
      const summaryBar = document.getElementById('wishlistSummaryActionBar');
      const totalValEl = document.getElementById('wishlistTotalValueText');
      const itemCountEl = document.getElementById('wishlistSummaryCountText');

      if (!itemsContainer) return;

      const allItems = this.getWishlist();
      let filtered = allItems;

      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase().trim();
        filtered = allItems.filter(
          (i) => (i.name && i.name.toLowerCase().includes(q)) || (i.category && i.category.toLowerCase().includes(q))
        );
      }

      if (countEl) {
        countEl.innerText = `${allItems.length} ${allItems.length === 1 ? 'item' : 'items'}`;
      }

      if (allItems.length === 0) {
        if (summaryBar) summaryBar.style.display = 'none';
        itemsContainer.innerHTML = `
          <div class="wishlist-empty-state">
            <div class="wishlist-empty-icon">🤍</div>
            <h3 class="wishlist-empty-title">Your Saved List is Empty</h3>
            <p class="wishlist-empty-subtitle">Found something you like? Tap the heart icon on any product card or detail page to save it here for later.</p>
            <button class="wishlist-explore-btn" onclick="window.ZozoWishlist.closeModal(); if(window.location.pathname.includes('product.html')) { window.location.href='index.html'; } else { window.scrollTo({ top: 400, behavior: 'smooth' }); }">
              🛍️ Start Exploring Products
            </button>
          </div>
        `;
        return;
      }

      if (summaryBar) {
        summaryBar.style.display = 'flex';
        const totalValue = allItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        if (totalValEl) totalValEl.innerText = `Rs. ${totalValue.toLocaleString()}`;
        if (itemCountEl) itemCountEl.innerText = `${allItems.length} Saved Products`;
      }

      if (filtered.length === 0) {
        itemsContainer.innerHTML = `
          <div style="text-align:center; padding:40px 20px; color:var(--text-muted, #64748b);">
            <p style="font-weight:700; font-size:1rem; margin-bottom:6px;">No saved products match "${this.searchQuery}"</p>
            <button class="wishlist-text-btn" onclick="window.ZozoWishlist.searchQuery=''; document.getElementById('wishlistSearchInput').value=''; window.ZozoWishlist.renderModal();">Clear Search</button>
          </div>
        `;
        return;
      }

      itemsContainer.innerHTML = `
        <div class="wishlist-grid-list">
          ${filtered
            .map((item) => {
              let discountBadge = '';
              if (item.oldPrice && item.oldPrice > item.price) {
                const disc = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
                discountBadge = `<span class="wishlist-disc-tag">-${disc}% OFF</span>`;
              }
              const formattedPrice = Number(item.price || 0).toLocaleString();
              const formattedOldPrice = item.oldPrice ? Number(item.oldPrice).toLocaleString() : '';

              return `
              <div class="wishlist-item-card" id="wl-card-${item.id}">
                <div class="wishlist-item-thumb-zone" onclick="window.location.href='product.html?id=${item.id}'" style="cursor:pointer;" title="View Product Details">
                  <img src="${item.image || 'zozonepal.png'}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src='zozonepal.png'">
                  ${discountBadge}
                </div>
                <div class="wishlist-item-info">
                  <div class="wishlist-item-header">
                    <span class="wishlist-cat-pill">${item.category || 'Gadget'}</span>
                    <button class="wishlist-delete-btn" onclick="window.ZozoWishlist.remove('${item.id}')" title="Remove from Saved" aria-label="Remove item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <h4 class="wishlist-item-name" onclick="window.location.href='product.html?id=${item.id}'" style="cursor:pointer;" title="${item.name}">${item.name}</h4>
                  <div class="wishlist-item-price-row">
                    <span class="wishlist-item-price">Rs. ${formattedPrice}</span>
                    ${formattedOldPrice ? `<span class="wishlist-item-old-price">Rs. ${formattedOldPrice}</span>` : ''}
                  </div>
                  <div class="wishlist-item-actions">
                    <button class="wishlist-add-cart-btn" onclick="window.ZozoWishlist.moveToCart('${item.id}')">
                      🛒 Move to Bag
                    </button>
                    <button class="wishlist-buy-btn" onclick="window.ZozoWishlist.buyNow('${item.id}')" title="Direct Checkout">
                      ⚡ Buy Now
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `;
    },

    // --- MARKUP INJECTION ---
    injectModal: function () {
      if (document.getElementById('zozoWishlistModal')) {
        this.modalEl = document.getElementById('zozoWishlistModal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'zozoWishlistModal';
      modal.className = 'wishlist-modal-overlay';
      modal.style.display = 'none';
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal();
      };

      modal.innerHTML = `
        <div class="wishlist-modal-card">
          <!-- Header -->
          <div class="wishlist-modal-header">
            <div class="wishlist-header-left">
              <div class="wishlist-header-icon-box">❤️</div>
              <div>
                <h2 class="wishlist-modal-title">Saved for Later</h2>
                <p class="wishlist-modal-subtitle">Your personal wishlist & bookmark collection (<span id="wishlistModalCountText">0 items</span>)</p>
              </div>
            </div>
            <button class="wishlist-modal-close" onclick="window.ZozoWishlist.closeModal()" aria-label="Close Wishlist Modal">&times;</button>
          </div>

          <!-- Search & Filter Filter Bar -->
          <div class="wishlist-filter-bar">
            <div class="wishlist-search-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="wishlistSearchInput" placeholder="Search in your saved products..." oninput="window.ZozoWishlist.searchQuery = this.value; window.ZozoWishlist.renderModal();">
            </div>
          </div>

          <!-- Summary Strip & Bulk Actions -->
          <div id="wishlistSummaryActionBar" class="wishlist-summary-bar" style="display:none;">
            <div class="wishlist-summary-stat">
              <span id="wishlistSummaryCountText" style="font-weight:700;">0 Items</span>
              <span style="opacity:0.6;">•</span>
              <span>Total Value: <strong id="wishlistTotalValueText" style="color:var(--nepal-blue, #9333ea);">Rs. 0</strong></span>
            </div>
            <div class="wishlist-bulk-btns">
              <button class="wishlist-move-all-btn" onclick="window.ZozoWishlist.moveAllToCart()">
                🛒 Move All to Cart
              </button>
              <button class="wishlist-clear-all-btn" onclick="window.ZozoWishlist.clearAll()" title="Clear wishlist">
                Clear All
              </button>
            </div>
          </div>

          <!-- Scrollable Items List Container -->
          <div class="wishlist-modal-body" id="wishlistItemsList">
            <!-- Dynamic Content -->
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;

      // Close modal on Escape
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isModalOpen()) {
          this.closeModal();
        }
      });
    },

    injectStyles: function () {
      if (document.getElementById('zozoWishlistStyles')) return;
      const style = document.createElement('style');
      style.id = 'zozoWishlistStyles';
      style.textContent = `
        /* Heart Icon on Product Cards */
        .card-wishlist-heart-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 12;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          color: #64748b;
          cursor: pointer;
          padding: 0;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dark-mode .card-wishlist-heart-btn {
          background: rgba(30, 41, 59, 0.92);
          border-color: rgba(51, 65, 85, 0.9);
          color: #94a3b8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .card-wishlist-heart-btn:hover {
          transform: scale(1.15);
          background: #ffffff;
          border-color: #fda4af;
          color: #f43f5e;
          box-shadow: 0 4px 14px rgba(244, 63, 94, 0.25);
        }

        .dark-mode .card-wishlist-heart-btn:hover {
          background: #1e293b;
          border-color: #f43f5e;
          color: #f43f5e;
        }

        .card-wishlist-heart-btn.is-saved {
          background: #ffffff;
          border-color: #fecdd3;
          color: #f43f5e;
          box-shadow: 0 2px 10px rgba(244, 63, 94, 0.28);
        }

        .dark-mode .card-wishlist-heart-btn.is-saved {
          background: #1e293b;
          border-color: #881337;
          color: #f43f5e;
        }

        .card-wishlist-heart-btn svg {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-wishlist-heart-btn:active svg {
          transform: scale(0.85);
        }

        .heart-pop-anim {
          animation: heartBounceAnim 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes heartBounceAnim {
          0% { transform: scale(1); }
          40% { transform: scale(1.4); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        /* Wishlist Count Badge */
        .wishlist-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          font-size: 0.72rem;
          font-weight: 800;
          border-radius: 999px;
          background: #f43f5e;
          color: #ffffff;
          line-height: 1;
        }

        /* Modal Overlay */
        .wishlist-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 10020;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          animation: wlFadeIn 0.2s ease forwards;
        }

        @keyframes wlFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .wishlist-modal-card {
          background: var(--bg-card, #ffffff);
          border-radius: 20px;
          max-width: 720px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-color, #e2e8f0);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
          color: var(--text-main, #0f172a);
          overflow: hidden;
          position: relative;
          animation: wlPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes wlPop {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Modal Header */
        .wishlist-modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card, #ffffff);
        }

        .wishlist-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .wishlist-header-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #fff1f2;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          border: 1px solid #fecdd3;
          flex-shrink: 0;
        }

        .wishlist-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-main, #0f172a);
          line-height: 1.2;
        }

        .wishlist-modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted, #64748b);
          margin: 2px 0 0 0;
          font-weight: 600;
        }

        .wishlist-modal-close {
          background: none;
          border: none;
          font-size: 1.8rem;
          color: var(--text-muted, #64748b);
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          border-radius: 8px;
          transition: color 0.2s ease;
        }
        .wishlist-modal-close:hover {
          color: #f43f5e;
        }

        /* Filter & Search */
        .wishlist-filter-bar {
          padding: 12px 24px;
          background: var(--bg-main, #f8fafc);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .wishlist-search-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 10px;
          padding: 8px 12px;
          color: var(--text-muted, #64748b);
        }

        .wishlist-search-wrapper input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 0.85rem;
          color: var(--text-main, #0f172a);
          font-weight: 600;
        }

        /* Summary Action Bar */
        .wishlist-summary-bar {
          padding: 10px 24px;
          background: #faf5ff;
          border-bottom: 1px solid #f3e8ff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 0.85rem;
        }

        .dark-mode .wishlist-summary-bar {
          background: #2e1065;
          border-color: #3b0764;
        }

        .wishlist-summary-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-main, #0f172a);
        }

        .wishlist-bulk-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wishlist-move-all-btn {
          background: var(--nepal-blue, #9333ea);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .wishlist-move-all-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .wishlist-clear-all-btn {
          background: transparent;
          color: var(--text-muted, #64748b);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wishlist-clear-all-btn:hover {
          color: #f43f5e;
          border-color: #fda4af;
          background: #fff1f2;
        }

        /* Body & Grid */
        .wishlist-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
          max-height: 60vh;
        }

        .wishlist-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .wishlist-item-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          gap: 12px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .wishlist-item-card:hover {
          border-color: #fda4af;
          box-shadow: 0 6px 16px rgba(244, 63, 94, 0.08);
          transform: translateY(-2px);
        }

        .wishlist-item-thumb-zone {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          background: var(--bg-main, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wishlist-item-thumb-zone img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .wishlist-item-card:hover .wishlist-item-thumb-zone img {
          transform: scale(1.06);
        }

        .wishlist-disc-tag {
          position: absolute;
          top: 4px;
          left: 4px;
          background: #e11d48;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 4px;
          border-radius: 4px;
          line-height: 1;
        }

        .wishlist-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .wishlist-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .wishlist-cat-pill {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--nepal-blue, #9333ea);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .wishlist-delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .wishlist-delete-btn:hover {
          color: #f43f5e;
          transform: scale(1.15);
        }

        .wishlist-item-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-main, #0f172a);
          margin: 3px 0 6px 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wishlist-item-name:hover {
          color: var(--nepal-blue, #9333ea);
        }

        .wishlist-item-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-bottom: 8px;
        }

        .wishlist-item-price {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--nepal-blue, #9333ea);
        }

        .wishlist-item-old-price {
          font-size: 0.75rem;
          color: var(--text-muted, #94a3b8);
          text-decoration: line-through;
        }

        .wishlist-item-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .wishlist-add-cart-btn {
          flex: 1;
          background: #1e293b;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .wishlist-add-cart-btn:hover {
          background: #0f172a;
          transform: translateY(-1px);
        }

        .wishlist-buy-btn {
          background: #fff1f2;
          color: #e11d48;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .wishlist-buy-btn:hover {
          background: #e11d48;
          color: #ffffff;
          border-color: #e11d48;
        }

        /* Empty State */
        .wishlist-empty-state {
          text-align: center;
          padding: 48px 20px;
        }

        .wishlist-empty-icon {
          font-size: 3rem;
          margin-bottom: 14px;
          display: inline-block;
          animation: floatHeart 2.4s ease-in-out infinite alternate;
        }

        @keyframes floatHeart {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px) scale(1.08); }
        }

        .wishlist-empty-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          margin-bottom: 8px;
        }

        .wishlist-empty-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted, #64748b);
          max-width: 380px;
          margin: 0 auto 20px auto;
          line-height: 1.5;
        }

        .wishlist-explore-btn {
          background: var(--nepal-blue, #9333ea);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 10px 22px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(147, 51, 234, 0.3);
          transition: all 0.2s ease;
        }
        .wishlist-explore-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(147, 51, 234, 0.4);
        }

        .wishlist-text-btn {
          background: none;
          border: none;
          color: var(--nepal-blue, #9333ea);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .wishlist-modal-card {
            max-height: 94vh;
            border-radius: 16px;
          }
          .wishlist-grid-list {
            grid-template-columns: 1fr;
          }
          .wishlist-modal-header {
            padding: 14px 18px;
          }
          .wishlist-modal-body {
            padding: 14px 18px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Expose globally
  window.ZozoWishlist = ZozoWishlist;
  window.openWishlistModal = function () {
    ZozoWishlist.openModal();
  };
  window.openSavedForLaterModal = function () {
    ZozoWishlist.openModal();
  };
  window.handleCardWishlistToggle = function (productId, event) {
    return ZozoWishlist.toggle(productId, event);
  };

  // Auto-init once DOM is loaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ZozoWishlist.init());
  } else {
    ZozoWishlist.init();
  }
})();
