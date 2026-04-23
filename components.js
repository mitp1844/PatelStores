/* ═══════════════════════════════════════════
   PATEL STORES — Shared UI Components
   ═══════════════════════════════════════════ */

function updateNav() {
    const user = Store.getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    const isDriver = user && user.role === 'driver';
    const isCustomer = user && user.role === 'customer';

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
                <div><b>Subject:</b> Order Confirmation - ${data.orderId}</div>
            </div>
            <h3>Order Confirmed! 🎉</h3>
            <p style="color:#64748B;margin-bottom:16px">Hi ${data.customerName}, your order has been received.</p>
            <div style="background:white;padding:16px;border-radius:8px;margin-bottom:16px">
                <div style="font-weight:600;margin-bottom:8px">Order #${data.orderId}</div>
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
                <div><b>Subject:</b> Order Update - ${data.orderId}</div>
            </div>
            <h3>Order Status Update</h3>
            <p>Hi ${data.customerName},</p>
            <p>Your order <b>#${data.orderId}</b> is now: <span style="background:#DCFCE7;color:#16A34A;padding:4px 12px;border-radius:20px;font-weight:600">${data.status}</span></p>
        `;
    } else if (type === 'delivery-confirmation') {
        content = `
            <div class="email-header">
                <div><b>From:</b> ${store.email}</div>
                <div><b>To:</b> ${data.customerEmail}</div>
                <div><b>Subject:</b> Delivery Completed - ${data.orderId}</div>
            </div>
            <h3>Your order has been delivered! ✅</h3>
            <p>Hi ${data.customerName},</p>
            <p>Your order <b>#${data.orderId}</b> has been delivered to:</p>
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
