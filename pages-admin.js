/* ═══════════════════════════════════════════
   PATEL STORES v2 — Admin Pages
   Mobile-friendly card-based layout
   ═══════════════════════════════════════════ */

function adminShell(activeTab, content) {
    return `
        <div class="admin-layout">
            <aside class="admin-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-label">Management</div>
                    <a class="sidebar-link ${activeTab==='dashboard'?'active':''}" onclick="navigate('admin')">
                        <span class="sidebar-icon">📊</span> Dashboard
                    </a>
                    <a class="sidebar-link ${activeTab==='orders'?'active':''}" onclick="navigate('admin-orders')">
                        <span class="sidebar-icon">📦</span> Orders
                    </a>
                    <a class="sidebar-link ${activeTab==='payments'?'active':''}" onclick="navigate('admin-payments')">
                        <span class="sidebar-icon">💳</span> Payments
                    </a>
                    <a class="sidebar-link ${activeTab==='products'?'active':''}" onclick="navigate('admin-products')">
                        <span class="sidebar-icon">🏷️</span> Products
                    </a>
                    <a class="sidebar-link ${activeTab==='categories'?'active':''}" onclick="navigate('admin-categories')">
                        <span class="sidebar-icon">📂</span> Categories
                    </a>
                    <a class="sidebar-link ${activeTab==='customers'?'active':''}" onclick="navigate('admin-customers')">
                        <span class="sidebar-icon">👥</span> Customers
                    </a>
                    <a class="sidebar-link ${activeTab==='drivers'?'active':''}" onclick="navigate('admin-drivers')">
                        <span class="sidebar-icon">🚗</span> Drivers
                    </a>
                    <a class="sidebar-link ${activeTab==='analytics'?'active':''}" onclick="navigate('admin-analytics')">
                        <span class="sidebar-icon">📈</span> Analytics
                    </a>
                </div>
            </aside>
            <div class="admin-content">${content}</div>
        </div>
    `;
}

// ── Helper: Order Card (used everywhere instead of table rows) ──
function orderCard(o, showActions = false) {
    const store = STORES.find(s => s.id === o.store_id);
    const drivers = Store.getDrivers();
    const statusColor = {'awaiting-payment':'#B45309',pending:'#EA580C',confirmed:'#2563EB',delivering:'#D97706',delivered:'#16A34A',cancelled:'#DC2626'}[o.status] || '#666';

    return `
        <div class="card" style="margin-bottom:8px;border-left:3px solid ${statusColor}">
            <div class="card-body" style="padding:12px">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:6px;margin-bottom:6px">
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                            <span style="font-weight:700;font-family:var(--font-mono);font-size:0.82rem">${o.id}</span>
                            ${statusTag(o.status)}
                        </div>
                        <div style="font-weight:600;font-size:0.9rem">${o.customer_name || 'Guest'}</div>
                        <div style="font-size:0.78rem;color:var(--slate)">${o.customer_phone || ''} · ${store?.name?.replace('Patel ','') || ''}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:800;color:var(--forest);font-size:1rem">${formatRWF(o.total)}</div>
                        <div style="font-size:0.72rem;color:var(--light-slate)">${formatDateTime(o.created_at)}</div>
                    </div>
                </div>
                <div style="font-size:0.78rem;color:var(--slate);margin-bottom:${showActions ? '8px' : '0'}">
                    ${o.items.map(it => `${it.emoji} ${it.name} ×${it.qty}`).join(' · ')}
                </div>
                ${showActions ? `
                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--cream-dark)">
                    <select class="form-input" style="padding:6px 8px;font-size:0.78rem;flex:1;min-width:120px" onchange="changeOrderStatus('${o.id}',this.value)">
                        ${['awaiting-payment','pending','confirmed','delivering','delivered','cancelled'].map(s =>
                            `<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1).replace('-',' ')}</option>`
                        ).join('')}
                    </select>
                    ${o.status === 'confirmed' ? `
                        <select class="form-input" style="padding:6px 8px;font-size:0.78rem;flex:1;min-width:120px" onchange="assignDriverToOrder('${o.id}',this.value)">
                            <option value="">Assign driver...</option>
                            ${drivers.map(d => `<option value="${d.id}" ${o.driver_id===d.id?'selected':''}>${d.name}</option>`).join('')}
                        </select>
                    ` : ''}
                    <div style="font-size:0.75rem;color:var(--slate)">${paymentLabel(o.payment_method)}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ── Helper: Product Card ──
function adminProductCard(p) {
    const images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    const img = images.length > 0 ? `<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:1.8rem">${p.emoji}</span>`;
    const stockColor = p.stock === 0 ? 'var(--red)' : p.stock <= 5 ? 'var(--orange)' : 'var(--forest)';
    const stockText = p.stock === 0 ? 'Out of stock' : p.stock != null ? p.stock + ' left' : 'In stock';

    return `
        <div class="card" style="margin-bottom:8px">
            <div class="card-body" style="padding:10px;display:flex;align-items:center;gap:10px">
                <div style="width:52px;height:52px;border-radius:var(--radius-sm);background:var(--cream);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">
                    ${img}
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:0.88rem;color:var(--coffee);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
                    <div style="display:flex;gap:8px;align-items:center;margin-top:2px">
                        <span style="font-weight:800;color:var(--forest);font-size:0.88rem">${formatRWF(p.price)}</span>
                        <span style="font-size:0.72rem;font-weight:600;color:${stockColor}">${stockText}</span>
                    </div>
                    <div style="font-size:0.7rem;color:var(--light-slate);margin-top:1px">${p.stores.map(s => STORES.find(st => st.id === s)?.name?.replace('Patel ','')).join(' · ')}</div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn btn-ghost btn-sm" style="padding:5px 8px;font-size:0.75rem" onclick="showEditProductForm('${p.id}')">✏️</button>
                    <button class="btn btn-ghost btn-sm" style="padding:5px 8px;font-size:0.75rem" onclick="deleteProduct('${p.id}')">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
function renderAdminDashboard() {
    const orders = Store.getOrders();
    const customers = Store.getCustomers();
    const products = Store.getProducts();
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'awaiting-payment').length;
    const delivering = orders.filter(o => o.status === 'delivering').length;

    const content = `
        <div class="admin-header">
            <div>
                <h1 style="font-size:1.4rem">Dashboard</h1>
                <p style="color:var(--slate);font-size:0.85rem">Welcome back, Admin</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card saffron">
                <div class="stat-label">Revenue</div>
                <div class="stat-value" style="font-size:1.4rem">${formatRWF(totalRevenue)}</div>
                <div class="stat-sub">${orders.length} total orders</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Customers</div>
                <div class="stat-value">${customers.length}</div>
                <div class="stat-sub">Registered</div>
            </div>
            <div class="stat-card terra">
                <div class="stat-label">Pending</div>
                <div class="stat-value">${pending}</div>
                <div class="stat-sub">${delivering} delivering</div>
            </div>
            <div class="stat-card blue">
                <div class="stat-label">Products</div>
                <div class="stat-value">${products.length}</div>
                <div class="stat-sub">3 stores</div>
            </div>
        </div>

        <div style="margin-bottom:var(--gap-md)">
            <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:var(--gap-sm);font-size:1rem">Recent Orders</h3>
            ${orders.slice(0, 6).map(o => orderCard(o)).join('')}
            ${orders.length === 0 ? '<div class="empty-state" style="padding:var(--gap-lg)"><div class="empty-icon">📋</div><h3>No orders yet</h3></div>' : ''}
        </div>
    `;

    document.getElementById('page-container').innerHTML = adminShell('dashboard', content);
}

// ═══════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════
function renderAdminOrders() {
    const orders = Store.getOrders();
    const content = `
        <div class="admin-header">
            <h1 style="font-size:1.3rem">Orders (${orders.length})</h1>
        </div>
        ${orders.map(o => orderCard(o, true)).join('')}
        ${orders.length === 0 ? '<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders</h3></div>' : ''}
    `;
    document.getElementById('page-container').innerHTML = adminShell('orders', content);
}

async function changeOrderStatus(orderId, status) {
    const order = await Store.updateOrderStatus(orderId, status);
    showToast('Order ' + orderId + ' → ' + status.replace('-',' '));
    if (order) {
        showEmailPreview('status-update', {
            orderId: order.id, customerName: order.customer_name,
            customerEmail: order.customer_email, storeId: order.store_id, status: order.status
        });
    }
    renderAdminOrders();
}

async function assignDriverToOrder(orderId, driverId) {
    if (!driverId) return;
    await Store.assignDriver(orderId, driverId);
    showToast('Driver assigned to ' + orderId);
    renderAdminOrders();
}

// ═══════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════
function renderAdminPayments() {
    const orders = Store.getOrders();
    const awaitingPayment = orders.filter(o => o.status === 'awaiting-payment' && o.payment_proof);
    const verifiedRecently = orders.filter(o => o.payment_verified && o.payment_method !== 'cod').slice(0, 10);

    const awaitingCards = awaitingPayment.length === 0
        ? '<div class="empty-state" style="padding:var(--gap-lg)"><div class="empty-icon">✅</div><h3>All payments verified</h3><p>No pending proofs to review.</p></div>'
        : awaitingPayment.map(o => `
            <div class="card" style="margin-bottom:10px;border-left:3px solid #B45309">
                <div class="card-body" style="padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:6px;margin-bottom:8px">
                        <div>
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                                <span style="font-weight:700;font-family:var(--font-mono);font-size:0.82rem">${o.id}</span>
                                ${statusTag(o.status)}
                            </div>
                            <div style="font-weight:600;font-size:0.9rem">${o.customer_name}</div>
                            <div style="font-size:0.78rem;color:var(--slate)">${o.customer_phone} · ${o.customer_email}</div>
                            <div style="font-size:0.78rem;color:var(--slate)">📍 ${o.customer_address}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="font-weight:800;color:var(--forest);font-size:1.1rem">${formatRWF(o.total)}</div>
                            <div style="font-size:0.72rem;color:var(--light-slate)">${formatDateTime(o.created_at)}</div>
                        </div>
                    </div>
                    <div style="font-size:0.78rem;color:var(--slate);margin-bottom:8px">
                        ${o.items.map(it => `${it.emoji} ${it.name} ×${it.qty}`).join(' · ')}
                    </div>
                    <div style="margin-bottom:10px">
                        <div style="font-weight:600;font-size:0.78rem;margin-bottom:4px">Payment Screenshot:</div>
                        <img src="${o.payment_proof}" style="max-width:100%;max-height:300px;border-radius:var(--radius-md);border:1px solid var(--cream-dark)" onclick="window.open(this.src,'_blank')">
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="verifyPayment('${o.id}',true)">✓ Confirm</button>
                        <button class="btn btn-danger btn-sm" style="flex:1" onclick="verifyPayment('${o.id}',false)">✕ Reject</button>
                    </div>
                </div>
            </div>
        `).join('');

    const content = `
        <div class="admin-header">
            <div>
                <h1 style="font-size:1.3rem">Payments</h1>
                <p style="color:var(--slate);font-size:0.82rem">Review MoMo payment screenshots</p>
            </div>
            ${awaitingPayment.length > 0 ? `<span class="tag tag-awaiting-payment" style="font-size:0.78rem;padding:5px 12px">${awaitingPayment.length} pending</span>` : ''}
        </div>

        <h3 style="margin-bottom:var(--gap-sm);font-size:0.95rem">Pending Verification</h3>
        ${awaitingCards}

        ${verifiedRecently.length > 0 ? `
            <h3 style="margin:var(--gap-lg) 0 var(--gap-sm);font-size:0.95rem">Recently Verified</h3>
            ${verifiedRecently.map(o => orderCard(o)).join('')}
        ` : ''}
    `;

    document.getElementById('page-container').innerHTML = adminShell('payments', content);
}

async function verifyPayment(orderId, approved) {
    if (approved) {
        await sb.from('orders').update({ payment_verified: true, status: 'pending' }).eq('id', orderId);
        await Store.refreshOrders();
        showToast('Payment confirmed — order processing', 'success');
    } else {
        await sb.from('orders').update({ payment_verified: false, status: 'cancelled' }).eq('id', orderId);
        await Store.refreshOrders();
        showToast('Payment rejected — order cancelled', 'error');
    }
    renderAdminPayments();
}

// ═══════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════
function renderAdminProducts() {
    const products = Store.getProducts();
    const catOptions = Store.getCategories().filter(c => c.id !== 'all').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const storeChecks = STORES.map(s => `<label class="form-check"><input type="checkbox" value="${s.id}" class="new-prod-store" checked> ${s.name}</label>`).join('');

    const content = `
        <div class="admin-header">
            <h1 style="font-size:1.3rem">Products (${products.length})</h1>
            <button class="btn btn-primary btn-sm" onclick="showAddProductForm()">+ Add Product</button>
        </div>

        <div class="search-bar" style="margin-bottom:var(--gap-sm)">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search products..." oninput="searchAdminProducts(this.value)">
        </div>

        <!-- ADD PRODUCT FORM -->
        <div id="add-product-form" style="display:none;margin-bottom:var(--gap-md)">
            <div class="card" style="border:2px solid var(--saffron)">
                <div class="card-body" style="padding:14px">
                    <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:var(--gap-sm);font-size:0.95rem">Add New Product</h3>
                    <div class="form-group"><label>Product Name</label><input type="text" class="form-input" id="new-prod-name" placeholder="Product name"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Price (RWF)</label><input type="number" class="form-input" id="new-prod-price" placeholder="0"></div>
                        <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="new-prod-stock" placeholder="50" min="0"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Category</label><select class="form-input" id="new-prod-cat">${catOptions}</select></div>
                        <div class="form-group"><label>Emoji</label><input type="text" class="form-input" id="new-prod-emoji" placeholder="🛒" value="🛒"></div>
                    </div>
                    <div class="form-group">
                        <label>Stores</label>
                        <div style="display:flex;gap:var(--gap-sm);flex-wrap:wrap;margin-top:4px">${storeChecks}</div>
                    </div>
                    <div class="form-group">
                        <label>Photos (up to 5)</label>
                        <div style="display:flex;gap:var(--gap-xs);flex-wrap:wrap" id="new-prod-images-preview"></div>
                        <div class="upload-zone" style="margin-top:6px;padding:var(--gap-md)" onclick="document.getElementById('new-prod-images').click()">
                            <div class="upload-icon">📷</div><p>Tap to add photos</p>
                        </div>
                        <input type="file" id="new-prod-images" accept="image/*" multiple style="display:none" onchange="previewNewProductImages(this)">
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="flex:1" onclick="addNewProduct()">Add Product</button>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-product-form').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- EDIT PRODUCT FORM -->
        <div id="edit-product-form" style="display:none;margin-bottom:var(--gap-md)">
            <div class="card" style="border:2px solid var(--saffron)">
                <div class="card-body" style="padding:14px">
                    <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:var(--gap-sm);font-size:0.95rem">✏️ Edit Product</h3>
                    <input type="hidden" id="edit-prod-id">
                    <div class="form-group"><label>Product Name</label><input type="text" class="form-input" id="edit-prod-name"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Price (RWF)</label><input type="number" class="form-input" id="edit-prod-price"></div>
                        <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="edit-prod-stock" min="0"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Category</label><select class="form-input" id="edit-prod-cat">${catOptions}</select></div>
                        <div class="form-group"><label>Emoji</label><input type="text" class="form-input" id="edit-prod-emoji"></div>
                    </div>
                    <div class="form-group">
                        <label>Stores</label>
                        <div style="display:flex;gap:var(--gap-sm);flex-wrap:wrap;margin-top:4px">
                            ${STORES.map(s => `<label class="form-check"><input type="checkbox" value="${s.id}" class="edit-prod-store"> ${s.name}</label>`).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Photos</label>
                        <div style="display:flex;gap:var(--gap-xs);flex-wrap:wrap" id="edit-prod-images-preview"></div>
                        <div class="upload-zone" style="margin-top:6px;padding:var(--gap-md)" onclick="document.getElementById('edit-prod-images').click()">
                            <div class="upload-icon">📷</div><p>Add more photos</p>
                        </div>
                        <input type="file" id="edit-prod-images" accept="image/*" multiple style="display:none" onchange="addEditProductImages(this)">
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="flex:1" onclick="saveEditProduct()">💾 Save</button>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('edit-product-form').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="admin-products-list">
            ${products.map(p => adminProductCard(p)).join('')}
        </div>
        ${products.length === 0 ? '<div class="empty-state"><div class="empty-icon">🏷️</div><h3>No products</h3><p>Add your first product!</p></div>' : ''}
    `;

    document.getElementById('page-container').innerHTML = adminShell('products', content);
}

function searchAdminProducts(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#admin-products-list .card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

function showAddProductForm() {
    document.getElementById('edit-product-form').style.display = 'none';
    document.getElementById('add-product-form').style.display = '';
    document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth' });
}

let newProductImages = [];
function previewNewProductImages(input) {
    const files = Array.from(input.files);
    const remaining = 5 - newProductImages.length;
    if (files.length > remaining) showToast(`Only ${remaining} more photo(s) allowed`, 'error');
    files.slice(0, remaining).forEach(file => {
        if (file.size > 2 * 1024 * 1024) { showToast(file.name + ' is over 2MB', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (e) => { newProductImages.push(e.target.result); renderNewProductImagePreviews(); };
        reader.readAsDataURL(file);
    });
    input.value = '';
}
function renderNewProductImagePreviews() {
    const c = document.getElementById('new-prod-images-preview'); if (!c) return;
    c.innerHTML = newProductImages.map((img, i) => `<div style="position:relative"><img src="${img}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;border:1px solid var(--cream-dark)"><button onclick="removeNewProductImage(${i})" style="position:absolute;top:-4px;right:-4px;background:var(--red);color:white;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:0.65rem;display:flex;align-items:center;justify-content:center">✕</button></div>`).join('');
}
function removeNewProductImage(i) { newProductImages.splice(i, 1); renderNewProductImagePreviews(); }

async function addNewProduct() {
    const name = document.getElementById('new-prod-name').value.trim();
    const price = parseInt(document.getElementById('new-prod-price').value);
    const category = document.getElementById('new-prod-cat').value;
    const emoji = document.getElementById('new-prod-emoji').value || '🛒';
    const stock = parseInt(document.getElementById('new-prod-stock').value) || null;
    const stores = Array.from(document.querySelectorAll('.new-prod-store:checked')).map(cb => cb.value);
    if (!name || !price || stores.length === 0) return showToast('Fill all fields and select a store', 'error');
    try {
        let imageUrls = [];
        for (let i = 0; i < newProductImages.length; i++) {
            const ext = newProductImages[i].match(/data:image\/(\w+)/)?.[1] || 'png';
            const path = `products/${crypto.randomUUID()}.${ext}`;
            const url = await Store.uploadFile('uploads', path, newProductImages[i]);
            imageUrls.push(url);
        }
        await Store.addProduct({ name, category, price, emoji, stores, stock, image: imageUrls[0] || null, images: imageUrls });
        newProductImages = [];
        showToast('"' + name + '" added!');
        renderAdminProducts();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

let editProductImages = [];
function showEditProductForm(productId) {
    const p = Store.getProduct(productId); if (!p) return;
    document.getElementById('add-product-form').style.display = 'none';
    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-price').value = p.price;
    document.getElementById('edit-prod-emoji').value = p.emoji || '';
    document.getElementById('edit-prod-stock').value = p.stock ?? '';
    document.getElementById('edit-prod-cat').value = p.category;
    document.querySelectorAll('.edit-prod-store').forEach(cb => { cb.checked = p.stores.includes(cb.value); });
    editProductImages = Array.isArray(p.images) ? [...p.images] : (p.image ? [p.image] : []);
    renderEditProductImagePreviews();
    document.getElementById('edit-product-form').style.display = '';
    document.getElementById('edit-product-form').scrollIntoView({ behavior: 'smooth' });
}
function addEditProductImages(input) {
    const files = Array.from(input.files);
    const remaining = 5 - editProductImages.length;
    if (files.length > remaining) showToast(`Only ${remaining} more allowed`, 'error');
    files.slice(0, remaining).forEach(file => {
        if (file.size > 2 * 1024 * 1024) { showToast(file.name + ' too large', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (e) => { editProductImages.push(e.target.result); renderEditProductImagePreviews(); };
        reader.readAsDataURL(file);
    });
    input.value = '';
}
function renderEditProductImagePreviews() {
    const c = document.getElementById('edit-prod-images-preview'); if (!c) return;
    c.innerHTML = editProductImages.map((img, i) => `<div style="position:relative"><img src="${img}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;border:1px solid var(--cream-dark)"><button onclick="removeEditProductImage(${i})" style="position:absolute;top:-4px;right:-4px;background:var(--red);color:white;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:0.65rem;display:flex;align-items:center;justify-content:center">✕</button></div>`).join('');
}
function removeEditProductImage(i) { editProductImages.splice(i, 1); renderEditProductImagePreviews(); }

async function saveEditProduct() {
    const id = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('edit-prod-name').value.trim();
    const price = parseInt(document.getElementById('edit-prod-price').value);
    const category = document.getElementById('edit-prod-cat').value;
    const emoji = document.getElementById('edit-prod-emoji').value || '🛒';
    const stock = document.getElementById('edit-prod-stock').value !== '' ? parseInt(document.getElementById('edit-prod-stock').value) : null;
    const stores = Array.from(document.querySelectorAll('.edit-prod-store:checked')).map(cb => cb.value);
    if (!name || !price || stores.length === 0) return showToast('Fill all fields', 'error');
    try {
        let finalImages = [];
        for (let img of editProductImages) {
            if (img.startsWith('data:')) {
                const ext = img.match(/data:image\/(\w+)/)?.[1] || 'png';
                const path = `products/${crypto.randomUUID()}.${ext}`;
                const url = await Store.uploadFile('uploads', path, img);
                finalImages.push(url);
            } else { finalImages.push(img); }
        }
        await Store.updateProduct(id, { name, price, category, emoji, stores, stock, image: finalImages[0] || null, images: finalImages });
        showToast('"' + name + '" updated!');
        document.getElementById('edit-product-form').style.display = 'none';
        renderAdminProducts();
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

async function deleteProduct(productId) {
    const p = Store.getProduct(productId);
    if (!confirm('Delete "' + (p?.name || productId) + '"?')) return;
    try { await Store.deleteProduct(productId); showToast('Deleted'); renderAdminProducts(); }
    catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
function renderAdminCategories() {
    const categories = Store.getCategories().filter(c => c.id !== 'all');
    const products = Store.getProducts();
    const content = `
        <div class="admin-header">
            <h1 style="font-size:1.3rem">Categories</h1>
            <button class="btn btn-primary btn-sm" onclick="showAddCategoryForm()">+ Add</button>
        </div>
        <div id="add-category-form" style="display:none;margin-bottom:var(--gap-md)">
            <div class="card" style="border:2px solid var(--saffron)">
                <div class="card-body" style="padding:14px">
                    <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:var(--gap-sm);font-size:0.95rem">Add Category</h3>
                    <div class="form-row">
                        <div class="form-group"><label>Name</label><input type="text" class="form-input" id="new-cat-name" placeholder="e.g. Frozen Foods"></div>
                        <div class="form-group"><label>Emoji</label><input type="text" class="form-input" id="new-cat-emoji" value="🛒" style="max-width:80px"></div>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" onclick="addNewCategory()">Add</button>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-category-form').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        ${categories.map(c => {
            const count = products.filter(p => p.category === c.id).length;
            return `<div class="card" style="margin-bottom:6px"><div class="card-body" style="padding:10px;display:flex;align-items:center;gap:10px">
                <span style="font-size:1.6rem">${c.emoji}</span>
                <div style="flex:1"><div style="font-weight:600;font-size:0.88rem">${c.name}</div><div style="font-size:0.72rem;color:var(--slate)">${count} product${count!==1?'s':''}</div></div>
                <button class="btn btn-ghost btn-sm" style="font-size:0.72rem;padding:4px 8px" onclick="deleteCategory('${c.id}')">🗑️</button>
            </div></div>`;
        }).join('')}
    `;
    document.getElementById('page-container').innerHTML = adminShell('categories', content);
}
function showAddCategoryForm() { document.getElementById('add-category-form').style.display = ''; }
async function addNewCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    const emoji = document.getElementById('new-cat-emoji').value.trim() || '🛒';
    if (!name) return showToast('Enter a name', 'error');
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (Store.getCategories().find(c => c.id === id)) return showToast('Already exists', 'error');
    try { await Store.addCategory({ id, name, emoji }); showToast('"' + name + '" added'); renderAdminCategories(); }
    catch (err) { showToast('Failed: ' + err.message, 'error'); }
}
async function deleteCategory(catId) {
    const count = Store.getProducts().filter(p => p.category === catId).length;
    if (count > 0 && !confirm(count + ' products will become uncategorized. Continue?')) return;
    try { await Store.removeCategory(catId); showToast('Removed'); renderAdminCategories(); }
    catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ═══════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════
function renderAdminCustomers() {
    const customers = Store.getCustomers();
    const orders = Store.getOrders();
    const content = `
        <div class="admin-header"><h1 style="font-size:1.3rem">Customers (${customers.length})</h1></div>
        <div class="search-bar" style="margin-bottom:var(--gap-sm)">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search customers..." oninput="searchCustomerCards(this.value)">
        </div>
        <div id="customer-cards-list">
        ${customers.map(c => {
            const custOrders = orders.filter(o => o.customer_id === c.id);
            const spent = custOrders.reduce((s, o) => s + o.total, 0);
            return `<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="navigate('admin-customer-detail',{id:'${c.id}'})">
                <div class="card-body" style="padding:10px;display:flex;align-items:center;gap:10px">
                    <div class="nav-avatar" style="width:38px;height:38px;font-size:0.9rem;flex-shrink:0">${c.name.charAt(0)}</div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:0.88rem;color:var(--coffee)">${c.name}</div>
                        <div style="font-size:0.75rem;color:var(--slate)">${c.email} · ${c.phone}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div style="font-weight:700;color:var(--forest);font-size:0.85rem">${formatRWF(spent)}</div>
                        <div style="font-size:0.7rem;color:var(--light-slate)">${custOrders.length} orders</div>
                    </div>
                </div>
            </div>`;
        }).join('')}
        </div>
    `;
    document.getElementById('page-container').innerHTML = adminShell('customers', content);
}

function searchCustomerCards(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#customer-cards-list .card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

function renderAdminCustomerDetail(customerId) {
    const customer = Store.getCustomer(customerId);
    if (!customer) return navigate('admin-customers');
    const orders = Store.getOrders().filter(o => o.customer_id === customerId);
    const totalSpent = orders.reduce((s, o) => s + o.total, 0);
    const content = `
        <button class="btn btn-ghost btn-sm" onclick="navigate('admin-customers')" style="margin-bottom:var(--gap-sm)">← Back</button>
        <div style="display:flex;align-items:center;gap:var(--gap-sm);margin-bottom:var(--gap-md)">
            <div class="nav-avatar" style="width:48px;height:48px;font-size:1.2rem">${customer.name.charAt(0)}</div>
            <div>
                <h2 style="margin:0;font-size:1.2rem">${customer.name}</h2>
                <div style="font-size:0.82rem;color:var(--slate)">${customer.email} · ${customer.phone}</div>
            </div>
        </div>
        <div class="stats-grid" style="margin-bottom:var(--gap-md)">
            <div class="stat-card saffron"><div class="stat-label">Orders</div><div class="stat-value">${orders.length}</div></div>
            <div class="stat-card green"><div class="stat-label">Spent</div><div class="stat-value" style="font-size:1.2rem">${formatRWF(totalSpent)}</div></div>
        </div>
        <div style="font-size:0.82rem;color:var(--slate);margin-bottom:var(--gap-md)">📍 ${customer.address || 'No address'} · Since ${formatDate(customer.created_at)}</div>
        <h3 style="font-size:0.95rem;margin-bottom:var(--gap-sm)">Order History</h3>
        ${orders.map(o => orderCard(o)).join('')}
        ${orders.length === 0 ? '<div class="empty-state"><p>No orders yet</p></div>' : ''}
    `;
    document.getElementById('page-container').innerHTML = adminShell('customers', content);
}

// ═══════════════════════════════════════════
// DRIVERS
// ═══════════════════════════════════════════
function renderAdminDrivers() {
    const drivers = Store.getDrivers();
    const orders = Store.getOrders();
    const content = `
        <div class="admin-header">
            <h1 style="font-size:1.3rem">Drivers</h1>
            <button class="btn btn-primary btn-sm" onclick="showAddDriverForm()">+ Add</button>
        </div>
        <div id="add-driver-form" style="display:none;margin-bottom:var(--gap-md)">
            <div class="card" style="border:2px solid var(--saffron)">
                <div class="card-body" style="padding:14px">
                    <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:var(--gap-sm);font-size:0.95rem">Add Driver</h3>
                    <div class="form-group"><label>Name</label><input type="text" class="form-input" id="new-drv-name" placeholder="Full name"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Email</label><input type="email" class="form-input" id="new-drv-email" placeholder="driver@patelstores.rw"></div>
                        <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="new-drv-phone" placeholder="+250 7XX"></div>
                    </div>
                    <div class="form-group"><label>Password</label><input type="text" class="form-input" id="new-drv-pass" placeholder="Initial password"></div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-primary btn-sm" style="flex:1" onclick="addNewDriver()">Create</button>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('add-driver-form').style.display='none'">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        ${drivers.map(d => {
            const assigned = orders.filter(o => o.driver_id === d.id);
            const delivered = assigned.filter(o => o.status === 'delivered').length;
            const active = assigned.filter(o => o.status === 'delivering').length;
            return `<div class="card" style="margin-bottom:8px"><div class="card-body" style="padding:12px;display:flex;align-items:center;gap:10px">
                <div class="nav-avatar" style="width:42px;height:42px;font-size:1rem;background:linear-gradient(135deg,var(--forest),var(--forest-light));flex-shrink:0">${d.name.charAt(0)}</div>
                <div style="flex:1"><div style="font-weight:600;font-size:0.9rem">${d.name}</div><div style="font-size:0.75rem;color:var(--slate)">${d.email} · ${d.phone}</div></div>
                <div style="display:flex;gap:12px;text-align:center;flex-shrink:0">
                    <div><div style="font-weight:700;font-size:1.1rem;color:var(--saffron)">${active}</div><div style="font-size:0.6rem;color:var(--slate)">Active</div></div>
                    <div><div style="font-weight:700;font-size:1.1rem;color:var(--forest)">${delivered}</div><div style="font-size:0.6rem;color:var(--slate)">Done</div></div>
                </div>
            </div></div>`;
        }).join('')}
    `;
    document.getElementById('page-container').innerHTML = adminShell('drivers', content);
}
function showAddDriverForm() { document.getElementById('add-driver-form').style.display = ''; }
async function addNewDriver() {
    const name = document.getElementById('new-drv-name').value.trim();
    const email = document.getElementById('new-drv-email').value.trim();
    const phone = document.getElementById('new-drv-phone').value.trim();
    const password = document.getElementById('new-drv-pass').value;
    if (!name || !email || !password) return showToast('Fill all fields', 'error');
    try { await Store.addDriver({ name, email, phone, password }); showToast('"' + name + '" created'); renderAdminDrivers(); }
    catch (err) { showToast('Failed: ' + err.message, 'error'); }
}

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════
let analyticsUnlocked = false;

function renderAdminAnalytics() {
    if (!analyticsUnlocked) {
        const content = `
            <div class="analytics-login">
                <div class="auth-card" style="max-width:360px">
                    <div style="text-align:center;font-size:2.5rem;margin-bottom:var(--gap-sm)">📊</div>
                    <h2 style="text-align:center;font-size:1.2rem">Analytics</h2>
                    <p class="auth-sub">Enter password to continue</p>
                    <div class="form-group"><label>Password</label><input type="password" class="form-input" id="analytics-pass" value="analytics123"></div>
                    <button class="btn btn-primary btn-full" onclick="unlockAnalytics()">Unlock</button>
                    <div style="margin-top:var(--gap-sm);font-size:0.75rem;color:var(--slate);text-align:center">Demo: analytics123</div>
                </div>
            </div>
        `;
        document.getElementById('page-container').innerHTML = adminShell('analytics', content);
        return;
    }

    const orders = Store.getOrders().filter(o => o.status !== 'cancelled');

    // Store breakdown
    const storeSales = {};
    STORES.forEach(s => storeSales[s.id] = { name: s.name, emoji: s.emoji, revenue: 0, orders: 0 });
    orders.forEach(o => { if (storeSales[o.store_id]) { storeSales[o.store_id].revenue += o.total; storeSales[o.store_id].orders++; } });

    // Daily revenue
    const dayData = {};
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dayData[d.toISOString().split('T')[0]] = { revenue: 0, orders: 0 }; }
    orders.forEach(o => { const d = (o.created_at || '').split('T')[0]; if (dayData[d]) { dayData[d].revenue += o.total; dayData[d].orders++; } });
    const maxRev = Math.max(...Object.values(dayData).map(d => d.revenue), 1);

    // Payment methods
    const payMethods = { mtn: 0, cod: 0 };
    orders.forEach(o => { if (payMethods[o.payment_method] !== undefined) payMethods[o.payment_method]++; });
    const payTotal = Object.values(payMethods).reduce((s, v) => s + v, 0) || 1;

    // Top products
    const productSales = {};
    orders.forEach(o => (o.items || []).forEach(it => {
        if (!productSales[it.name]) productSales[it.name] = { name: it.name, emoji: it.emoji, qty: 0, revenue: 0 };
        productSales[it.name].qty += it.qty; productSales[it.name].revenue += it.price * it.qty;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const content = `
        <div class="admin-header"><h1 style="font-size:1.3rem">Analytics</h1></div>

        <!-- Store Revenue -->
        <div class="stats-grid" style="margin-bottom:var(--gap-md)">
            ${Object.values(storeSales).map((s, i) => `
                <div class="stat-card ${['saffron','green','terra'][i]}">
                    <div class="stat-label">${s.emoji} ${s.name.replace('Patel ','')}</div>
                    <div class="stat-value" style="font-size:1.3rem">${formatRWF(s.revenue)}</div>
                    <div class="stat-sub">${s.orders} orders</div>
                </div>
            `).join('')}
        </div>

        <!-- Daily Revenue Chart -->
        <div class="card" style="margin-bottom:var(--gap-md)">
            <div class="card-body" style="padding:14px">
                <h3 style="font-family:var(--font-body);font-weight:700;font-size:0.9rem;margin-bottom:10px">Daily Revenue (14 days)</h3>
                <div style="display:flex;align-items:flex-end;gap:3px;height:140px">
                    ${Object.entries(dayData).map(([date, d]) => `
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%">
                            <div style="flex:1"></div>
                            <div style="width:100%;border-radius:3px 3px 0 0;min-height:3px;background:${d.revenue > 0 ? 'linear-gradient(to top,var(--saffron),var(--saffron-light))' : 'var(--cream-dark)'};height:${Math.max((d.revenue / maxRev) * 100, 2)}%;transition:height .3s" title="${formatRWF(d.revenue)} · ${d.orders} orders"></div>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.65rem;color:var(--light-slate)">
                    <span>${formatDate(Object.keys(dayData)[0])}</span>
                    <span>${formatDate(Object.keys(dayData).pop())}</span>
                </div>
            </div>
        </div>

        <!-- Payment Methods -->
        <div class="card" style="margin-bottom:var(--gap-md)">
            <div class="card-body" style="padding:14px">
                <h3 style="font-family:var(--font-body);font-weight:700;font-size:0.9rem;margin-bottom:10px">Payment Methods</h3>
                ${Object.entries(payMethods).map(([m, cnt]) => `
                    <div style="margin-bottom:8px">
                        <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px">
                            <span style="font-weight:600">${m === 'mtn' ? '📱 MTN MoMo' : '💵 Cash on Delivery'}</span>
                            <span style="color:var(--slate)">${cnt} (${Math.round(cnt/payTotal*100)}%)</span>
                        </div>
                        <div style="height:6px;background:var(--cream-dark);border-radius:3px">
                            <div style="height:100%;border-radius:3px;background:${m === 'mtn' ? 'var(--saffron)' : 'var(--forest)'};width:${(cnt/payTotal)*100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Top Products -->
        <div class="card">
            <div class="card-body" style="padding:14px">
                <h3 style="font-family:var(--font-body);font-weight:700;font-size:0.9rem;margin-bottom:10px">Top Products</h3>
                ${topProducts.map((p, i) => `
                    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;${i < topProducts.length - 1 ? 'border-bottom:1px solid var(--cream-dark)' : ''}">
                        <span style="font-weight:800;font-size:0.85rem;color:var(--saffron);width:18px;text-align:center">${i+1}</span>
                        <span style="font-size:1.1rem">${p.emoji}</span>
                        <div style="flex:1;min-width:0">
                            <div style="font-size:0.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
                            <div style="font-size:0.7rem;color:var(--slate)">${p.qty} sold</div>
                        </div>
                        <span style="font-weight:700;color:var(--forest);font-size:0.82rem">${formatRWF(p.revenue)}</span>
                    </div>
                `).join('')}
                ${topProducts.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--light-slate);font-size:0.82rem">No sales data yet</div>' : ''}
            </div>
        </div>
    `;

    document.getElementById('page-container').innerHTML = adminShell('analytics', content);
}

function unlockAnalytics() {
    if (document.getElementById('analytics-pass').value === 'analytics123') {
        analyticsUnlocked = true;
        showToast('Analytics unlocked');
        renderAdminAnalytics();
    } else { showToast('Wrong password', 'error'); }
}
