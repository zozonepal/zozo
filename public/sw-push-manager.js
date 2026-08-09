/**
 * Zozo Nepal - Push Notification Manager & Service Worker Client
 */
(function () {
  'use strict';

  const ZozoPushManager = {
    swRegistration: null,
    isSupported: 'serviceWorker' in navigator && 'Notification' in window,
    permissionStatus: 'default',
    preferences: {
      orderUpdates: true,
      promoOffers: true,
      soundVibrate: true
    },

    init: async function () {
      this.loadPreferences();
      this.checkPermissionStatus();

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          this.swRegistration = reg;
          console.log('[Zozo Push] Service Worker registered successfully with scope:', reg.scope);
        } catch (err) {
          console.warn('[Zozo Push] Service Worker registration failed:', err);
        }
      }

      this.injectNotificationUI();
      this.injectNotificationModal();
      this.updateHeaderBellState();
    },

    loadPreferences: function () {
      try {
        const saved = localStorage.getItem('zozo_push_preferences');
        if (saved) {
          this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('Could not read push preferences:', e);
      }
    },

    savePreferences: function () {
      try {
        localStorage.setItem('zozo_push_preferences', JSON.stringify(this.preferences));
      } catch (e) {
        console.warn('Could not save push preferences:', e);
      }
    },

    checkPermissionStatus: function () {
      if ('Notification' in window) {
        this.permissionStatus = Notification.permission;
      } else {
        this.permissionStatus = 'unsupported';
      }
      return this.permissionStatus;
    },

    requestPermission: async function () {
      if (!('Notification' in window)) {
        this.showToast('⚠️ Push Notifications are not supported in this browser.');
        return 'unsupported';
      }

      try {
        const result = await Notification.requestPermission();
        this.permissionStatus = result;
        this.updateHeaderBellState();

        if (result === 'granted') {
          this.showToast('🔔 Push Notifications enabled! You will receive order & promo updates.');
          this.sendSystemNotification(
            '🔔 Welcome to Zozo Nepal Alerts!',
            'You have successfully enabled push notifications for live order updates and exclusive deals.',
            { url: window.location.href, type: 'welcome' }
          );
        } else if (result === 'denied') {
          this.showToast('🚫 Push notifications were blocked in browser settings.');
        }

        return result;
      } catch (err) {
        console.error('Permission request failed:', err);
        return 'error';
      }
    },

    sendSystemNotification: function (title, body, dataPayload = {}) {
      if (this.permissionStatus !== 'granted') {
        console.warn('Notification permission not granted. Status:', this.permissionStatus);
      }

      // 1. Try Service Worker postMessage
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'TRIGGER_PUSH_NOTIFICATION',
          payload: {
            title: title,
            body: body,
            icon: '/zozonepal.png',
            badge: '/zozonepal.png',
            data: dataPayload,
            tag: 'zozo-alert-' + Date.now(),
            actions: [
              { action: 'open_url', title: '🛍️ Open Link' },
              { action: 'dismiss', title: '✕ Dismiss' }
            ]
          }
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        // Fallback standard Browser Notification
        try {
          new Notification(title, {
            body: body,
            icon: '/zozonepal.png',
            badge: '/zozonepal.png',
            data: dataPayload
          });
        } catch (e) {
          console.warn('Fallback notification creation failed:', e);
        }
      }
    },

    // Trigger Order Status Notification
    sendOrderUpdateNotification: function (orderId, statusText, detailsText, targetUrl) {
      if (!this.preferences.orderUpdates) return;
      const title = `📦 Order #${orderId} Status Update`;
      const body = `Status: ${statusText}. ${detailsText || 'Tap to view live delivery timeline.'}`;
      const url = targetUrl || `/product.html?orderTrack=${orderId}`;

      this.sendSystemNotification(title, body, { url: url, type: 'order', orderId: orderId });
    },

    // Trigger Promotional Notification
    sendPromoOfferNotification: function (title, message, promoCode, dealUrl) {
      if (!this.preferences.promoOffers) return;
      const fullTitle = `🔥 ${title || 'Zozo Nepal Special Deal!'}`;
      const fullBody = `${message}${promoCode ? ' Use code: ' + promoCode : ''}`;
      const url = dealUrl || '/index.html';

      this.sendSystemNotification(fullTitle, fullBody, { url: url, type: 'promo', promoCode: promoCode });
    },

    // Inject Bell Button in Header and Banner if needed
    injectNotificationUI: function () {
      // Find nav action rights or header right container
      const navRightElements = document.querySelectorAll('.nav-actions-right');
      navRightElements.forEach((container) => {
        if (container.querySelector('#pushNotificationBellBtn')) return;

        const bellBtn = document.createElement('button');
        bellBtn.id = 'pushNotificationBellBtn';
        bellBtn.className = 'push-bell-nav-btn';
        bellBtn.title = 'Push Notifications Center';
        bellBtn.setAttribute('aria-label', 'Push Notifications Center');
        bellBtn.onclick = () => this.openNotificationCenterModal();

        bellBtn.innerHTML = `
          <div style="position:relative; display:inline-flex; align-items:center; justify-content:center;">
            <svg style="width:20px; height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span id="pushBellStatusDot" class="push-status-dot"></span>
          </div>
        `;

        container.insertBefore(bellBtn, container.firstChild);
      });

      // Inject styling for bell and modal if not added
      if (!document.getElementById('zozoPushStyles')) {
        const style = document.createElement('style');
        style.id = 'zozoPushStyles';
        style.textContent = `
          .push-bell-nav-btn {
            background: var(--bg-card, #ffffff);
            border: 1px solid var(--border-color, #e2e8f0);
            min-height: 40px;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            color: var(--text-main, #0f172a);
            flex-shrink: 0;
            padding: 0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          }
          .push-bell-nav-btn:hover {
            background: var(--promo-gradient-start, #faf5ff);
            border-color: var(--nepal-blue, #9333ea);
            color: var(--nepal-blue, #9333ea);
          }
          .push-status-dot {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #94a3b8;
            border: 2px solid #ffffff;
          }
          .push-status-dot.active { background: #22c55e; }
          .push-status-dot.prompt { background: #f59e0b; }
          .push-status-dot.blocked { background: #ef4444; }

          /* Push Modal overlay */
          .zozo-push-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10005;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-sizing: border-box;
          }
          .zozo-push-modal-card {
            background: var(--bg-card, #ffffff);
            border-radius: 16px;
            max-width: 460px;
            width: 100%;
            border: 1px solid var(--border-color, #e2e8f0);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            padding: 24px;
            box-sizing: border-box;
            color: var(--text-main, #0f172a);
            position: relative;
            animation: zozoPushModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes zozoPushModalPop {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .zozo-push-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
            flex-shrink: 0;
          }
          .zozo-push-switch input { opacity: 0; width: 0; height: 0; }
          .zozo-push-slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #cbd5e1; transition: .25s; border-radius: 24px;
          }
          .zozo-push-slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
            background-color: white; transition: .25s; border-radius: 50%;
          }
          input:checked + .zozo-push-slider { background-color: var(--nepal-blue, #9333ea); }
          input:checked + .zozo-push-slider:before { transform: translateX(20px); }
        `;
        document.head.appendChild(style);
      }
    },

    injectNotificationModal: function () {
      if (document.getElementById('zozoPushNotificationModal')) return;

      const modal = document.createElement('div');
      modal.id = 'zozoPushNotificationModal';
      modal.className = 'zozo-push-modal-overlay';
      modal.onclick = (e) => {
        if (e.target === modal) this.closeNotificationCenterModal();
      };

      modal.innerHTML = `
        <div class="zozo-push-modal-card">
          <button style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--text-muted);" onclick="ZozoPushManager.closeNotificationCenterModal()">&times;</button>
          
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <div style="width:44px; height:44px; border-radius:12px; background:var(--promo-gradient-start, #faf5ff); border:1px solid var(--nepal-blue, #9333ea); display:flex; align-items:center; justify-content:center; color:var(--nepal-blue, #9333ea);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div>
              <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text-main);">Push Notifications Hub</h3>
              <p style="margin:2px 0 0 0; font-size:0.8rem; color:var(--text-muted);">Real-time delivery updates & exclusive promo alerts</p>
            </div>
          </div>

          <!-- Permission Status Banner -->
          <div id="zozoPushPermissionBanner" style="padding:12px 16px; border-radius:10px; margin-bottom:16px; font-size:0.85rem; font-weight:600; display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <span id="zozoPushPermissionText">Checking permission...</span>
            <button id="zozoPushEnableBtn" onclick="ZozoPushManager.requestPermission()" style="padding:6px 14px; font-size:0.8rem; font-weight:700; border-radius:8px; border:none; background:var(--nepal-blue, #9333ea); color:#ffffff; cursor:pointer;">Enable Alerts</button>
          </div>

          <!-- Notification Topics & Preferences -->
          <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px; text-align:left;">
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-main, #f8fafc); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color, #e2e8f0);">
              <div>
                <strong style="display:block; font-size:0.88rem; color:var(--text-main);">📦 Order Status & Shipment Updates</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">Receive instant notifications when order status changes to Shipped or Out for Delivery</span>
              </div>
              <label class="zozo-push-switch">
                <input type="checkbox" id="prefOrderUpdates" onchange="ZozoPushManager.togglePreference('orderUpdates', this.checked)">
                <span class="zozo-push-slider"></span>
              </label>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-main, #f8fafc); padding:12px 14px; border-radius:10px; border:1px solid var(--border-color, #e2e8f0);">
              <div>
                <strong style="display:block; font-size:0.88rem; color:var(--text-main);">🔥 Flash Sales & Promotional Offers</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">Get notified about limited-time discount voucher codes and deals</span>
              </div>
              <label class="zozo-push-switch">
                <input type="checkbox" id="prefPromoOffers" onchange="ZozoPushManager.togglePreference('promoOffers', this.checked)">
                <span class="zozo-push-slider"></span>
              </label>
            </div>
          </div>

          <!-- Instant Interactive Test Section -->
          <div style="border-top:1px solid var(--border-color, #e2e8f0); padding-top:16px;">
            <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); display:block; margin-bottom:10px; text-align:left;">Test Live Push Notifications:</span>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <button onclick="ZozoPushManager.triggerTestOrderPush()" style="padding:10px 12px; font-size:0.8rem; font-weight:700; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); cursor:pointer; text-align:center;">
                📦 Test Order Update
              </button>
              <button onclick="ZozoPushManager.triggerTestPromoPush()" style="padding:10px 12px; font-size:0.8rem; font-weight:700; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-card); color:var(--text-main); cursor:pointer; text-align:center;">
                🔥 Test Promo Deal
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    },

    updateHeaderBellState: function () {
      const statusDot = document.getElementById('pushBellStatusDot');
      const permBanner = document.getElementById('zozoPushPermissionBanner');
      const permText = document.getElementById('zozoPushPermissionText');
      const enableBtn = document.getElementById('zozoPushEnableBtn');

      const prefOrderCheck = document.getElementById('prefOrderUpdates');
      const prefPromoCheck = document.getElementById('prefPromoOffers');

      if (prefOrderCheck) prefOrderCheck.checked = this.preferences.orderUpdates;
      if (prefPromoCheck) prefPromoCheck.checked = this.preferences.promoOffers;

      this.checkPermissionStatus();

      if (this.permissionStatus === 'granted') {
        if (statusDot) {
          statusDot.className = 'push-status-dot active';
          statusDot.title = 'Push Notifications Active';
        }
        if (permBanner) {
          permBanner.style.background = '#f0fdf4';
          permBanner.style.border = '1px solid #bbf7d0';
          permBanner.style.color = '#15803d';
        }
        if (permText) permText.innerHTML = '✅ Push Notifications are Active';
        if (enableBtn) enableBtn.style.display = 'none';
      } else if (this.permissionStatus === 'denied') {
        if (statusDot) {
          statusDot.className = 'push-status-dot blocked';
          statusDot.title = 'Push Notifications Blocked';
        }
        if (permBanner) {
          permBanner.style.background = '#fef2f2';
          permBanner.style.border = '1px solid #fecaca';
          permBanner.style.color = '#b91c1c';
        }
        if (permText) permText.innerHTML = '🚫 Alerts Blocked in Browser';
        if (enableBtn) {
          enableBtn.style.display = 'inline-block';
          enableBtn.innerText = 'Unblock in Settings';
          enableBtn.onclick = () => alert('Notifications are blocked by your browser settings. Please click the lock/settings icon next to the address bar to allow notifications.');
        }
      } else {
        if (statusDot) {
          statusDot.className = 'push-status-dot prompt';
          statusDot.title = 'Click to Enable Push Notifications';
        }
        if (permBanner) {
          permBanner.style.background = '#fefce8';
          permBanner.style.border = '1px solid #fef08a';
          permBanner.style.color = '#a16207';
        }
        if (permText) permText.innerHTML = '🔔 Enable Push Notifications';
        if (enableBtn) {
          enableBtn.style.display = 'inline-block';
          enableBtn.innerText = 'Enable Alerts';
          enableBtn.onclick = () => ZozoPushManager.requestPermission();
        }
      }
    },

    togglePreference: function (key, value) {
      this.preferences[key] = value;
      this.savePreferences();
      this.showToast(`Updated Push Settings: ${key} = ${value ? 'ON' : 'OFF'}`);
    },

    openNotificationCenterModal: function () {
      this.updateHeaderBellState();
      const modal = document.getElementById('zozoPushNotificationModal');
      if (modal) modal.style.display = 'flex';
    },

    closeNotificationCenterModal: function () {
      const modal = document.getElementById('zozoPushNotificationModal');
      if (modal) modal.style.display = 'none';
    },

    triggerTestOrderPush: function () {
      const testOrderId = 'ZNP-' + Math.floor(100000 + Math.random() * 900000);
      this.sendOrderUpdateNotification(
        testOrderId,
        'Out for Delivery 🚚',
        'Your shipment is on its way with the courier and will arrive today!',
        `/product.html?orderTrack=${testOrderId}`
      );
      this.showToast('🚀 Test Order Update Notification Dispatched!');
    },

    triggerTestPromoPush: function () {
      this.sendPromoOfferNotification(
        'Flash Sale 25% OFF! ⚡',
        'Grab the finest accessories at extra discounts today.',
        'ZOZO25',
        '/index.html'
      );
      this.showToast('🔥 Test Promo Notification Dispatched!');
    },

    showToast: function (msg) {
      if (window.showToastNotification) {
        window.showToastNotification(msg);
      } else {
        console.log('[Zozo Push Toast]', msg);
      }
    }
  };

  window.ZozoPushManager = ZozoPushManager;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ZozoPushManager.init());
  } else {
    ZozoPushManager.init();
  }
})();
