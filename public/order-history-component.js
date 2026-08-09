/**
 * Zozo Nepal - Account Order History & Purchase Tracking Component
 */
(function () {
  'use strict';

  const OrderHistoryComponent = {
    cachedOrders: [],
    activeFilter: 'all',
    searchQuery: '',

    init: function () {
      this.injectStyles();
      this.injectModalMarkup();
    },

    injectStyles: function () {
      if (document.getElementById('zozoOrderHistoryStyles')) return;
      const style = document.createElement('style');
      style.id = 'zozoOrderHistoryStyles';
      style.textContent = `
        /* Order History Modal Overlay */
        .oh-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px);
          z-index: 10010;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }

        .oh-modal-card {
          background: var(--bg-card, #ffffff);
          border-radius: 20px;
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-color, #e2e8f0);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          color: var(--text-main, #0f172a);
          overflow: hidden;
          position: relative;
          animation: ohModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes ohModalPop {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .oh-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-main, #f8fafc);
        }

        .oh-user-profile-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .oh-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--nepal-blue, #9333ea);
          box-shadow: 0 4px 10px rgba(147, 51, 234, 0.15);
        }

        .oh-user-info-meta h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
        }

        .oh-user-info-meta p {
          margin: 2px 0 0 0;
          font-size: 0.8rem;
          color: var(--text-muted, #64748b);
        }

        .oh-modal-close-btn {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-muted, #64748b);
          transition: all 0.2s ease;
        }
        .oh-modal-close-btn:hover {
          color: var(--nepal-red, #dc2626);
          border-color: var(--nepal-red, #dc2626);
          transform: rotate(90deg);
        }

        /* Order Stats Strip */
        .oh-stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 14px 24px;
          background: var(--bg-card, #ffffff);
          border-bottom: 1px solid var(--border-color, #e2e8f0);
        }

        .oh-stat-pill {
          background: var(--bg-main, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          padding: 10px 14px;
          text-align: center;
        }

        .oh-stat-num {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--nepal-blue, #9333ea);
          display: block;
        }

        .oh-stat-lbl {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted, #64748b);
        }

        /* Filter Controls */
        .oh-filter-bar {
          padding: 12px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card, #ffffff);
        }

        .oh-filter-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .oh-filter-pills::-webkit-scrollbar { display: none; }

        .oh-pill-btn {
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-main, #f8fafc);
          color: var(--text-muted, #64748b);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .oh-pill-btn.active {
          background: var(--nepal-blue, #9333ea);
          color: #ffffff;
          border-color: var(--nepal-blue, #9333ea);
          box-shadow: 0 3px 8px rgba(147, 51, 234, 0.25);
        }

        .oh-search-input {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 20px;
          font-size: 0.8rem;
          outline: none;
          background: var(--bg-main, #f8fafc);
          color: var(--text-main, #0f172a);
          width: 160px;
        }
        .oh-search-input:focus {
          border-color: var(--nepal-blue, #9333ea);
          background: var(--bg-card, #ffffff);
        }

        /* Order List Scroll Container */
        .oh-orders-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--bg-main, #f8fafc);
        }

        /* Order Item Card */
        .oh-order-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
          position: relative;
        }

        .oh-order-card:hover {
          border-color: var(--nepal-blue, #9333ea);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.08);
        }

        .oh-card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-color, #f1f5f9);
        }

        .oh-order-id-meta {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-main, #0f172a);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .oh-order-date {
          font-size: 0.75rem;
          color: var(--text-muted, #64748b);
          font-weight: 500;
        }

        /* Status Pills */
        .oh-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .oh-status-pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .oh-status-processing { background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; }
        .oh-status-shipped { background: #f3e8ff; color: #9333ea; border: 1px solid #e9d5ff; }
        .oh-status-delivered { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
        .oh-status-cancelled { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

        .oh-items-summary {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main, #0f172a);
          line-height: 1.4;
          margin-bottom: 10px;
        }

        .oh-order-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px 16px;
          font-size: 0.8rem;
          color: var(--text-muted, #64748b);
          margin-bottom: 14px;
          background: var(--bg-main, #f8fafc);
          padding: 10px 14px;
          border-radius: 10px;
        }

        .oh-detail-item strong {
          color: var(--text-main, #0f172a);
        }

        .oh-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          padding-top: 10px;
          border-top: 1px solid var(--border-color, #f1f5f9);
        }

        .oh-action-btn {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-card, #ffffff);
          color: var(--text-main, #0f172a);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .oh-action-btn:hover {
          border-color: var(--nepal-blue, #9333ea);
          color: var(--nepal-blue, #9333ea);
          background: var(--promo-gradient-start, #faf5ff);
        }

        .oh-action-btn.primary {
          background: var(--nepal-blue, #9333ea);
          color: #ffffff;
          border-color: var(--nepal-blue, #9333ea);
        }
        .oh-action-btn.primary:hover {
          opacity: 0.9;
        }

        /* Empty state */
        .oh-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted, #64748b);
        }
        .oh-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          display: block;
        }

        /* Invoice Modal Overlay */
        .oh-invoice-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 10020;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
        }

        .oh-invoice-card {
          background: #ffffff;
          color: #0f172a;
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          position: relative;
          box-sizing: border-box;
        }

        @media (max-width: 580px) {
          .oh-stats-strip { grid-template-columns: 1fr; }
          .oh-order-details-grid { grid-template-columns: 1fr; }
          .oh-card-actions { justify-content: stretch; }
          .oh-action-btn { flex: 1; justify-content: center; }
          .oh-search-input { width: 100%; margin-top: 6px; }
        }
      `;
      document.head.appendChild(style);
    },

    injectModalMarkup: function () {
      if (document.getElementById('zozoOrderHistoryModal')) return;

      const modal = document.createElement('div');
      modal.id = 'zozoOrderHistoryModal';
      modal.className = 'oh-modal-overlay';
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal();
      };

      modal.innerHTML = `
        <div class="oh-modal-card">
          <!-- Header -->
          <div class="oh-modal-header">
            <div class="oh-user-profile-header">
              <img id="ohUserAvatar" class="oh-user-avatar" src="zozonepal.png" alt="User Profile">
              <div class="oh-user-info-meta">
                <h3 id="ohUserName">Guest Shopper</h3>
                <p id="ohUserEmail">Sign in to sync your purchase history</p>
              </div>
            </div>
            <button class="oh-modal-close-btn" onclick="OrderHistoryComponent.closeModal()" title="Close">&times;</button>
          </div>

          <!-- Quick Stats Strip -->
          <div class="oh-stats-strip">
            <div class="oh-stat-pill">
              <span id="ohStatTotalOrders" class="oh-stat-num">0</span>
              <span class="oh-stat-lbl">Total Orders</span>
            </div>
            <div class="oh-stat-pill">
              <span id="ohStatTotalSpent" class="oh-stat-num">Rs. 0</span>
              <span class="oh-stat-lbl">Total Amount</span>
            </div>
            <div class="oh-stat-pill">
              <span id="ohStatActiveOrders" class="oh-stat-num">0</span>
              <span class="oh-stat-lbl">Active Deliveries</span>
            </div>
          </div>

          <!-- Filters Bar -->
          <div class="oh-filter-bar">
            <div class="oh-filter-pills">
              <button class="oh-pill-btn active" onclick="OrderHistoryComponent.setFilter('all', this)">All Orders</button>
              <button class="oh-pill-btn" onclick="OrderHistoryComponent.setFilter('Pending', this)">Pending ⏳</button>
              <button class="oh-pill-btn" onclick="OrderHistoryComponent.setFilter('Processing', this)">Processing ⚙️</button>
              <button class="oh-pill-btn" onclick="OrderHistoryComponent.setFilter('Shipped', this)">Shipped 🚚</button>
              <button class="oh-pill-btn" onclick="OrderHistoryComponent.setFilter('Delivered', this)">Delivered ✅</button>
            </div>
            <input type="text" class="oh-search-input" placeholder="🔍 Search orders..." oninput="OrderHistoryComponent.handleSearch(this.value)">
          </div>

          <!-- Orders Container -->
          <div id="ohOrdersContainer" class="oh-orders-list">
            <div class="oh-empty-state">
              <span class="oh-empty-icon">📦</span>
              <p>Loading purchase history...</p>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Inject Invoice Sub-Modal
      const invoiceModal = document.createElement('div');
      invoiceModal.id = 'zozoInvoiceModal';
      invoiceModal.className = 'oh-invoice-overlay';
      invoiceModal.onclick = (e) => {
        if (e.target === invoiceModal) invoiceModal.style.display = 'none';
      };
      invoiceModal.innerHTML = `
        <div class="oh-invoice-card" id="ohInvoiceCardPrintable">
          <button style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.4rem; cursor:pointer;" onclick="document.getElementById('zozoInvoiceModal').style.display='none'">&times;</button>
          
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px dashed #e2e8f0; padding-bottom:14px; margin-bottom:16px;">
            <div>
              <img src="zozonepal.png" alt="Zozo Nepal" style="height:36px; object-fit:contain; margin-bottom:4px;">
              <p style="margin:0; font-size:0.75rem; color:#64748b;">Official Purchase Receipt</p>
            </div>
            <div style="text-align:right;">
              <span id="invOrderId" style="font-size:0.85rem; font-weight:800; color:#9333ea; display:block;">#ORDER-ID</span>
              <span id="invDate" style="font-size:0.75rem; color:#64748b;">Date</span>
            </div>
          </div>

          <div style="font-size:0.85rem; margin-bottom:14px;">
            <p style="margin:0 0 4px 0;"><strong>Customer Name:</strong> <span id="invCustomerName">-</span></p>
            <p style="margin:0 0 4px 0;"><strong>Phone / Contact:</strong> <span id="invCustomerPhone">-</span></p>
            <p style="margin:0 0 4px 0;"><strong>Delivery Destination:</strong> <span id="invLocation">-</span></p>
            <p style="margin:0;"><strong>Payment Method:</strong> <span id="invPaymentMethod" style="color:#2563eb; font-weight:700;">-</span></p>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:16px;">
            <strong style="font-size:0.8rem; text-transform:uppercase; color:#64748b; display:block; margin-bottom:6px;">Items Purchased:</strong>
            <p id="invItemsList" style="margin:0; font-size:0.88rem; font-weight:700; color:#0f172a; line-height:1.5;"></p>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:12px; margin-bottom:16px;">
            <span style="font-size:0.9rem; font-weight:700; color:#64748b;">Total Paid:</span>
            <span id="invTotalAmount" style="font-size:1.3rem; font-weight:800; color:#9333ea;">Rs. 0</span>
          </div>

          <div style="display:flex; gap:10px;">
            <button onclick="window.print()" style="flex:1; padding:10px; font-weight:700; background:#9333ea; color:#ffffff; border:none; border-radius:8px; cursor:pointer;">🖨️ Print / Save Receipt</button>
            <button onclick="document.getElementById('zozoInvoiceModal').style.display='none'" style="padding:10px 16px; font-weight:700; background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer;">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(invoiceModal);
    },

    openModal: async function (filter = 'all') {
      this.activeFilter = filter;
      this.searchQuery = '';
      const modal = document.getElementById('zozoOrderHistoryModal');
      if (modal) modal.style.display = 'flex';

      await this.fetchAndRenderOrders();
    },

    closeModal: function () {
      const modal = document.getElementById('zozoOrderHistoryModal');
      if (modal) modal.style.display = 'none';
    },

    setFilter: function (filter, btn) {
      this.activeFilter = filter;
      const pills = document.querySelectorAll('.oh-pill-btn');
      pills.forEach(p => p.classList.remove('active'));
      if (btn) btn.classList.add('active');
      this.renderOrdersList();
    },

    handleSearch: function (val) {
      this.searchQuery = val.toLowerCase().trim();
      this.renderOrdersList();
    },

    fetchAndRenderOrders: async function () {
      const container = document.getElementById('ohOrdersContainer');
      const nameEl = document.getElementById('ohUserName');
      const emailEl = document.getElementById('ohUserEmail');
      const avatarEl = document.getElementById('ohUserAvatar');

      let currentUser = null;
      if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        currentUser = window.firebaseAuth.currentUser;
      }

      if (currentUser) {
        nameEl.innerText = currentUser.displayName || 'Zozo Customer';
        emailEl.innerText = currentUser.email || 'Authenticated User';
        if (currentUser.photoURL) avatarEl.src = currentUser.photoURL;
      } else {
        nameEl.innerText = 'Guest Shopper';
        emailEl.innerText = 'Sign in or enter phone to sync account purchases';
        avatarEl.src = 'zozonepal.png';
      }

      container.innerHTML = `
        <div class="oh-empty-state">
          <span class="oh-empty-icon">⏳</span>
          <p>Fetching purchase history securely...</p>
        </div>
      `;

      let fetchedOrders = [];

      // 1. Fetch from Firestore if DB available
      if (window.firebaseDb && window.firestoreQuery && window.firestoreCollection && window.firestoreWhere) {
        try {
          const db = window.firebaseDb;
          const userEmail = currentUser ? currentUser.email : null;

          if (userEmail) {
            const q = window.firestoreQuery(
              window.firestoreCollection(db, 'transactions'),
              window.firestoreWhere('userEmail', '==', userEmail)
            );
            const snapshot = await window.firestoreGetDocs(q);
            snapshot.forEach(doc => {
              fetchedOrders.push({ id: doc.id, ...doc.data() });
            });
          }
        } catch (err) {
          console.warn('Firestore user order query note:', err);
        }
      }

      // 2. Fetch locally stored orders (offline / fallback cache)
      try {
        const localSaved = localStorage.getItem('zozo_user_orders');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          parsed.forEach(locOrd => {
            if (!fetchedOrders.some(o => o.id === locOrd.id)) {
              fetchedOrders.push(locOrd);
            }
          });
        }
      } catch (e) {
        console.warn('Local orders cache read issue:', e);
      }

      // Sort by timestamp desc
      fetchedOrders.sort((a, b) => {
        const timeA = a.timestamp && a.timestamp.seconds ? a.timestamp.seconds : (new Date(a.date || 0).getTime());
        const timeB = b.timestamp && b.timestamp.seconds ? b.timestamp.seconds : (new Date(b.date || 0).getTime());
        return timeB - timeA;
      });

      this.cachedOrders = fetchedOrders;
      this.updateStats();
      this.renderOrdersList();
    },

    updateStats: function () {
      const orders = this.cachedOrders;
      const totalCount = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.amountPaid || 0), 0);
      const activeCount = orders.filter(o => (o.status || 'Pending').toLowerCase() !== 'delivered' && (o.status || 'Pending').toLowerCase() !== 'cancelled').length;

      document.getElementById('ohStatTotalOrders').innerText = totalCount;
      document.getElementById('ohStatTotalSpent').innerText = `Rs. ${totalSpent.toLocaleString()}`;
      document.getElementById('ohStatActiveOrders').innerText = activeCount;
    },

    renderOrdersList: function () {
      const container = document.getElementById('ohOrdersContainer');
      let filtered = [...this.cachedOrders];

      // Filter by status tab
      if (this.activeFilter !== 'all') {
        filtered = filtered.filter(o => (o.status || 'Pending').toLowerCase() === this.activeFilter.toLowerCase());
      }

      // Filter by search query
      if (this.searchQuery) {
        filtered = filtered.filter(o => 
          (o.id || '').toLowerCase().includes(this.searchQuery) ||
          (o.productName || '').toLowerCase().includes(this.searchQuery) ||
          (o.deliveryLocation || '').toLowerCase().includes(this.searchQuery) ||
          (o.paymentMethod || '').toLowerCase().includes(this.searchQuery)
        );
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="oh-empty-state">
            <span class="oh-empty-icon">🛍️</span>
            <h4 style="margin:0 0 6px 0; font-size:1.1rem; color:var(--text-main);">No Orders Found</h4>
            <p style="font-size:0.85rem; margin-bottom:16px;">${this.activeFilter !== 'all' ? `No orders matched status "${this.activeFilter}".` : 'You have not placed any orders yet or need to sign in to sync.'}</p>
            <button onclick="OrderHistoryComponent.closeModal(); location.href='index.html';" class="oh-action-btn primary" style="padding:10px 20px;">Browse Store Catalog</button>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(order => {
        const status = order.status || 'Pending';
        let statusClass = 'oh-status-pending';
        let statusIcon = '⏳';

        if (status.toLowerCase() === 'processing') { statusClass = 'oh-status-processing'; statusIcon = '⚙️'; }
        else if (status.toLowerCase() === 'shipped') { statusClass = 'oh-status-shipped'; statusIcon = '🚚'; }
        else if (status.toLowerCase() === 'delivered') { statusClass = 'oh-status-delivered'; statusIcon = '✅'; }
        else if (status.toLowerCase() === 'cancelled') { statusClass = 'oh-status-cancelled'; statusIcon = '✕'; }

        const dateStr = order.timestamp && order.timestamp.seconds 
          ? new Date(order.timestamp.seconds * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : (order.date || 'Recent Purchase');

        const orderId = order.id || 'ZNP-LOCAL';
        const formattedAmount = `Rs. ${Number(order.amountPaid || 0).toLocaleString()}`;

        return `
          <div class="oh-order-card">
            <div class="oh-card-top-row">
              <div>
                <div class="oh-order-id-meta">
                  <span>📦 #${orderId}</span>
                  <span class="oh-status-badge ${statusClass}">${statusIcon} ${status}</span>
                </div>
                <span class="oh-order-date">📅 ${dateStr}</span>
              </div>
              <div style="text-align:right;">
                <span style="font-size:1.15rem; font-weight:800; color:var(--nepal-blue);">${formattedAmount}</span>
              </div>
            </div>

            <div class="oh-items-summary">
              🛒 ${order.productName || 'Zozo Nepal Selected Products'}
            </div>

            <div class="oh-order-details-grid">
              <div class="oh-detail-item"><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</div>
              <div class="oh-detail-item"><strong>Recipient:</strong> ${order.customerName || 'Customer'}</div>
              <div class="oh-detail-item"><strong>Contact Phone:</strong> ${order.customerPhone || 'N/A'}</div>
              <div class="oh-detail-item"><strong>Destination:</strong> ${order.deliveryLocation || 'Nepal'}</div>
            </div>

            <div class="oh-card-actions">
              <button class="oh-action-btn" onclick="OrderHistoryComponent.trackOrderLive('${orderId}', '${order.customerPhone || ''}')">
                🚚 Track Shipment
              </button>
              <button class="oh-action-btn" onclick="OrderHistoryComponent.showInvoiceModal('${orderId}')">
                📄 View Receipt
              </button>
              <button class="oh-action-btn primary" onclick="OrderHistoryComponent.reorderItems('${orderId}')">
                🔄 Buy Again
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    showInvoiceModal: function (orderId) {
      const order = this.cachedOrders.find(o => o.id === orderId);
      if (!order) return;

      document.getElementById('invOrderId').innerText = `#${order.id || 'RECEIPT'}`;
      document.getElementById('invDate').innerText = order.timestamp && order.timestamp.seconds 
        ? new Date(order.timestamp.seconds * 1000).toLocaleDateString()
        : 'Recent Order';

      document.getElementById('invCustomerName').innerText = order.customerName || 'Valued Customer';
      document.getElementById('invCustomerPhone').innerText = order.customerPhone || '-';
      document.getElementById('invLocation').innerText = order.deliveryLocation || 'Nepal';
      document.getElementById('invPaymentMethod').innerText = order.paymentMethod || 'COD';
      document.getElementById('invItemsList').innerText = order.productName || 'Order Items';
      document.getElementById('invTotalAmount').innerText = `Rs. ${Number(order.amountPaid || 0).toLocaleString()}`;

      document.getElementById('zozoInvoiceModal').style.display = 'flex';
    },

    trackOrderLive: function (orderId, phone) {
      this.closeModal();
      if (window.openOrderTrackingModal) {
        window.openOrderTrackingModal();
        if (phone && document.getElementById('trackPhoneInput')) {
          document.getElementById('trackPhoneInput').value = phone;
          if (window.executeOrderTrackingLookup) {
            window.executeOrderTrackingLookup();
          }
        }
      } else {
        location.href = `/product.html?orderTrack=${encodeURIComponent(orderId)}`;
      }
    },

    reorderItems: function (orderId) {
      const order = this.cachedOrders.find(o => o.id === orderId);
      if (!order) return;

      if (window.showToastNotification) {
        window.showToastNotification(`🛒 Reordered "${order.productName || 'Item'}"! Proceeding to cart.`);
      } else {
        alert(`Items from order #${orderId} added to cart!`);
      }

      this.closeModal();
      if (window.toggleCartSidebar) {
        window.toggleCartSidebar(true);
      }
    }
  };

  window.OrderHistoryComponent = OrderHistoryComponent;
  window.openOrderHistoryModal = function (filter) {
    OrderHistoryComponent.openModal(filter);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OrderHistoryComponent.init());
  } else {
    OrderHistoryComponent.init();
  }
})();
