/* ═══════════════════════════════════════════
   PATEL STORES — Driver Portal Pages
   ═══════════════════════════════════════════ */

function renderDriverDashboard() {
    const user = Store.getCurrentUser();
    if (!user || user.role !== 'driver') return navigate('staff-login');

    const orders = Store.getOrders();
    const myOrders = orders.filter(o => o.driver_id === user.id);
    const active = myOrders.filter(o => o.status === 'delivering');
    const completed = myOrders.filter(o => o.status === 'delivered');

    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:var(--gap-xl) var(--gap-lg)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--gap-xl);flex-wrap:wrap;gap:var(--gap-md)">
                <div>
                    <h1>My Deliveries</h1>
                    <p style="color:var(--slate)">Welcome, ${user.name}</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card saffron">
                    <div class="stat-label">Active Deliveries</div>
                    <div class="stat-value">${active.length}</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Completed</div>
                    <div class="stat-value">${completed.length}</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-label">Total Assigned</div>
                    <div class="stat-value">${myOrders.length}</div>
                </div>
            </div>

            ${active.length > 0 ? `<h2 style="margin-bottom:var(--gap-md)">Active Deliveries</h2>` : ''}
            ${active.map(o => driverOrderCard(o, true)).join('')}

            ${active.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🚗</div>
                    <h3>No active deliveries</h3>
                    <p>You're all caught up! New deliveries will appear here when assigned by admin.</p>
                </div>
            ` : ''}

            ${completed.length > 0 ? `
                <h2 style="margin:var(--gap-xl) 0 var(--gap-md)">Completed Deliveries</h2>
                ${completed.map(o => driverOrderCard(o, false)).join('')}
            ` : ''}
        </div>
    `;
}

function driverOrderCard(order, showActions) {
    return `
        <div class="delivery-card" style="border-left-color:${order.status === 'delivered' ? 'var(--forest)' : 'var(--saffron)'}">
            <div class="delivery-header">
                <div>
                    <span style="font-weight:700;font-family:var(--font-mono)">${order.id}</span>
                    <span style="margin-left:8px">${statusTag(order.status)}</span>
                </div>
                <span style="font-weight:700;color:var(--forest)">${formatRWF(order.total)}</span>
            </div>
            <div class="delivery-customer">
                <div class="nav-avatar" style="width:32px;height:32px;font-size:0.75rem">${order.customer_name.charAt(0)}</div>
                <div>
                    <div style="font-weight:600">${order.customer_name}</div>
                    <div style="font-size:0.82rem;color:var(--slate)">${order.customer_phone}</div>
                </div>
            </div>
            <div class="delivery-address">📍 ${order.customer_address}</div>
            <div style="margin-top:var(--gap-sm);font-size:0.82rem;color:var(--slate)">
                ${(STORES.find(s=>s.id===order.store_id)?.name || '')} · ${order.items.length} item${order.items.length!==1?'s':''}
            </div>
            <div style="margin-top:var(--gap-sm);font-size:0.82rem">
                ${order.items.map(it => `${it.emoji} ${it.name} x${it.qty}`).join(' · ')}
            </div>
            ${showActions ? `
                <div style="margin-top:var(--gap-md);display:flex;gap:var(--gap-sm)">
                    <button class="btn btn-secondary btn-sm" onclick="completeDelivery('${order.id}')">✓ Mark as Delivered</button>
                    <button class="btn btn-ghost btn-sm" onclick="viewDeliveryOnMap('${order.customer_address}')">📍 View Address</button>
                </div>
            ` : `
                <div style="margin-top:var(--gap-sm);font-size:0.82rem;color:var(--forest)">✓ Delivered on ${formatDate(order.created_at)}</div>
            `}
        </div>
    `;
}

async function completeDelivery(orderId) {
    await Store.updateOrderStatus(orderId, 'delivered');
    await Store.refreshOrders();
    const order = Store.getOrders().find(o => o.id === orderId);
    showToast('Delivery ' + orderId + ' marked as completed!');

    if (order) {
        showEmailPreview('delivery-confirmation', {
            orderId: order.id,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerAddress: order.customer_address,
            storeId: order.store_id
        });
    }

    renderDriverDashboard();
}

function viewDeliveryOnMap(address) {
    showToast('Opening map for: ' + address, 'info');
}
