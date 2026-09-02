// ==============================================================================
// Zozo Nepal - System Push & Native Device Notification Manager (Mobile & Laptop)
// Provides native OS notifications outside of the website in mobile & laptop notification trays.
// ==============================================================================

(function(window) {
  'use strict';

  const STORAGE_KEY_NOTIFS = 'zozo_order_notifications_log_v2';
  const STORAGE_KEY_SOUND = 'zozo_notif_sound_enabled';

  class ZozoPushNotificationEngine {
    constructor() {
      this.swRegistration = null;
      this.audioCtx = null;
      this.broadcastChannel = null;
      this.isInitialized = false;

      // Broadcast channel for multi-tab synchronization
      if ('BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('zozo_orders_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'NEW_CUSTOMER_ORDER_BROADCAST') {
              this.handleIncomingOrderBroadcast(event.data.order, false);
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel init notice:', e);
        }
      }
    }

    // Initialize Service Worker and Notification listener
    async init() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          this.swRegistration = reg;
          console.log('✅ Zozo Nepal Service Worker registered for device push:', reg.scope);

          // Listen for messages from Service Worker (e.g. notification click)
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'ZOZO_NOTIFICATION_OPEN_ORDER') {
              const orderId = event.data.orderId;
              if (orderId && typeof window.highlightAndFocusOrder === 'function') {
                window.highlightAndFocusOrder(orderId);
              }
            }
          });
        } catch (err) {
          console.warn('Service Worker registration warning:', err);
        }
      }

      // Check URL parameters for direct notification clicks (e.g. ?orderId=xyz)
      const urlParams = new URLSearchParams(window.location.search);
      const targetOrderId = urlParams.get('orderId') || urlParams.get('orderTrack');
      if (targetOrderId) {
        setTimeout(() => {
          if (typeof window.highlightAndFocusOrder === 'function') {
            window.highlightAndFocusOrder(targetOrderId);
          }
        }, 600);
      }

      this.updateUIElements();
    }

    // Check device permission state
    getPermissionStatus() {
      if (!('Notification' in window)) return 'unsupported';
      return Notification.permission; // 'granted', 'denied', or 'default'
    }

    isGranted() {
      return this.getPermissionStatus() === 'granted';
    }

    isSoundEnabled() {
      const val = localStorage.getItem(STORAGE_KEY_SOUND);
      return val !== 'false'; // default true
    }

    setSoundEnabled(enabled) {
      localStorage.setItem(STORAGE_KEY_SOUND, enabled ? 'true' : 'false');
    }

    // Request native device notification permission
    async requestPermission() {
      if (!('Notification' in window)) {
        alert('⚠️ Web Notifications are not supported in this browser. Please use Chrome, Edge, Samsung Internet, or Safari.');
        return 'unsupported';
      }

      try {
        const permission = await Notification.requestPermission();
        this.updateUIElements();

        if (permission === 'granted') {
          this.playAlertSound();
          // Dispatch a test/welcome notification to the native notification section
          await this.showDeviceNotification('🔔 Order Alerts Activated!', {
            body: 'You will now receive instant customer order alerts in your device notification tray (mobile & laptop) even when outside this tab.',
            icon: '/zozonepal.png',
            badge: '/zozonepal.png',
            tag: 'zozo-welcome-notif',
            renotify: true,
            vibrate: [200, 100, 200]
          });

          if (window.showToastNotification) {
            window.showToastNotification('✅ Outside-website order alerts are now ACTIVE on this device!');
          }
        } else if (permission === 'denied') {
          if (window.showToastNotification) {
            window.showToastNotification('⚠️ Notification permission was blocked. Please click the site icon in your address bar to allow alerts.');
          }
        }

        return permission;
      } catch (err) {
        console.error('Permission request error:', err);
        return Notification.permission;
      }
    }

    // Play high-attention retail order alert chime via Web Audio API
    playAlertSound() {
      if (!this.isSoundEnabled()) return;

      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return;

        if (!this.audioCtx || this.audioCtx.state === 'suspended') {
          this.audioCtx = new AudioCtxClass();
        }

        const now = this.audioCtx.currentTime;

        // Three-tone melodic order alert chime: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz)
        const notes = [
          { freq: 659.25, time: now, dur: 0.12 },
          { freq: 830.61, time: now + 0.14, dur: 0.12 },
          { freq: 987.77, time: now + 0.28, dur: 0.28 }
        ];

        notes.forEach(note => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, note.time);

          gain.gain.setValueAtTime(0.001, note.time);
          gain.gain.exponentialRampToValueAtTime(0.35, note.time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, note.time + note.dur);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(note.time);
          osc.stop(note.time + note.dur);
        });
      } catch (e) {
        console.warn('Audio chime fallback:', e);
      }
    }

    // Core low-level method to display notification in native OS tray (Mobile notification drawer & Laptop action center)
    async showDeviceNotification(title, options = {}) {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.warn('Cannot display native notification: permission not granted.');
        return false;
      }

      const defaultOptions = {
        icon: '/zozonepal.png',
        badge: '/zozonepal.png',
        vibrate: [300, 100, 300, 100, 300],
        renotify: true,
        requireInteraction: true, // Keeps notification persistent on Windows/Mac laptops until user clicks or dismisses
        silent: false,
        data: {
          url: '/admin.html',
          timestamp: Date.now()
        },
        actions: [
          { action: 'view', title: '👁️ View Order' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      };

      const finalOptions = Object.assign({}, defaultOptions, options);

      // Attempt 1: Service Worker Registration (Required for Android Mobile and background laptop notifications)
      if ('serviceWorker' in navigator) {
        try {
          let reg = this.swRegistration;
          if (!reg) {
            reg = await navigator.serviceWorker.ready || await navigator.serviceWorker.getRegistration();
          }
          if (reg && typeof reg.showNotification === 'function') {
            await reg.showNotification(title, finalOptions);
            return true;
          }
        } catch (swErr) {
          console.warn('SW showNotification caught error, trying fallback:', swErr);
        }
      }

      // Attempt 2: Standard Window Notification (Laptop fallback)
      try {
        const notif = new Notification(title, finalOptions);
        notif.onclick = function(event) {
          event.preventDefault();
          window.focus();
          const targetUrl = (finalOptions.data && finalOptions.data.url) || '/admin.html';
          if (targetUrl && !window.location.href.includes(targetUrl.split('?')[0])) {
            window.location.href = targetUrl;
          }
          notif.close();
        };
        return true;
      } catch (winErr) {
        console.warn('Window Notification fallback caught error:', winErr);
      }

      return false;
    }

    // PRIMARY METHOD: Triggered when a new customer order arrives
    async sendNewCustomerOrderNotification(order) {
      if (!order) return;

      // Play alert chime
      this.playAlertSound();

      // Mobile vibration
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([300, 150, 300, 150, 300]);
        } catch(e) {}
      }

      const amountFormatted = order.amountPaid ? Number(order.amountPaid).toLocaleString() : '0';
      const custName = (order.customerName || 'Customer').trim();
      const phone = order.customerPhone || 'No Phone';
      const loc = order.deliveryLocation || 'Nepal';
      const items = order.productName || 'Ordered Products';

      const title = `🚨 NEW CUSTOMER ORDER: Rs. ${amountFormatted} NPR`;
      const body = `👤 ${custName} (${phone})\n📍 ${loc}\n🛍️ ${items}`;
      const targetUrl = `/admin.html?orderId=${encodeURIComponent(order.id || '')}`;

      const options = {
        body: body,
        icon: '/zozonepal.png',
        badge: '/zozonepal.png',
        tag: `zozo-order-${order.id || Date.now()}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 150, 300, 150, 300],
        data: {
          url: targetUrl,
          orderId: order.id,
          timestamp: Date.now()
        },
        actions: [
          { action: 'view', title: '📦 Open in Admin' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      };

      // Show native OS notification (outside website)
      await this.showDeviceNotification(title, options);

      // Log notification locally
      this.logNotification({
        id: order.id || 'ord-' + Date.now(),
        type: 'new_order',
        title: title,
        body: `${custName} • Rs. ${amountFormatted} • ${loc}`,
        time: new Date().toISOString(),
        url: targetUrl
      });

      // Broadcast to other tabs if available
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            type: 'NEW_CUSTOMER_ORDER_BROADCAST',
            order: order
          });
        } catch (e) {}
      }

      // Dispatch custom in-page event
      window.dispatchEvent(new CustomEvent('zozo:order-notification', { detail: order }));
    }

    handleIncomingOrderBroadcast(order, shouldDisplaySystem = true) {
      if (!order) return;
      if (shouldDisplaySystem) {
        this.sendNewCustomerOrderNotification(order);
      }
    }

    // Method for Customer confirmation or Status updates
    async sendOrderUpdateNotification(orderId, status, customMessage, targetUrl = '/index.html') {
      this.playAlertSound();

      const title = `📦 Order Update: ${status} (#${String(orderId).slice(-6)})`;
      const body = customMessage || `Your order shipment status has been updated to "${status}".`;

      const options = {
        body: body,
        icon: '/zozonepal.png',
        badge: '/zozonepal.png',
        tag: `zozo-status-${orderId}-${Date.now()}`,
        renotify: true,
        data: {
          url: targetUrl || `/product.html?orderTrack=${orderId}`,
          orderId: orderId
        }
      };

      await this.showDeviceNotification(title, options);

      this.logNotification({
        id: orderId,
        type: 'status_update',
        title: title,
        body: body,
        time: new Date().toISOString(),
        url: targetUrl
      });
    }

    // Method for Admin Promo broadcast
    async sendPromoOfferNotification(title, body, promoCode, targetUrl = '/index.html') {
      this.playAlertSound();

      const fullTitle = title || '🔥 Flash Deal from Zozo Nepal!';
      const fullBody = `${body}${promoCode ? ` Use coupon code: ${promoCode}` : ''}`;

      const options = {
        body: fullBody,
        icon: '/zozonepal.png',
        badge: '/zozonepal.png',
        tag: `zozo-promo-${Date.now()}`,
        renotify: true,
        data: {
          url: targetUrl,
          promoCode: promoCode
        }
      };

      await this.showDeviceNotification(fullTitle, options);

      this.logNotification({
        id: 'promo-' + Date.now(),
        type: 'promo',
        title: fullTitle,
        body: fullBody,
        time: new Date().toISOString(),
        url: targetUrl
      });
    }

    // Instant test function for user/admin to verify outside-website alerts on their phone or laptop
    async testDeviceNotification() {
      const perm = this.getPermissionStatus();
      if (perm !== 'granted') {
        const result = await this.requestPermission();
        if (result !== 'granted') {
          alert('⚠️ Please grant notification permission so alerts can appear in your mobile notification bar or laptop action center.');
          return;
        }
      }

      const sampleOrder = {
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        customerName: 'Aarav Sharma (Test Customer)',
        customerPhone: '9841234567',
        amountPaid: 3250,
        deliveryLocation: 'Thamel / New Baneshwor, Kathmandu',
        productName: 'Zozo Signature Winter Hoodie (Navy Blue, L) x 1'
      };

      await this.sendNewCustomerOrderNotification(sampleOrder);

      if (window.showToastNotification) {
        window.showToastNotification('🔔 Test notification sent! Check your phone notification bar or laptop notification tray.');
      } else {
        alert('🔔 Test notification sent! Look outside the website: in your mobile phone top notification bar or laptop notification center.');
      }
    }

    // Log notification in localStorage
    logNotification(item) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(item);
        if (list.length > 30) list.length = 30; // keep last 30
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(list));
      } catch (e) {
        console.warn('Notification log write warning:', e);
      }
    }

    getRecentNotifications() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    clearNotificationHistory() {
      localStorage.removeItem(STORAGE_KEY_NOTIFS);
      const container = document.getElementById('zozoModalNotifHistoryList');
      if (container) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px; font-size:0.85rem;">No notification alerts logged yet.</p>';
      }
    }

    // Synchronize UI badges and indicators
    updateUIElements() {
      const status = this.getPermissionStatus();
      const isGranted = status === 'granted';

      // Update drawer badge in index.html and product.html
      const pushDots = document.querySelectorAll('#pushBellStatusDot, .push-bell-status-dot');
      pushDots.forEach(dot => {
        if (isGranted) {
          dot.innerText = 'Active 🟢';
          dot.style.background = '#dcfce7';
          dot.style.color = '#15803d';
          dot.style.borderColor = '#86efac';
        } else if (status === 'denied') {
          dot.innerText = 'Blocked 🚫';
          dot.style.background = '#fee2e2';
          dot.style.color = '#b91c1c';
          dot.style.borderColor = '#fca5a5';
        } else {
          dot.innerText = 'Enable 🔔';
          dot.style.background = '#faf5ff';
          dot.style.color = '#9333ea';
          dot.style.borderColor = '#d8b4fe';
        }
      });

      // Update admin header notification pill if present
      const adminPill = document.getElementById('adminDeviceNotifStatusPill');
      if (adminPill) {
        if (isGranted) {
          adminPill.innerHTML = '🟢 <span>Alerts Active</span>';
          adminPill.style.background = '#ecfdf5';
          adminPill.style.color = '#065f46';
          adminPill.style.borderColor = '#a7f3d0';
        } else {
          adminPill.innerHTML = '🔔 <span>Enable Device Alerts</span>';
          adminPill.style.background = '#faf5ff';
          adminPill.style.color = '#7e22ce';
          adminPill.style.borderColor = '#c084fc';
        }
      }
    }

    // Modal UI for Managing Device Push Notifications
    openNotificationCenterModal() {
      let modal = document.getElementById('zozoNotificationCenterModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'zozoNotificationCenterModal';
        modal.className = 'zozo-notif-modal-backdrop';
        modal.innerHTML = `
          <div class="zozo-notif-modal-content">
            <div class="zozo-notif-modal-header">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.5rem;">🔔</span>
                <div>
                  <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#0f172a;">Device Order Notifications</h3>
                  <p style="margin:2px 0 0; font-size:0.8rem; color:#64748b;">Receive instant alerts outside the browser on Mobile & Laptop</p>
                </div>
              </div>
              <button type="button" class="zozo-notif-modal-close" onclick="window.ZozoPushManager.closeNotificationCenterModal()">&times;</button>
            </div>

            <div class="zozo-notif-modal-body">
              <!-- Current Permission Status Card -->
              <div id="zozoModalStatusCard" style="padding:14px; border-radius:10px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <!-- Filled dynamically -->
              </div>

              <!-- Device Feature Explanations -->
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:18px;">
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
                  <div style="font-weight:700; font-size:0.85rem; color:#1e293b; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span>💻</span> Laptop & PC Alerts
                  </div>
                  <p style="margin:0; font-size:0.78rem; color:#64748b; line-height:1.4;">
                    Pops up in <strong>Windows Action Center</strong> or <strong>macOS Notification Center</strong> with sound and order details even when browser is minimized.
                  </p>
                </div>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
                  <div style="font-weight:700; font-size:0.85rem; color:#1e293b; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                    <span>📱</span> Mobile Phone Alerts
                  </div>
                  <p style="margin:0; font-size:0.78rem; color:#64748b; line-height:1.4;">
                    Appears in your phone's <strong>top notification bar & lock screen</strong> with vibration and alert sound when customer orders arrive.
                  </p>
                </div>
              </div>

              <!-- Controls & Preferences -->
              <div style="background:#f1f5f9; border-radius:10px; padding:14px; margin-bottom:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <div>
                    <strong style="font-size:0.88rem; color:#0f172a; display:block;">Audible Retail Alert Chime</strong>
                    <span style="font-size:0.78rem; color:#64748b;">Play chime sound when a new customer order is placed</span>
                  </div>
                  <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
                    <input type="checkbox" id="zozoSoundPrefToggle" style="opacity:0; width:0; height:0;" onchange="window.ZozoPushManager.setSoundEnabled(this.checked); if(this.checked) window.ZozoPushManager.playAlertSound();">
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#cbd5e1; transition:.3s; border-radius:24px;" class="zozo-slider"></span>
                  </label>
                </div>

                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="action-btn" style="background:#9333ea; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;" onclick="window.ZozoPushManager.testDeviceNotification()">
                    ⚡ Send Test Notification to this Device
                  </button>
                  <button type="button" class="action-btn" style="background:#ffffff; color:#475569; border:1px solid #cbd5e1; padding:8px 14px; border-radius:8px; font-weight:600; font-size:0.82rem; cursor:pointer;" onclick="window.ZozoPushManager.playAlertSound()">
                    🔊 Test Sound Chime
                  </button>
                </div>
              </div>

              <!-- Notification Log History -->
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <h4 style="margin:0; font-size:0.88rem; font-weight:700; color:#334155;">Recent Order Alerts on this Device</h4>
                  <button type="button" onclick="window.ZozoPushManager.clearNotificationHistory()" style="background:none; border:none; color:#ef4444; font-size:0.75rem; font-weight:700; cursor:pointer;">Clear Log</button>
                </div>
                <div id="zozoModalNotifHistoryList" style="max-height:180px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; background:#ffffff;">
                  <!-- Filled dynamically -->
                </div>
              </div>
            </div>

            <div class="zozo-notif-modal-footer">
              <button type="button" class="action-btn" style="background:#e2e8f0; color:#334155; border:none; padding:8px 18px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;" onclick="window.ZozoPushManager.closeNotificationCenterModal()">
                Close
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // Inject modal CSS styles
        const style = document.createElement('style');
        style.textContent = `
          .zozo-notif-modal-backdrop {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            animation: zozoFadeIn .2s ease-out;
          }
          @keyframes zozoFadeIn { from { opacity: 0; } to { opacity: 1; } }
          .zozo-notif-modal-content {
            background: #ffffff;
            border-radius: 14px;
            max-width: 540px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: zozoScaleUp .25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes zozoScaleUp { from { transform: scale(0.94); } to { transform: scale(1); } }
          .zozo-notif-modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
          }
          .zozo-notif-modal-close {
            background: none; border: none; font-size: 1.6rem; color: #94a3b8; cursor: pointer; line-height: 1;
          }
          .zozo-notif-modal-close:hover { color: #0f172a; }
          .zozo-notif-modal-body {
            padding: 20px;
            overflow-y: auto;
            max-height: 75vh;
          }
          .zozo-notif-modal-footer {
            padding: 12px 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            background: #f8fafc;
          }
          .zozo-slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%;
          }
          input:checked + .zozo-slider { background-color: #9333ea; }
          input:checked + .zozo-slider:before { transform: translateX(20px); }
        `;
        document.head.appendChild(style);
      }

      // Populate content
      const status = this.getPermissionStatus();
      const statusCard = document.getElementById('zozoModalStatusCard');
      if (statusCard) {
        if (status === 'granted') {
          statusCard.style.background = '#ecfdf5';
          statusCard.style.border = '1px solid #a7f3d0';
          statusCard.innerHTML = `
            <div>
              <div style="font-weight:800; color:#065f46; font-size:0.95rem; display:flex; align-items:center; gap:6px;">
                <span>🟢</span> Device Alerts are Active
              </div>
              <p style="margin:2px 0 0; font-size:0.8rem; color:#047857;">Incoming orders will alert you in your device's notification bar.</p>
            </div>
            <button type="button" class="action-btn" style="background:#059669; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-weight:700; font-size:0.8rem; cursor:pointer;" onclick="window.ZozoPushManager.testDeviceNotification()">
              Test Alert ⚡
            </button>
          `;
        } else if (status === 'denied') {
          statusCard.style.background = '#fef2f2';
          statusCard.style.border = '1px solid #fecaca';
          statusCard.innerHTML = `
            <div>
              <div style="font-weight:800; color:#991b1b; font-size:0.95rem; display:flex; align-items:center; gap:6px;">
                <span>🚫</span> Notifications Blocked in Browser
              </div>
              <p style="margin:2px 0 0; font-size:0.8rem; color:#b91c1c;">Click the padlock/settings icon beside the URL in your browser address bar to allow notifications.</p>
            </div>
          `;
        } else {
          statusCard.style.background = '#faf5ff';
          statusCard.style.border = '1px solid #e9d5ff';
          statusCard.innerHTML = `
            <div>
              <div style="font-weight:800; color:#6b21a8; font-size:0.95rem; display:flex; align-items:center; gap:6px;">
                <span>🔔</span> Enable Outside-Website Alerts
              </div>
              <p style="margin:2px 0 0; font-size:0.8rem; color:#7e22ce;">Allow this device to receive orders in notification drawer.</p>
            </div>
            <button type="button" class="action-btn" style="background:#9333ea; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;" onclick="window.ZozoPushManager.requestPermission().then(() => window.ZozoPushManager.openNotificationCenterModal())">
              Enable Now 🔔
            </button>
          `;
        }
      }

      // Sound toggle state
      const soundToggle = document.getElementById('zozoSoundPrefToggle');
      if (soundToggle) {
        soundToggle.checked = this.isSoundEnabled();
      }

      // Render recent notifications
      const historyList = document.getElementById('zozoModalNotifHistoryList');
      if (historyList) {
        const notifs = this.getRecentNotifications();
        if (notifs.length === 0) {
          historyList.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px; font-size:0.82rem;">No order alerts logged yet. When a customer orders, alerts will show here and in your OS notification bar.</p>';
        } else {
          historyList.innerHTML = notifs.map(n => `
            <div style="padding:10px 14px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; gap:10px;">
              <div style="overflow:hidden;">
                <div style="font-weight:700; font-size:0.82rem; color:#1e293b; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${n.title}</div>
                <div style="font-size:0.75rem; color:#64748b; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${n.body}</div>
              </div>
              <span style="font-size:0.7rem; color:#94a3b8; white-space:nowrap;">${new Date(n.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
            </div>
          `).join('');
        }
      }

      modal.style.display = 'flex';
    }

    closeNotificationCenterModal() {
      const modal = document.getElementById('zozoNotificationCenterModal');
      if (modal) modal.style.display = 'none';
    }
  }

  // Create singleton instance
  window.ZozoPushManager = new ZozoPushNotificationEngine();

  // Backward compatibility wrapper
  window.initZozoPushNotifications = function() {
    return window.ZozoPushManager.init();
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ZozoPushManager.init());
  } else {
    window.ZozoPushManager.init();
  }

})(window);
