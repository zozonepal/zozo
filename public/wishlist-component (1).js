// Zozo Nepal Wishlist Manager
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

    // Sync all visual hearts in DOM
    this.syncAllHeartButtons(cleanId, isNowSaved);
    this.updateDetailPageButton(cleanId);
    this.updateBadges();

    // Dispatch global event for listeners (e.g. ZozoToast)
    window.dispatchEvent(new CustomEvent("zozo_wishlist_updated", {
      detail: {
        list,
        productId: cleanId,
        isNowSaved,
        productName: customDetails.name || customDetails.productName,
        image: customDetails.image
      }
    }));

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
      event.preventDefault();
      event.stopPropagation();
    }
    if (!productId) return false;

    // Look up product details if available
    let productDetails = { ...customDetails };
    if (!productDetails.productName && !productDetails.name) {
      if (window.globalProductsCatalog && Array.isArray(window.globalProductsCatalog)) {
        const found = window.globalProductsCatalog.find(p => String(p.id) === String(productId));
        if (found) {
          productDetails = { productName: found.name, image: found.image };
        }
      } else if (window.currentSelectedProduct && String(window.currentSelectedProduct.id) === String(productId)) {
        productDetails = { productName: window.currentSelectedProduct.name, image: window.currentSelectedProduct.image };
      }
    }

    const isNowSaved = this.toggleSave(productId, productDetails);

    // Animate clicked button if event was provided
    const targetBtn = (event && event.currentTarget) || document.getElementById(`wishlist-btn-${productId}`) || document.getElementById('detailWishlistBtn');
    if (targetBtn && window.gsap) {
      gsap.timeline()
        .to(targetBtn, { scale: 1.25, duration: 0.15, ease: "back.out(2)" })
        .to(targetBtn, { scale: 1, duration: 0.2, ease: "power2.out" });
    }

    return isNowSaved;
  },

  syncAllHeartButtons(productId, isSaved) {
    const buttons = document.querySelectorAll(`[data-product-id="${productId}"], #wishlist-btn-${productId}`);
    buttons.forEach(btn => {
      const svg = btn.querySelector('svg');
      if (isSaved) {
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
  },

  updateDetailPageButton(productId) {
    const btn = document.getElementById('detailWishlistToggleBtn') || document.getElementById('quickViewWishlistBtn');
    const icon = document.getElementById('detailWishlistIcon') || document.getElementById('quickViewWishlistIcon');
    const text = document.getElementById('detailWishlistText') || document.getElementById('quickViewWishlistText');

    const checkId = productId || (window.currentSelectedProduct ? window.currentSelectedProduct.id : null);
    if (!checkId) return;

    const isSaved = this.isSaved(checkId);
    if (icon) icon.innerText = isSaved ? '❤️' : '🤍';
    if (text) text.innerText = isSaved ? 'Saved in Wishlist' : 'Save for Later';
    if (btn) {
      if (isSaved) {
        btn.style.borderColor = '#f43f5e';
        btn.style.color = '#f43f5e';
        btn.style.background = '#fff1f2';
      } else {
        btn.style.borderColor = 'var(--border-color, #e5e7eb)';
        btn.style.color = 'var(--text-main, #111827)';
        btn.style.background = 'var(--bg-card, #ffffff)';
      }
    }
  },

  updateBadges() {
    const count = this.getSavedIds().length;
    const badges = document.querySelectorAll('.wishlist-count-badge, #navWishlistBadge, #drawerWishlistBadge');
    badges.forEach(b => {
      if (!b) return;
      b.innerText = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
      if (window.gsap && count > 0) {
        gsap.fromTo(b, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
      }
    });
  }
};

// Global shorthand for inline onclick handlers
window.handleCardWishlistToggle = function(productId, event) {
  window.ZozoWishlist.handleCardWishlistToggle(productId, event);
};

document.addEventListener('DOMContentLoaded', () => {
  window.ZozoWishlist.updateBadges();
});
