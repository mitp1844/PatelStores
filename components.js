/* ═══════════════════════════════════════════
   PATEL STORES — Shared UI Components
   ═══════════════════════════════════════════ */

/**
 * Escape user-supplied text before inserting into innerHTML.
 * Prevents stored XSS (e.g. a customer name containing <script> or <img onerror>).
 * Use for ALL user/product-supplied strings rendered into HTML.
 */
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
}

/**
 * Refresh every cart-count badge on screen in place, without a full re-render.
 * The regular nav badge only exists once main-nav is visible (updateNav() hides
 * it on the home route), and the home hero has its own separate cart button/badge
 * baked into renderHome()'s markup — both need to be patched directly here so
 * adding/removing an item is reflected immediately everywhere.
 */
function updateCartBadges() {
    const count = Store.getTotalCartCount();

    const navCart = document.querySelector('#main-nav .nav-cart');
    if (navCart) {
        let badge = navCart.querySelector('.badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                navCart.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    const heroCart = document.querySelector('.mk-hero-cart');
    if (heroCart) {
        let badge = heroCart.querySelector('.mk-cart-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'mk-cart-badge';
                heroCart.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }
}

// ═══════════════════════════════════════════
// FLOATING CART BAR — persistent bottom pill shown while
// browsing (home/store/product) so the cart is always one tap away.
// ═══════════════════════════════════════════
function renderFloatingCart() {
    updateCartBadges();

    let bar = document.getElementById('mk-float-cart');

    const user = Store.getCurrentUser();
    const isStaff = user && (user.role === 'admin' || user.role === 'driver');
    const showOnRoutes = ['home', 'store', 'product'];
    const storeId = (typeof selectedStoreId !== 'undefined' && selectedStoreId) || (STORES[0] && STORES[0].id);
    const shouldShow = !isStaff && showOnRoutes.includes(currentRoute) && storeId;

    const cart = shouldShow ? Store.getCart(storeId) : [];
    const pageContainer = document.getElementById('page-container');

    if (!shouldShow || cart.length === 0) {
        if (bar) bar.remove();
        if (pageContainer) pageContainer.classList.remove('has-float-cart');
        return;
    }
    if (pageContainer) pageContainer.classList.add('has-float-cart');

    const products = Store.getProducts();
    let count = 0, total = 0;
    cart.forEach(ci => {
        const p = products.find(pr => pr.id === ci.productId);
        if (!p) return;
        count += ci.qty;
        total += p.price * ci.qty;
    });

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'mk-float-cart';
        bar.className = 'mk-float-cart';
        bar.onclick = () => navigate('cart');
        document.body.appendChild(bar);
    }
    bar.innerHTML = `
        <div class="mk-float-cart-info">
            <span class="mk-float-cart-count">${count} item${count !== 1 ? 's' : ''} in cart</span>
            <span class="mk-float-cart-total">${formatRWF(total)}</span>
        </div>
        <button class="mk-float-cart-btn" onclick="event.stopPropagation();navigate('cart')">
            View Cart
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
    `;
}

function updateNav() {
    const user = Store.getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    const isDriver = user && user.role === 'driver';
    const isCustomer = user && user.role === 'customer';

    const mainNav = document.getElementById('main-nav');

    // On the customer/guest HOME page, hide the top nav entirely —
    // the immersive hero carries the brand, store picker, cart and sign-in.
    if (!isAdmin && !isDriver && currentRoute === 'home') {
        mainNav.style.display = 'none';
        const footer = document.getElementById('main-footer');
        if (footer) footer.style.display = '';
        return;
    }
    mainNav.style.display = '';

    let links = '';
    let rightSection = '';

    if (isAdmin) {
        links = `
            <a href="#" onclick="navigate('admin');return false" class="${currentRoute==='admin'?'active':''}">Dashboard</a>
            <a href="#" onclick="navigate('admin-orders');return false" class="${currentRoute==='admin-orders'?'active':''}">Orders</a>
            <a href="#" onclick="navigate('admin-payments');return false" class="${currentRoute==='admin-payments'?'active':''}">Payments</a>
            <a href="#" onclick="navigate('admin-products');return false" class="${currentRoute==='admin-products'||currentRoute==='admin-categories'?'active':''}">Products</a>
            <a href="#" onclick="navigate('admin-customers');return false" class="${currentRoute==='admin-customers'?'active':''}">Customers</a>
            <a href="#" onclick="navigate('admin-drivers');return false" class="${currentRoute==='admin-drivers'?'active':''}">Drivers</a>
            <a href="#" onclick="navigate('admin-analytics');return false" class="${currentRoute==='admin-analytics'?'active':''}">Analytics</a>
        `;
        rightSection = `
            <div class="nav-avatar" title="${user.name}">A</div>
            <button class="btn btn-ghost btn-sm" onclick="doLogout()">Sign Out</button>
        `;
    } else if (isDriver) {
        links = `<a href="#" onclick="navigate('driver');return false" class="active">My Deliveries</a>`;
        rightSection = `
            <div class="nav-avatar" title="${user.name}">D</div>
            <button class="btn btn-ghost btn-sm" onclick="doLogout()">Sign Out</button>
        `;
    } else {
        links = `
            <a href="#" onclick="navigate('home');return false" class="${currentRoute==='home'?'active':''}">Home</a>
            ${STORES.map(s => `<a href="#" onclick="navigate('store',{id:'${s.id}'});return false" class="${currentRoute==='store'&&routeParams.id===s.id?'active':''}">${s.name.replace('Patel ','')}</a>`).join('')}
        `;
        const cartCount = Store.getTotalCartCount();
        if (isCustomer) {
            rightSection = `
                <a href="#" onclick="navigate('my-orders');return false" class="btn btn-ghost btn-sm">My Orders</a>
                <button class="nav-cart" onclick="navigate('cart')">🛒 Cart ${cartCount > 0 ? `<span class="badge">${cartCount}</span>` : ''}</button>
                <div class="nav-avatar" title="${user.name}">${user.name.charAt(0)}</div>
                <button class="btn btn-ghost btn-sm" onclick="doLogout()">Sign Out</button>
            `;
        } else {
            rightSection = `
                <button class="nav-cart" onclick="navigate('cart')">🛒 Cart ${cartCount > 0 ? `<span class="badge">${cartCount}</span>` : ''}</button>
                <a href="#" onclick="navigate('login');return false" class="btn btn-outline btn-sm">Sign In</a>
            `;
        }
    }

    document.getElementById('main-nav').innerHTML = `
        <div class="nav-inner">
            <a class="nav-brand" href="#" onclick="navigate(${isAdmin ? "'admin'" : isDriver ? "'driver'" : "'home'"});return false">
                <div class="logo-mark">P</div>
                <span class="nav-brand-text">Patel Stores</span>
            </a>
            <button class="nav-hamburger" onclick="document.querySelector('.nav-links').classList.toggle('open')">
                <span></span><span></span><span></span>
            </button>
            <div class="nav-links">${links}</div>
            <div class="nav-user">${rightSection}</div>
        </div>
    `;

    const footer = document.getElementById('main-footer');
    footer.style.display = (isAdmin || isDriver) ? 'none' : '';
}

async function doLogout() {
    await Store.logout();
    navigate('home');
    showToast('Signed out successfully', 'info');
}

/**
 * Show the admin-managed flyer popup(s) to a visitor, if any flyers are active.
 * Called once per app load for guest/customer sessions (not admin/driver).
 */
function maybeShowFlyerPopup() {
    const flyers = Store.getActiveFlyers();
    if (!flyers.length) return;

    const html = flyers.map((f, i) => `
        <div ${i > 0 ? 'style="margin-top:20px;padding-top:20px;border-top:1px solid var(--cream-dark)"' : ''}>
            ${f.image ? `<img src="${esc(f.image)}" style="width:100%;border-radius:var(--radius-md);margin-bottom:12px;object-fit:cover;max-height:320px">` : ''}
            ${f.title ? `<h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:6px">${esc(f.title)}</h3>` : ''}
            ${f.body ? `<p style="color:var(--slate);font-size:0.92rem;white-space:pre-wrap">${esc(f.body)}</p>` : ''}
        </div>
    `).join('');

    document.getElementById('flyer-modal-content').innerHTML = html;
    document.getElementById('flyer-modal').style.display = 'flex';
}

function closeFlyerModal() {
    document.getElementById('flyer-modal').style.display = 'none';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let otpEmail = '';
let otpType = 'signup';
let otpCallback = null;
let otpInterval = null;

function showOtpModal(email, type, callback) {
    otpEmail = email;
    otpType = type;
    otpCallback = callback;
    const modal = document.getElementById('otp-modal');
    modal.style.display = 'flex';
    document.querySelector('.otp-sub').textContent = 'Enter the 6-digit code sent to ' + email;
    const inputsDiv = document.getElementById('otp-inputs');
    inputsDiv.innerHTML = Array(6).fill(0).map((_, i) =>
        `<input type="text" maxlength="1" class="otp-digit" data-idx="${i}" oninput="onOtpInput(this)" onkeydown="onOtpKeydown(event, this)">`
    ).join('');
    setTimeout(() => inputsDiv.querySelector('input').focus(), 100);
    let seconds = 300;
    clearInterval(otpInterval);
    otpInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        document.getElementById('otp-countdown').textContent = `${m}:${String(s).padStart(2, '0')}`;
        if (seconds <= 0) { clearInterval(otpInterval); showToast('OTP expired.', 'error'); }
    }, 1000);
}

function onOtpInput(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
    if (el.value && el.dataset.idx < 5) { el.nextElementSibling && el.nextElementSibling.focus(); }
}
function onOtpKeydown(e, el) {
    if (e.key === 'Backspace' && !el.value && el.dataset.idx > 0) { el.previousElementSibling && el.previousElementSibling.focus(); }
}

async function verifyOtp() {
    const digits = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');
    if (digits.length !== 6) return showToast('Please enter all 6 digits', 'error');
    try {
        const { data, error } = await sb.auth.verifyOtp({ email: otpEmail, token: digits, type: otpType });
        if (error) return showToast(error.message, 'error');
        clearInterval(otpInterval);
        closeOtpModal();
        showToast('Verification successful!', 'success');
        if (otpCallback) otpCallback(data);
    } catch (err) {
        showToast('Verification failed: ' + err.message, 'error');
    }
}

async function resendOtp() {
    try {
        if (otpType === 'signup') { await sb.auth.resend({ type: 'signup', email: otpEmail }); }
        else { await sb.auth.signInWithOtp({ email: otpEmail }); }
        showToast('New code sent to ' + otpEmail, 'info');
    } catch (err) { showToast('Failed to resend: ' + err.message, 'error'); }
}

function closeOtpModal() {
    document.getElementById('otp-modal').style.display = 'none';
    clearInterval(otpInterval);
}

function showEmailPreview(type, data) {
    const store = STORES.find(s => s.id === data.storeId) || STORES[0];
    let content = '';
    if (type === 'order-confirmation') {
        const itemsHtml = data.items.map(it =>
            `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee"><span>${it.emoji} ${it.name} x${it.qty}</span><span>${formatRWF(it.price * it.qty)}</span></div>`
        ).join('');
        content = `
            <div class="email-header">
                <div><b>From:</b> ${store.email}</div>
                <div><b>To:</b> ${data.customerEmail}</div>
                <div><b>Subject:</b> Order Confirmation - ${data.orderId || data.id}</div>
            </div>
            <h3>Order Confirmed! 🎉</h3>
            <p style="color:#64748B;margin-bottom:16px">Hi ${data.customerName}, your order has been received.</p>
            <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px">
                <div style="font-weight:600;margin-bottom:8px">Order #${data.orderId || data.id}</div>
                <div style="font-size:0.85rem;color:#64748B">Store: ${store.name}</div>
                <div style="font-size:0.85rem;color:#64748B">Delivery: ${data.customerAddress}</div>
            </div>
            <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px">
                ${itemsHtml}
                <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-weight:700;font-size:1.1rem;color:#2D6A4F">
                    <span>Total</span><span>${formatRWF(data.total)}</span>
                </div>
            </div>
            <p style="font-size:0.85rem;color:#64748B;text-align:center">Questions? Contact us at ${store.phone}</p>
        `;
    } else if (type === 'status-update') {
        content = `
            <div class="email-header">
                <div><b>From:</b> ${store.email}</div>
                <div><b>To:</b> ${data.customerEmail}</div>
                <div><b>Subject:</b> Order Update - ${data.orderId || data.id}</div>
            </div>
            <h3>Order Status Update</h3>
            <p>Hi ${data.customerName},</p>
            <p>Your order <b>#${data.orderId || data.id}</b> is now: <span style="background:#DCFCE7;color:#16A34A;padding:4px 12px;border-radius:20px;font-weight:600">${data.status}</span></p>
        `;
    } else if (type === 'delivery-confirmation') {
        content = `
            <div class="email-header">
                <div><b>From:</b> ${store.email}</div>
                <div><b>To:</b> ${data.customerEmail}</div>
                <div><b>Subject:</b> Delivery Completed - ${data.orderId || data.id}</div>
            </div>
            <h3>Your order has been delivered! ✅</h3>
            <p>Hi ${data.customerName},</p>
            <p>Your order <b>#${data.orderId || data.id}</b> has been delivered to:</p>
            <p style="background:white;padding:12px;border-radius:8px;font-weight:500">📍 ${data.customerAddress}</p>
            <p style="margin-top:12px;color:#64748B">Thank you for choosing ${store.name}!</p>
        `;
    }
    document.getElementById('email-preview-content').innerHTML = content;
    document.getElementById('email-modal').style.display = 'flex';
}

function statusTag(status) {
    const labels = {
        'awaiting-payment': 'Awaiting Payment',
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'delivering': 'Delivering',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return `<span class="tag tag-${status}">${labels[status] || status}</span>`;
}

function paymentLabel(method) {
    const labels = { mtn: '📱 MTN MoMo', cod: '💵 Cash on Delivery' };
    return labels[method] || method;
}

// ═══════════════════════════════════════════
// PDF INVOICE GENERATOR
// ═══════════════════════════════════════════

// Cache the logo as base64 so we only fetch it once
let _logoDataUrl = null;
async function _getLogoDataUrl() {
    if (_logoDataUrl) return _logoDataUrl;
    try {
        const res = await fetch('icons/icon-512x512.png');
        const blob = await res.blob();
        _logoDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        return _logoDataUrl;
    } catch (e) {
        console.warn('Logo load failed, using fallback', e);
        return null;
    }
}

async function viewInvoice(orderId) {
    const order = Store.getOrders().find(o => o.id === orderId);
    if (!order) { showToast('Order not found', 'error'); return; }
    if (!window.jspdf) { showToast('PDF library still loading, try again', 'error'); return; }

    const store = STORES.find(s => s.id === order.store_id) || STORES[0];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 15;

    // ── Brand colors ──
    const forest = [45, 106, 79];
    const coffee = [61, 47, 38];
    const slate = [100, 116, 139];
    const cream = [247, 243, 237];

    // ── HEADER BAR ──
    doc.setFillColor(...forest);
    doc.rect(0, 0, pageW, 38, 'F');

    // Real logo (white rounded tile behind it for contrast)
    const logo = await _getLogoDataUrl();
    if (logo) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, 8, 22, 22, 3, 3, 'F');
        try { doc.addImage(logo, 'PNG', margin + 2, 10, 18, 18); } catch (e) { /* ignore */ }
    } else {
        // Fallback: drawn "P" circle
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 8, 19, 8, 'F');
        doc.setTextColor(...forest);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('P', margin + 8, 23, { align: 'center' });
    }

    // Store name + tagline
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Patel Stores', margin + 26, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Fresh groceries delivered in Kigali', margin + 26, 24);

    // INVOICE label (right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('INVOICE', pageW - margin, 20, { align: 'right' });

    // ── STORE + INVOICE META ──
    let y = 50;
    doc.setTextColor(...coffee);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(store.name, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...slate);
    doc.text(store.address, margin, y + 5);
    doc.text('Tel: ' + store.phone, margin, y + 10);
    doc.text('Email: ' + store.email, margin, y + 15);

    // Invoice details (right side)
    doc.setTextColor(...coffee);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Invoice #:', pageW - margin - 45, y);
    doc.text('Date:', pageW - margin - 45, y + 5);
    doc.text('Status:', pageW - margin - 45, y + 10);
    doc.text('Payment:', pageW - margin - 45, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate);
    doc.text(String(order.id), pageW - margin, y, { align: 'right' });
    doc.text(formatDateTime(order.created_at), pageW - margin, y + 5, { align: 'right' });
    doc.text(String(order.status || 'pending').toUpperCase(), pageW - margin, y + 10, { align: 'right' });
    const payLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'MTN Mobile Money';
    doc.text(payLabel, pageW - margin, y + 15, { align: 'right' });

    // ── BILL TO ──
    y = 78;
    const hasBusiness = order.business_name || order.tin_number;
    const billBoxH = hasBusiness ? 34 : 24;
    doc.setFillColor(...cream);
    doc.rect(margin, y, pageW - margin * 2, billBoxH, 'F');
    doc.setTextColor(...forest);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BILL TO', margin + 4, y + 6);
    doc.setTextColor(...coffee);
    doc.setFontSize(10);
    let by = y + 12;
    // Business name shown prominently if present, else customer name
    if (order.business_name) {
        doc.setFont('helvetica', 'bold');
        doc.text(order.business_name, margin + 4, by);
        by += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...slate);
        doc.text('Attn: ' + (order.customer_name || 'Guest'), margin + 4, by);
        by += 5;
    } else {
        doc.text(order.customer_name || 'Guest', margin + 4, by);
        by += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...slate);
    }
    if (order.tin_number) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...coffee);
        doc.text('TIN: ' + order.tin_number, margin + 4, by);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...slate);
        by += 5;
    }
    doc.setFontSize(9);
    doc.setTextColor(...slate);
    doc.text('Phone: ' + (order.customer_phone || 'N/A'), margin + 4, by);
    by += 5;
    doc.text('Address: ' + (order.customer_address || 'N/A'), margin + 4, by);

    // ── ITEMS TABLE ──
    // Shift table down if business box is taller
    const tableShift = hasBusiness ? 10 : 0;
    y = 112 + tableShift;
    // Table header
    doc.setFillColor(...forest);
    doc.rect(margin, y, pageW - margin * 2, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ITEM', margin + 3, y + 6);
    doc.text('QTY', pageW - margin - 60, y + 6, { align: 'center' });
    doc.text('PRICE', pageW - margin - 35, y + 6, { align: 'right' });
    doc.text('TOTAL', pageW - margin - 3, y + 6, { align: 'right' });

    // Table rows
    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...coffee);
    doc.setFontSize(9);
    let subtotal = 0;
    (order.items || []).forEach((it, i) => {
        const lineTotal = it.price * it.qty;
        subtotal += lineTotal;
        if (i % 2 === 0) {
            doc.setFillColor(250, 248, 245);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
        }
        // Truncate long names
        let name = it.name || '';
        if (name.length > 45) name = name.substring(0, 43) + '..';
        doc.text(name, margin + 3, y + 5.5);
        doc.text(String(it.qty), pageW - margin - 60, y + 5.5, { align: 'center' });
        doc.text(formatRWF(it.price), pageW - margin - 35, y + 5.5, { align: 'right' });
        doc.text(formatRWF(lineTotal), pageW - margin - 3, y + 5.5, { align: 'right' });
        y += 8;
    });

    // ── TOTALS ──
    y += 4;
    const delivery = order.total - subtotal;
    doc.setDrawColor(...slate);
    doc.setLineWidth(0.2);
    doc.line(pageW - margin - 70, y, pageW - margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(...slate);
    doc.text('Subtotal:', pageW - margin - 70, y);
    doc.text(formatRWF(subtotal), pageW - margin - 3, y, { align: 'right' });
    y += 6;
    doc.text('Delivery Fee:', pageW - margin - 70, y);
    doc.text(delivery === 0 ? 'FREE' : formatRWF(delivery), pageW - margin - 3, y, { align: 'right' });
    y += 8;
    // Grand total box
    doc.setFillColor(...forest);
    doc.rect(pageW - margin - 73, y - 5, 73, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', pageW - margin - 70, y + 1.5);
    doc.text(formatRWF(order.total), pageW - margin - 3, y + 1.5, { align: 'right' });

    // ── FOOTER ──
    const footerY = 275;
    doc.setDrawColor(...cream);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 6, pageW - margin, footerY - 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...forest);
    doc.text('Thank you for shopping with Patel Stores!', pageW / 2, footerY, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(...slate);
    doc.text('Questions? Contact us at ' + store.phone + '  |  patelstoresrw.com', pageW / 2, footerY + 5, { align: 'center' });

    // Save
    // Instead of saving directly, show a preview the user can view then download
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const fileName = 'Invoice-' + order.id + '.pdf';

    const content = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
            <div>
                <div style="font-weight:700;font-size:1rem;color:var(--coffee)">Invoice ${order.id}</div>
                <div style="font-size:0.8rem;color:var(--slate)">${order.customer_name || 'Guest'} · ${formatRWF(order.total)}</div>
            </div>
            <button class="btn btn-primary" onclick="_saveInvoicePdf('${pdfUrl}','${fileName}')">⬇ Download PDF</button>
        </div>
        <iframe src="${pdfUrl}" style="width:100%;height:60vh;border:1px solid var(--cream-dark);border-radius:8px" title="Invoice preview"></iframe>
    `;
    document.getElementById('invoice-preview-content').innerHTML = content;
    document.getElementById('invoice-modal').style.display = 'flex';
}

// Trigger the actual file download from the preview
function _saveInvoicePdf(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Invoice downloaded!', 'success');
}

// Backward-compatible alias (older buttons may call downloadInvoice)
const downloadInvoice = viewInvoice;

// Close invoice modal and free the blob URL
function _closeInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    const iframe = modal.querySelector('iframe');
    if (iframe && iframe.src.startsWith('blob:')) {
        try { URL.revokeObjectURL(iframe.src); } catch (e) {}
    }
    modal.style.display = 'none';
    document.getElementById('invoice-preview-content').innerHTML = '';
}
