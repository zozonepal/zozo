/**
 * Zozo Nepal - Reusable Toast Notification System
 * High-performance, accessible, auto-dismissing (3s default) toast engine with
 * hover-to-pause, progress countdown indicator, GSAP hardware acceleration,
 * and support for cart/wishlist rich actions.
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.ZozoToast && window.ZozoToast._initialized) {
    return;
  }

  const DEFAULT_DURATION = 3000; // 3 seconds as required
  let toastContainer = null;
  let toastIdCounter = 0;
  const activeToasts = new Map();

  // Create or retrieve the singleton toast container
  function getOrCreateContainer() {
    if (toastContainer && document.body.contains(toastContainer)) {
      return toastContainer;
    }

    toastContainer = document.getElementById('zozo-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'zozo-toast-container';
      toastContainer.className = 'zozo-toast-container';
      toastContainer.setAttribute('role', 'region');
      toastContainer.setAttribute('aria-live', 'polite');
      toastContainer.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  // Inject required CSS once
  function injectToastStyles() {
    if (document.getElementById('zozo-toast-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'zozo-toast-styles';
    styleEl.textContent = `
      .zozo-toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100005;
        display: flex;
        flex-direction: column-reverse;
        gap: 10px;
        max-width: 420px;
        width: calc(100vw - 32px);
        pointer-events: none;
        box-sizing: border-box;
      }

      @media (max-width: 640px) {
        .zozo-toast-container {
          bottom: 20px;
          right: 16px;
          left: 16px;
          width: auto;
          max-width: 100%;
          align-items: stretch;
        }
      }

      .zozo-toast-card {
        pointer-events: auto;
        position: relative;
        background: #0f172a;
        color: #ffffff;
        border-radius: 12px;
        padding: 12px 14px 14px 14px;
        box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
        user-select: none;
        touch-action: pan-y;
        cursor: default;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: transform 0.2s ease, opacity 0.25s ease, height 0.25s ease, margin 0.25s ease;
        box-sizing: border-box;
      }

      .zozo-toast-card:hover {
        box-shadow: 0 14px 34px -2px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.22);
      }

      .zozo-toast-card.type-success,
      .zozo-toast-card.type-cart {
        border-left: 4px solid #10b981;
      }

      .zozo-toast-card.type-cart {
        border-left: 4px solid #9333ea;
      }

      .zozo-toast-card.type-wishlist {
        border-left: 4px solid #f43f5e;
      }

      .zozo-toast-card.type-info {
        border-left: 4px solid #3b82f6;
      }

      .zozo-toast-card.type-warning {
        border-left: 4px solid #f59e0b;
      }

      .zozo-toast-card.type-error {
        border-left: 4px solid #ef4444;
      }

      .zozo-toast-icon-wrap {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.15rem;
        background: rgba(255, 255, 255, 0.08);
      }

      .zozo-toast-card.type-success .zozo-toast-icon-wrap {
        background: rgba(16, 185, 129, 0.18);
        color: #34d399;
      }
      .zozo-toast-card.type-cart .zozo-toast-icon-wrap {
        background: rgba(147, 51, 234, 0.22);
        color: #c084fc;
      }
      .zozo-toast-card.type-wishlist .zozo-toast-icon-wrap {
        background: rgba(244, 63, 94, 0.2);
        color: #fb7185;
      }
      .zozo-toast-card.type-info .zozo-toast-icon-wrap {
        background: rgba(59, 130, 246, 0.18);
        color: #60a5fa;
      }
      .zozo-toast-card.type-warning .zozo-toast-icon-wrap {
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
      }
      .zozo-toast-card.type-error .zozo-toast-icon-wrap {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }

      .zozo-toast-thumb {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        object-fit: contain;
        background: #ffffff;
        padding: 2px;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .zozo-toast-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .zozo-toast-title {
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        color: #f8fafc;
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1.2;
      }

      .zozo-toast-msg {
        font-size: 0.78rem;
        color: #cbd5e1;
        line-height: 1.35;
        word-break: break-word;
        font-weight: 500;
      }

      .zozo-toast-action-btn {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 7px;
        padding: 5px 10px;
        font-size: 0.74rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.18s ease;
      }

      .zozo-toast-action-btn:hover {
        background: var(--nepal-blue, #9333ea);
        border-color: var(--nepal-blue, #9333ea);
        color: #ffffff;
        transform: translateY(-1px);
      }

      .zozo-toast-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        font-size: 1.1rem;
        line-height: 1;
        flex-shrink: 0;
        transition: color 0.15s ease, background 0.15s ease;
      }

      .zozo-toast-close-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }

      /* Animated countdown progress indicator */
      .zozo-toast-progress-track {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .zozo-toast-progress-bar {
        height: 100%;
        width: 100%;
        background: #9333ea;
        transform-origin: left center;
        transition: transform 0.05s linear;
      }

      .zozo-toast-card.type-success .zozo-toast-progress-bar { background: #10b981; }
      .zozo-toast-card.type-cart .zozo-toast-progress-bar { background: #a855f7; }
      .zozo-toast-card.type-wishlist .zozo-toast-progress-bar { background: #f43f5e; }
      .zozo-toast-card.type-info .zozo-toast-progress-bar { background: #3b82f6; }
      .zozo-toast-card.type-warning .zozo-toast-progress-bar { background: #f59e0b; }
      .zozo-toast-card.type-error .zozo-toast-progress-bar { background: #ef4444; }
    `;
    document.head.appendChild(styleEl);
  }

  // Get default icon for toast type
  function getDefaultIcon(type) {
    switch (type) {
      case 'success':
        return '✓';
      case 'cart':
        return '🛍️';
      case 'wishlist':
        return '❤️';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '✕';
      default:
        return '✨';
    }
  }

  // Get default title for toast type
  function getDefaultTitle(type) {
    switch (type) {
      case 'success':
        return 'Success';
      case 'cart':
        return 'Shopping Bag Updated';
      case 'wishlist':
        return 'Wishlist Updated';
      case 'info':
        return 'Notice';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Error';
      default:
        return 'Notification';
    }
  }

  /**
   * Main Toast Class
   */
  class ToastNotification {
    constructor(message, options = {}) {
      this.id = 'zozo-toast-' + (++toastIdCounter);
      this.message = message || '';
      this.type = options.type || 'info';
      this.title = options.title || (options.showTitle !== false ? getDefaultTitle(this.type) : '');
      this.icon = options.icon || getDefaultIcon(this.type);
      this.image = options.image || null;
      this.duration = typeof options.duration === 'number' ? options.duration : DEFAULT_DURATION;
      this.actionText = options.actionText || null;
      this.onAction = typeof options.onAction === 'function' ? options.onAction : null;
      this.actionLink = options.actionLink || null;
      
      this.remainingTime = this.duration;
      this.startTime = 0;
      this.timerId = null;
      this.isPaused = false;
      this.isDismissed = false;

      this.element = null;
      this.progressBar = null;

      this.createDOM();
    }

    createDOM() {
      injectToastStyles();
      const container = getOrCreateContainer();

      const card = document.createElement('div');
      card.id = this.id;
      card.className = `zozo-toast-card type-${this.type}`;
      card.setAttribute('role', 'alert');

      let iconOrImageHtml = '';
      if (this.image) {
        iconOrImageHtml = `<img class="zozo-toast-thumb" src="${this.image}" alt="Product" onerror="this.onerror=null; this.src='zozonepal.png'">`;
      } else {
        iconOrImageHtml = `<div class="zozo-toast-icon-wrap">${this.icon}</div>`;
      }

      let titleHtml = this.title ? `<div class="zozo-toast-title">${this.title}</div>` : '';
      let msgHtml = `<div class="zozo-toast-msg">${this.message}</div>`;

      let actionBtnHtml = '';
      if (this.actionText) {
        actionBtnHtml = `<button type="button" class="zozo-toast-action-btn" id="${this.id}-action">${this.actionText}</button>`;
      }

      const closeBtnHtml = `
        <button type="button" class="zozo-toast-close-btn" aria-label="Dismiss" title="Dismiss">
          &times;
        </button>
      `;

      const progressHtml = `
        <div class="zozo-toast-progress-track">
          <div class="zozo-toast-progress-bar" id="${this.id}-progress"></div>
        </div>
      `;

      card.innerHTML = `
        ${iconOrImageHtml}
        <div class="zozo-toast-body">
          ${titleHtml}
          ${msgHtml}
        </div>
        ${actionBtnHtml}
        ${closeBtnHtml}
        ${progressHtml}
      `;

      // Event bindings
      const closeBtn = card.querySelector('.zozo-toast-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dismiss();
        });
      }

      if (this.actionText) {
        const actionBtn = card.querySelector('.zozo-toast-action-btn');
        if (actionBtn) {
          actionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onAction) {
              this.onAction(this);
            } else if (this.actionLink) {
              window.location.href = this.actionLink;
            }
            this.dismiss();
          });
        }
      }

      // Hover to pause auto-dismiss
      card.addEventListener('mouseenter', () => this.pauseTimer());
      card.addEventListener('mouseleave', () => this.resumeTimer());

      // Touch swipe dismissal support
      let startX = 0;
      let currentX = 0;
      card.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          startX = e.touches[0].clientX;
          this.pauseTimer();
        }
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          currentX = e.touches[0].clientX;
          const diff = currentX - startX;
          if (diff > 0) {
            card.style.transform = `translateX(${diff}px)`;
            card.style.opacity = `${Math.max(0, 1 - diff / 200)}`;
          }
        }
      }, { passive: true });

      card.addEventListener('touchend', () => {
        const diff = currentX - startX;
        if (diff > 90) {
          this.dismiss('right');
        } else {
          card.style.transform = '';
          card.style.opacity = '';
          this.resumeTimer();
        }
      });

      this.element = card;
      this.progressBar = card.querySelector('.zozo-toast-progress-bar');
      container.appendChild(card);
      activeToasts.set(this.id, this);

      this.animateIn();
      this.startTimer();
    }

    animateIn() {
      if (window.gsap) {
        gsap.fromTo(this.element, 
          { opacity: 0, y: 30, scale: 0.92 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" }
        );
      } else {
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(30px) scale(0.92)';
        requestAnimationFrame(() => {
          this.element.style.opacity = '1';
          this.element.style.transform = 'translateY(0) scale(1)';
        });
      }
    }

    startTimer() {
      if (this.duration <= 0) return;
      this.startTime = Date.now();
      this.updateProgress();

      this.timerId = setTimeout(() => {
        this.dismiss();
      }, this.remainingTime);
    }

    updateProgress() {
      if (!this.progressBar || this.isDismissed) return;

      const elapsed = Date.now() - this.startTime;
      const progressPercent = Math.max(0, 1 - (elapsed / this.remainingTime));
      
      this.progressBar.style.transform = `scaleX(${progressPercent})`;

      if (!this.isPaused && !this.isDismissed && progressPercent > 0) {
        requestAnimationFrame(() => this.updateProgress());
      }
    }

    pauseTimer() {
      if (this.isPaused || this.isDismissed || this.duration <= 0) return;
      this.isPaused = true;
      clearTimeout(this.timerId);
      const elapsed = Date.now() - this.startTime;
      this.remainingTime = Math.max(0, this.remainingTime - elapsed);
    }

    resumeTimer() {
      if (!this.isPaused || this.isDismissed || this.duration <= 0) return;
      this.isPaused = false;
      this.startTime = Date.now();
      this.updateProgress();
      this.timerId = setTimeout(() => {
        this.dismiss();
      }, this.remainingTime);
    }

    dismiss(direction = 'down') {
      if (this.isDismissed) return;
      this.isDismissed = true;
      clearTimeout(this.timerId);

      const el = this.element;
      if (!el) return;

      activeToasts.delete(this.id);

      const onComplete = () => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      };

      if (window.gsap) {
        const xOffset = direction === 'right' ? 120 : 0;
        const yOffset = direction === 'down' ? 20 : 0;

        gsap.timeline({ onComplete })
          .to(el, {
            opacity: 0,
            x: xOffset,
            y: yOffset,
            scale: 0.94,
            duration: 0.24,
            ease: "power2.in"
          })
          .to(el, {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
            marginBottom: 0,
            duration: 0.18,
            ease: "power1.inOut"
          });
      } else {
        el.style.opacity = '0';
        el.style.transform = direction === 'right' ? 'translateX(100px)' : 'translateY(20px)';
        setTimeout(onComplete, 250);
      }
    }
  }

  // --- PUBLIC API ---
  const ZozoToast = {
    _initialized: true,

    show(message, options = {}) {
      // Handle string type shorthand: show("Saved", "success")
      if (typeof options === 'string') {
        options = { type: options };
      }
      return new ToastNotification(message, options);
    },

    success(message, options = {}) {
      return this.show(message, { ...options, type: 'success' });
    },

    error(message, options = {}) {
      return this.show(message, { ...options, type: 'error' });
    },

    info(message, options = {}) {
      return this.show(message, { ...options, type: 'info' });
    },

    warning(message, options = {}) {
      return this.show(message, { ...options, type: 'warning' });
    },

    /**
     * Dedicated Cart Toast Helper
     * @param {string} productName 
     * @param {object} details - { qty, color, image, price, onAction }
     */
    cart(productName, details = {}) {
      const qty = details.qty || 1;
      const color = details.color ? ` (${details.color})` : '';
      const message = `Added ${qty}x "${productName}"${color} to Shopping Cart!`;

      return this.show(message, {
        type: 'cart',
        title: '🛍️ Added to Cart',
        image: details.image || null,
        icon: '🛍️',
        actionText: details.actionText || 'View Bag →',
        onAction: details.onAction || function () {
          if (typeof window.toggleCartSidebar === 'function') {
            window.toggleCartSidebar(true);
          } else {
            window.location.href = 'index.html';
          }
        },
        duration: details.duration || DEFAULT_DURATION
      });
    },

    dismissAll() {
      activeToasts.forEach((toast) => {
        toast.dismiss();
      });
    }
  };

  // Expose to window
  window.ZozoToast = ZozoToast;

  // Backward-compatible global showToastNotification function
  window.showToastNotification = function (msg, typeOrOpts = 'info') {
    if (!msg) return;

    // Detect if msg already has emoji indicators to map to types cleanly
    let detectedType = 'info';
    if (typeof typeOrOpts === 'string') {
      detectedType = typeOrOpts;
    } else if (typeOrOpts && typeOrOpts.type) {
      detectedType = typeOrOpts.type;
    }

    if (msg.includes('Added') && (msg.includes('cart') || msg.includes('Cart') || msg.includes('Bag'))) {
      detectedType = 'cart';
    } else if (msg.includes('🎉') || msg.includes('✓') || msg.includes('success')) {
      detectedType = 'success';
    } else if (msg.includes('⚠️') || msg.includes('warning') || msg.includes('Please')) {
      detectedType = 'warning';
    } else if (msg.includes('Invalid') || msg.includes('Error') || msg.includes('failed') || msg.includes('error')) {
      detectedType = 'error';
    }

    const opts = typeof typeOrOpts === 'object' ? typeOrOpts : { type: detectedType };
    if (!opts.type) opts.type = detectedType;

    return ZozoToast.show(msg, opts);
  };

  // Alias
  window.showToast = window.showToastNotification;

})();
