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
              <p style="margin:0; font-size:0.75rem; color:#64748b;">Official Purchase Receipt & Tax Invoice</p>
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

          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button id="invDownloadPdfBtn" onclick="OrderHistoryComponent.downloadCurrentInvoicePdf(this)" style="flex:1; min-width:160px; padding:10px 14px; font-weight:800; background:linear-gradient(135deg, #7c3aed, #9333ea); color:#ffffff; border:none; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 12px rgba(124, 58, 237, 0.25);">
              <span>📥</span> Download PDF Receipt
            </button>
            <button onclick="window.print()" style="padding:10px 14px; font-weight:700; background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
              <span>🖨️</span> Print
            </button>
            <button onclick="document.getElementById('zozoInvoiceModal').style.display='none'" style="padding:10px 16px; font-weight:700; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer;">
              Close
            </button>
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
              <button class="oh-action-btn" style="background:#f5f3ff; color:#7c3aed; border-color:#ddd6fe; font-weight:800;" onclick="OrderHistoryComponent.downloadOrderReceiptPdf('${orderId}', this)">
                📥 Download PDF
              </button>
              <button class="oh-action-btn primary" onclick="OrderHistoryComponent.reorderItems('${orderId}')">
                🔄 Buy Again
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    activeInvoiceOrderId: null,

    ensureJsPdfLoaded: function () {
      return new Promise((resolve, reject) => {
        if (window.jspdf && window.jspdf.jsPDF) {
          return resolve(window.jspdf.jsPDF);
        }
        if (window.jsPDF) {
          return resolve(window.jsPDF);
        }
        const existingScript = document.getElementById('zozoJsPdfScript');
        if (existingScript) {
          existingScript.addEventListener('load', () => {
            const cls = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (cls) resolve(cls);
            else reject(new Error('jsPDF initialized with empty class'));
          });
          existingScript.addEventListener('error', () => reject(new Error('Failed to load jsPDF library')));
          return;
        }
        const script = document.createElement('script');
        script.id = 'zozoJsPdfScript';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          const cls = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
          if (cls) resolve(cls);
          else reject(new Error('jsPDF loaded without constructor'));
        };
        script.onerror = () => reject(new Error('Failed to download jsPDF from CDN'));
        document.head.appendChild(script);
      });
    },

    downloadCurrentInvoicePdf: function (btnEl) {
      if (!this.activeInvoiceOrderId) {
        alert("No active order receipt selected for PDF download.");
        return;
      }
      this.downloadOrderReceiptPdf(this.activeInvoiceOrderId, btnEl);
    },

    downloadOrderReceiptPdf: async function (orderId, triggerBtnEl) {
      let btn = triggerBtnEl;
      let originalBtnHtml = '';
      if (btn) {
        originalBtnHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Generating PDF...';
      }

      try {
        let order = this.cachedOrders.find(o => o.id === orderId);
        
        // Fallback checks if order is not in cachedOrders
        if (!order) {
          try {
            const localSaved = JSON.parse(localStorage.getItem('zozo_user_orders') || '[]');
            order = localSaved.find(o => o.id === orderId);
          } catch (e) {}
        }
        if (!order && window.currentActiveOrder && window.currentActiveOrder.id === orderId) {
          order = window.currentActiveOrder;
        }

        if (!order) {
          alert("Unable to find full order record for generating PDF receipt.");
          return;
        }

        const jsPDFClass = await this.ensureJsPdfLoaded();
        const doc = new jsPDFClass({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
        const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
        const margin = 14;
        const contentWidth = pageWidth - (margin * 2); // 182mm

        // 1. Top Decorative Brand Bar
        doc.setFillColor(124, 58, 237); // #7c3aed
        doc.rect(0, 0, pageWidth, 5, 'F');

        // 2. Header Container
        doc.setFillColor(248, 250, 252); // #f8fafc
        doc.roundedRect(margin, 10, contentWidth, 34, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240); // #e2e8f0
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, 10, contentWidth, 34, 3, 3, 'S');

        // Brand Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(30, 27, 75); // #1e1b4b
        doc.text('ZOZO NEPAL', margin + 6, 22);

        // Brand Subtitle & Tagline
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // #64748b
        doc.text("Nepal's Premier Smart Tech & Mobile Accessories Hub", margin + 6, 27);
        doc.text("Kathmandu, Nepal  •  support@zozonepal.com  •  www.zozonepal.com", margin + 6, 32);
        doc.text("100% Genuine Certified Goods  •  Zozo Express Nepal Delivery", margin + 6, 37);

        // Right Side: Tax Receipt Badge Box
        doc.setFillColor(124, 58, 237);
        doc.roundedRect(pageWidth - margin - 64, 15, 58, 8, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('OFFICIAL ORDER RECEIPT', pageWidth - margin - 35, 20.5, { align: 'center' });

        const cleanId = (order.id || 'ORDER').substring(0, 20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`ID: #${cleanId}`, pageWidth - margin - 6, 29, { align: 'right' });

        const orderDateStr = order.timestamp && order.timestamp.seconds 
          ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : (order.date || new Date().toLocaleDateString());
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Date: ${orderDateStr}`, pageWidth - margin - 6, 34, { align: 'right' });

        const statusStr = (order.status || 'Pending').toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        if (statusStr === 'DELIVERED') {
          doc.setTextColor(22, 163, 74);
        } else if (statusStr === 'CANCELLED') {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(217, 119, 6);
        }
        doc.text(`Status: ${statusStr}`, pageWidth - margin - 6, 39, { align: 'right' });

        let currentY = 50;

        // 3. Two-Column Metadata Box (Customer & Shipping vs. Payment & Verification)
        const colWidth = (contentWidth - 6) / 2; // ~88mm

        // Left Box: Customer & Delivery Details
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, currentY, colWidth, 40, 3, 3, 'FD');

        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, colWidth, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('DELIVERY & CUSTOMER DETAILS', margin + 4, currentY + 5.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Customer: ${order.customerName || 'Valued Customer'}`, margin + 4, currentY + 13.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Phone / Mobile: ${order.customerPhone || 'N/A'}`, margin + 4, currentY + 18.5);
        
        const locText = `Destination: ${order.deliveryLocation || 'Nepal'}`;
        const splitLoc = doc.splitTextToSize(locText, colWidth - 8);
        doc.text(splitLoc, margin + 4, currentY + 23.5);

        if (order.famousPlace) {
          doc.text(`Landmark: ${order.famousPlace}`, margin + 4, currentY + 34);
        }

        // Right Box: Payment & Transaction Summary
        const rightColX = margin + colWidth + 6;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(rightColX, currentY, colWidth, 40, 3, 3, 'FD');

        doc.setFillColor(241, 245, 249);
        doc.rect(rightColX, currentY, colWidth, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('PAYMENT & TRANSACTION INFO', rightColX + 4, currentY + 5.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Method: ${order.paymentMethod || 'COD'}`, rightColX + 4, currentY + 13.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const txnCode = order.transactionId || order.txCode || 'Verified Transaction';
        doc.text(`Txn / Ref ID: ${txnCode}`, rightColX + 4, currentY + 18.5);
        doc.text(`Security Check: Safe Payment Verified`, rightColX + 4, currentY + 23.5);

        if (order.couponApplied) {
          doc.setTextColor(21, 128, 61);
          doc.text(`Coupon Applied: ${order.couponApplied} (Rs. ${order.discountGiven || 0} OFF)`, rightColX + 4, currentY + 28.5);
        } else {
          doc.text(`Dispatch Channel: Zozo Nepal Express Courier`, rightColX + 4, currentY + 28.5);
        }

        currentY += 46;

        // 4. Line Items Table Header
        doc.setFillColor(30, 27, 75); // Dark Purple/Indigo #1e1b4b
        doc.rect(margin, currentY, contentWidth, 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('#', margin + 4, currentY + 5.5);
        doc.text('ITEM DESCRIPTION & PRODUCT DETAILS', margin + 14, currentY + 5.5);
        doc.text('QTY', pageWidth - margin - 62, currentY + 5.5, { align: 'center' });
        doc.text('UNIT PRICE', pageWidth - margin - 34, currentY + 5.5, { align: 'right' });
        doc.text('TOTAL', pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

        currentY += 8;

        // Parse items
        const rawItemsStr = order.productName || 'Zozo Nepal Selected Products';
        const rawItemsList = rawItemsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const items = rawItemsList.length > 0 ? rawItemsList : [rawItemsStr];

        const totalBill = Number(order.amountPaid || 0);
        const discountGiven = Number(order.discountGiven || 0);
        const subtotal = totalBill + discountGiven;
        const itemPriceEstimate = items.length > 0 ? Math.round(subtotal / items.length) : subtotal;

        items.forEach((itemText, idx) => {
          const isEven = idx % 2 === 0;
          doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
          
          const itemLines = doc.splitTextToSize(itemText, 95);
          const rowHeight = Math.max(10, (itemLines.length * 4.5) + 5);

          doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(String(idx + 1), margin + 4, currentY + 6);
          doc.text(itemLines, margin + 14, currentY + 6);

          doc.text('1', pageWidth - margin - 62, currentY + 6, { align: 'center' });
          doc.text(`Rs. ${itemPriceEstimate.toLocaleString()}`, pageWidth - margin - 34, currentY + 6, { align: 'right' });
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${itemPriceEstimate.toLocaleString()}`, pageWidth - margin - 4, currentY + 6, { align: 'right' });

          currentY += rowHeight;
        });

        currentY += 6;

        // 5. Total & Breakdown Summary Box
        const summaryX = pageWidth - margin - 82;
        const summaryWidth = 82;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(summaryX, currentY, summaryWidth, 36, 2, 2, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(summaryX, currentY, summaryWidth, 36, 2, 2, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Items Subtotal:', summaryX + 4, currentY + 7);
        doc.text(`Rs. ${subtotal.toLocaleString()}`, pageWidth - margin - 4, currentY + 7, { align: 'right' });

        doc.text('Delivery Fee (All Nepal):', summaryX + 4, currentY + 13.5);
        doc.setTextColor(22, 163, 74);
        doc.text('FREE (Rs. 0)', pageWidth - margin - 4, currentY + 13.5, { align: 'right' });

        if (discountGiven > 0) {
          doc.setTextColor(220, 38, 38);
          doc.text(`Promo Discount:`, summaryX + 4, currentY + 20);
          doc.text(`- Rs. ${discountGiven.toLocaleString()}`, pageWidth - margin - 4, currentY + 20, { align: 'right' });
        } else {
          doc.setTextColor(71, 85, 105);
          doc.text(`Discount / Voucher:`, summaryX + 4, currentY + 20);
          doc.text(`Rs. 0`, pageWidth - margin - 4, currentY + 20, { align: 'right' });
        }

        // Grand Total Highlight Bar
        doc.setFillColor(124, 58, 237);
        doc.roundedRect(summaryX + 2, currentY + 24, summaryWidth - 4, 10, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('TOTAL PAID:', summaryX + 5, currentY + 30.5);
        doc.text(`Rs. ${totalBill.toLocaleString()}`, pageWidth - margin - 6, currentY + 30.5, { align: 'right' });

        // Left Box: Verification Stamp & Customer Support Assurance
        const sealX = margin;
        const sealWidth = contentWidth - summaryWidth - 8;
        doc.setFillColor(250, 245, 255); // #faf5ff
        doc.setDrawColor(221, 214, 254); // #ddd6fe
        doc.roundedRect(sealX, currentY, sealWidth, 36, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(109, 40, 217); // #6d28d9
        doc.text('✓ 100% OFFICIAL ZOZO NEPAL PURCHASE', sealX + 4, currentY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('• 7-Day Free Replacement Guarantee on defective products.', sealX + 4, currentY + 13.5);
        doc.text('• Dispatched securely via Zozo Express Nepal Courier logistics.', sealX + 4, currentY + 19);
        doc.text('• Customer Support Email: support@zozonepal.com', sealX + 4, currentY + 24.5);
        doc.text('• WhatsApp Helpline: +977-9800000000 / +977-9766706246', sealX + 4, currentY + 30);

        currentY += 44;

        // 6. Security Footer & Document Hash
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(margin, currentY, pageWidth - margin, currentY);

        currentY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`This is a computer-generated tax invoice & receipt issued by Zozo Nepal. Document Hash: ${cleanId}-${Date.now().toString(36).toUpperCase()}`, margin, currentY);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, currentY, { align: 'right' });

        // Bottom Decorative Bar
        doc.setFillColor(124, 58, 237);
        doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

        // Save and trigger file download
        const filename = `ZozoNepal_Receipt_${cleanId}.pdf`;
        doc.save(filename);

        if (window.showToastNotification) {
          window.showToastNotification(`📄 Receipt PDF downloaded: ${filename}`);
        }
      } catch (err) {
        console.error("PDF receipt generation error:", err);
        alert("Could not generate PDF receipt directly. Falling back to the printable receipt window.");
        this.showInvoiceModal(orderId);
      } finally {
        if (btn && originalBtnHtml) {
          btn.disabled = false;
          btn.innerHTML = originalBtnHtml;
        }
      }
    },

    showInvoiceModal: function (orderId) {
      let order = this.cachedOrders.find(o => o.id === orderId);
      if (!order) {
        try {
          const localSaved = JSON.parse(localStorage.getItem('zozo_user_orders') || '[]');
          order = localSaved.find(o => o.id === orderId);
        } catch (e) {}
      }
      if (!order) return;

      this.activeInvoiceOrderId = order.id || orderId;

      document.getElementById('invOrderId').innerText = `#${order.id || 'RECEIPT'}`;
      document.getElementById('invDate').innerText = order.timestamp && order.timestamp.seconds 
        ? new Date(order.timestamp.seconds * 1000).toLocaleDateString()
        : (order.date || 'Recent Order');

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
  window.downloadOrderReceiptPdf = function (orderId, btnEl) {
    OrderHistoryComponent.downloadOrderReceiptPdf(orderId, btnEl);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OrderHistoryComponent.init());
  } else {
    OrderHistoryComponent.init();
  }
})();
