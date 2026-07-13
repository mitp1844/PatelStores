const STORE_MOMO_CODES = {
    'supermarket': '004305',
    'grocers': '1602698',
    'shop': '051368'
};

// Track selected store globally — default to grocers
let selectedStoreId = localStorage.getItem('patel-selected-store') || 'grocers';

function setSelectedStore(storeId) {
    selectedStoreId = storeId;
    localStorage.setItem('patel-selected-store', storeId);
}

// ═══════════════════════════════════════════
// HOME — Instacart / Jumia-style curated layout
// ═══════════════════════════════════════════
window._allHomeProducts = [];
window._homeStoreId = '';
window._loadMoreOffset = 100;
window._homeCategory = 'all';

function renderHome() {
    const container = document.getElementById('page-container');
    const store = STORES.find(s => s.id === selectedStoreId) || STORES[0];
    const allProducts = Store.getProducts().filter(p => p.stores && p.stores.includes(selectedStoreId));
    const categories = Store.getCategories().filter(c => c.id !== 'all');

    window._allHomeProducts = allProducts;
    window._homeStoreId = selectedStoreId;
    window._loadMoreOffset = 100;
    window._homeCategory = 'all';
    window._filteredHomeProducts = null;

    // Organize products by category
    const byCat = {};
    allProducts.forEach(p => {
        if (!byCat[p.category]) byCat[p.category] = [];
        byCat[p.category].push(p);
    });

    // Categories that have products, sorted by count
    const activeCats = categories.filter(c => byCat[c.id] && byCat[c.id].length > 0)
        .sort((a, b) => (byCat[b.id]?.length || 0) - (byCat[a.id]?.length || 0));

    // Featured = products with images, 1 per category
    const featured = [];
    const seenCat = new Set();
    for (const p of allProducts) {
        if (Array.isArray(p.images) && p.images.length > 0 && !seenCat.has(p.category)) {
            featured.push(p);
            seenCat.add(p.category);
        }
        if (featured.length >= 10) break;
    }
    // Fill remaining with any imaged products
    if (featured.length < 10) {
        for (const p of allProducts) {
            if (Array.isArray(p.images) && p.images.length > 0 && !featured.includes(p)) {
                featured.push(p);
                if (featured.length >= 10) break;
            }
        }
    }

    container.innerHTML = `
        <!-- ═══ DELIVERY BANNER ═══ -->
        <div class="hm-delivery-bar">
            🚗 Free delivery on orders over <b>RWF 15,000</b> in Kigali
        </div>

        <!-- ═══ STORE PICKER + SEARCH ═══ -->
        <div class="hm-search-section">
            <div class="hm-search-row">
                <div class="hm-location">
                    <span class="hm-location-icon">📍</span>
                    <select id="store-picker" onchange="switchStore(this.value)" class="hm-store-select">
                        ${STORES.map(s => `<option value="${s.id}" ${s.id === selectedStoreId ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                    <span class="hm-store-hours">${store.hours}</span>
                </div>
            </div>
            <div class="hm-search-box">
                <span class="hm-search-icon">🔍</span>
                <input type="text" id="home-search" placeholder="Search ${allProducts.length.toLocaleString()} products..."
                    oninput="filterHomeProducts()" onfocus="homeShowSearch()">
            </div>
        </div>

        <!-- ═══ SEARCH RESULTS (hidden by default) ═══ -->
        <div id="hm-search-results" style="display:none">
            <div style="padding:8px 16px">
                <button class="btn btn-ghost btn-sm" onclick="homeClearSearch()" style="margin-bottom:8px">← Back to Home</button>
                <span style="font-size:0.82rem;color:var(--slate)" id="product-count"></span>
            </div>
            <div style="padding:0 12px 24px">
                <div class="product-grid" id="products-grid"></div>
                <div id="load-more-wrap" style="display:none;text-align:center;padding:16px 0">
                    <span style="font-size:0.78rem;color:var(--slate)" id="shown-count"></span><br>
                    <button onclick="loadMoreProducts()" class="btn btn-primary" style="margin-top:8px;padding:10px 32px;font-size:0.85rem">View More</button>
                </div>
            </div>
        </div>

        <!-- ═══ CURATED HOME (visible by default) ═══ -->
        <div id="hm-home-content">

            <!-- CATEGORY CIRCLES — auto-scrolling showcase -->
            <div class="hm-categories">
                <div class="hm-cat-scroll">
                    ${activeCats.map(c => {
                        const img = _catThumb(c.id, allProducts);
                        return `
                        <div class="hm-cat-item" onclick="homeBrowseCategory('${c.id}')">
                            <div class="hm-cat-circle">${img ? `<img src="${img}" alt="${c.name}">` : `<span>${c.emoji}</span>`}</div>
                            <div class="hm-cat-name">${c.name}</div>
                        </div>`;
                    }).join('')}
                    ${activeCats.map(c => {
                        const img = _catThumb(c.id, allProducts);
                        return `
                        <div class="hm-cat-item" onclick="homeBrowseCategory('${c.id}')">
                            <div class="hm-cat-circle">${img ? `<img src="${img}" alt="${c.name}">` : `<span>${c.emoji}</span>`}</div>
                            <div class="hm-cat-name">${c.name}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- CATEGORY CHIPS — static, manually scrollable with arrows -->
            <div class="hm-cat-bar-wrap">
                <button class="hm-cat-arrow hm-cat-arrow-left" onclick="document.getElementById('hm-cat-bar').scrollBy({left:-150,behavior:'smooth'})">‹</button>
                <div class="hm-cat-bar" id="hm-cat-bar">
                    <button class="hm-chip active" onclick="homeBrowseAll(); document.querySelectorAll('.hm-chip').forEach(c=>c.classList.remove('active')); this.classList.add('active')">🛍️ All</button>
                    ${activeCats.map(c => `
                        <button class="hm-chip" onclick="homeBrowseCategory('${c.id}'); document.querySelectorAll('.hm-chip').forEach(c=>c.classList.remove('active')); this.classList.add('active')">${c.emoji} ${c.name}</button>
                    `).join('')}
                </div>
                <button class="hm-cat-arrow hm-cat-arrow-right" onclick="document.getElementById('hm-cat-bar').scrollBy({left:150,behavior:'smooth'})">›</button>
            </div>

            <!-- FEATURED PICKS -->
            ${featured.length > 0 ? `
            <div class="hm-row">
                <div class="hm-row-header">
                    <h3>⭐ Featured Picks</h3>
                </div>
                <div class="hm-scroll-track">
                    ${featured.map(p => _scrollCard(p, selectedStoreId)).join('')}
                </div>
            </div>` : ''}

            <!-- PER-CATEGORY ROWS -->
            ${activeCats.map(c => {
                const items = byCat[c.id] || [];
                if (items.length === 0) return '';
                const display = items.slice(0, 12);
                return `
                <div class="hm-row">
                    <div class="hm-row-header">
                        <h3>${c.emoji} ${c.name}</h3>
                        <button class="btn btn-ghost btn-sm" onclick="homeBrowseCategory('${c.id}')" style="font-size:0.78rem;color:var(--terracotta)">
                            See all ${items.length} →
                        </button>
                    </div>
                    <div class="hm-scroll-track">
                        ${display.map(p => _scrollCard(p, selectedStoreId)).join('')}
                    </div>
                </div>`;
            }).join('')}

            <!-- PROMO BANNER — bottom CTA -->
            <div class="hm-promo">
                <div class="hm-promo-card">
                    <div class="hm-promo-text">
                        <div class="hm-promo-tag">Now Open</div>
                        <div class="hm-promo-title">Shop all 3 Patel Stores online</div>
                        <div class="hm-promo-sub">Supermarket · Grocers · Shop — browse from anywhere, pay with MTN MoMo or cash</div>
                        <button class="btn btn-primary btn-sm" onclick="homeBrowseAll()" style="margin-top:10px">Browse All →</button>
                    </div>
                    <div class="hm-promo-emoji">🛒</div>
                </div>
            </div>

            <!-- STORE INFO -->
            <div class="hm-stores-section">
                <h3>📍 Our Stores in Kigali</h3>
                <div class="hm-stores-row">
                    ${STORES.map(s => `
                        <div class="hm-store-card ${s.id === selectedStoreId ? 'active' : ''}" onclick="switchStore('${s.id}')">
                            <div class="hm-store-emoji">${s.emoji}</div>
                            <div class="hm-store-name">${s.name}</div>
                            <div class="hm-store-detail">📍 ${s.address.replace(', Rwanda','')}</div>
                            <div class="hm-store-detail" style="color:var(--forest)">🕐 ${s.hours}</div>
                            <div class="hm-store-detail">📱 ${s.phone}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ── Helpers for curated home ──
function _catThumb(catId, products) {
    const p = products.find(pr => pr.category === catId && Array.isArray(pr.images) && pr.images.length > 0);
    return p ? p.images[0] : null;
}

function _scrollCard(product, storeId) {
    const imgs = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
    const imgHtml = imgs.length > 0
        ? `<img src="${imgs[0]}" alt="${product.name}">`
        : `<span class="hm-card-emoji">${product.emoji}</span>`;
    const oos = product.stock === 0;
    return `
        <div class="hm-card" onclick="navigate('product',{id:'${product.id}',storeId:'${storeId}'})">
            <div class="hm-card-img">
                ${imgHtml}
                ${oos ? '<div class="hm-card-oos">Sold Out</div>' : ''}
            </div>
            <div class="hm-card-body">
                <div class="hm-card-name">${product.name}</div>
                <div class="hm-card-price">${formatRWF(product.price)}</div>
                <button class="hm-add-btn" onclick="event.stopPropagation();addProductToCart('${storeId}','${product.id}')"
                    ${oos ? 'disabled' : ''}>
                    ${oos ? 'Sold Out' : '+'}
                </button>
            </div>
        </div>`;
}

function homeShowSearch() {
    // If user focuses search, show search results view
    const q = document.getElementById('home-search')?.value || '';
    if (q.length > 0) {
        _homeShowSearchResults();
    }
}

function _homeShowSearchResults() {
    document.getElementById('hm-home-content').style.display = 'none';
    document.getElementById('hm-search-results').style.display = '';
}

function homeClearSearch() {
    document.getElementById('home-search').value = '';
    document.getElementById('hm-home-content').style.display = '';
    document.getElementById('hm-search-results').style.display = 'none';
}

function homeBrowseCategory(catId) {
    // Show search results filtered to a category
    window._homeCategory = catId;
    window._filteredHomeProducts = window._allHomeProducts.filter(p => p.category === catId);
    window._loadMoreOffset = 100;

    _homeShowSearchResults();
    const cat = Store.getCategories().find(c => c.id === catId);
    const grid = document.getElementById('products-grid');
    grid.innerHTML = window._filteredHomeProducts.slice(0, 100).map(p => productCard(p, window._homeStoreId)).join('');
    document.getElementById('product-count').textContent = `${cat ? cat.emoji + ' ' + cat.name : ''} — ${window._filteredHomeProducts.length} products`;

    const wrap = document.getElementById('load-more-wrap');
    if (window._filteredHomeProducts.length > 100) {
        wrap.style.display = '';
        document.getElementById('shown-count').textContent = `Showing 100 of ${window._filteredHomeProducts.length}`;
    } else {
        wrap.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function homeBrowseAll() {
    window._homeCategory = 'all';
    window._filteredHomeProducts = null;
    window._loadMoreOffset = 100;

    _homeShowSearchResults();
    const grid = document.getElementById('products-grid');
    grid.innerHTML = window._allHomeProducts.slice(0, 100).map(p => productCard(p, window._homeStoreId)).join('');
    document.getElementById('product-count').textContent = `${window._allHomeProducts.length} products`;

    const wrap = document.getElementById('load-more-wrap');
    if (window._allHomeProducts.length > 100) {
        wrap.style.display = '';
        document.getElementById('shown-count').textContent = `Showing 100 of ${window._allHomeProducts.length}`;
    } else {
        wrap.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchStore(storeId) {
    setSelectedStore(storeId);
    renderHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterHomeCategory(catId, btn) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    window._homeCategory = catId;

    // Re-filter from the full product list and reset pagination
    const q = document.getElementById('home-search').value.toLowerCase();
    let filtered = catId === 'all'
        ? window._allHomeProducts
        : window._allHomeProducts.filter(p => p.category === catId);
    if (q) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    const grid = document.getElementById('products-grid');
    grid.innerHTML = filtered.slice(0, 100).map(p => productCard(p, window._homeStoreId)).join('');
    document.getElementById('product-count').textContent = filtered.length + ' products';

    // Update or remove Load More button
    const wrap = document.getElementById('load-more-wrap');
    if (filtered.length > 100) {
        if (wrap) {
            document.getElementById('shown-count').textContent = `Showing 100 of ${filtered.length}`;
            wrap.style.display = '';
        }
    } else {
        if (wrap) wrap.style.display = 'none';
    }
    window._loadMoreOffset = 100;
    window._filteredHomeProducts = filtered;
}

function filterHomeProducts() {
    const q = document.getElementById('home-search').value.toLowerCase().trim();

    if (!q) {
        // Back to curated home
        homeClearSearch();
        return;
    }

    // Show search results view
    _homeShowSearchResults();

    const filtered = window._allHomeProducts.filter(p => p.name.toLowerCase().includes(q));
    window._filteredHomeProducts = filtered;
    window._loadMoreOffset = 100;

    const grid = document.getElementById('products-grid');
    grid.innerHTML = filtered.slice(0, 100).map(p => productCard(p, window._homeStoreId)).join('');
    document.getElementById('product-count').textContent = `${filtered.length} results for "${q}"`;

    const wrap = document.getElementById('load-more-wrap');
    if (filtered.length > 100) {
        wrap.style.display = '';
        document.getElementById('shown-count').textContent = `Showing 100 of ${filtered.length}`;
    } else {
        wrap.style.display = 'none';
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try a different search term</p>
            </div>`;
    }
}

function loadMoreProducts() {
    // Use filtered list if search/category is active, otherwise full list
    const products = window._filteredHomeProducts || window._allHomeProducts;
    const grid = document.getElementById('products-grid');
    const next = products.slice(window._loadMoreOffset, window._loadMoreOffset + 100);
    next.forEach(p => grid.insertAdjacentHTML('beforeend', productCard(p, window._homeStoreId)));
    window._loadMoreOffset += 100;

    const shown = Math.min(window._loadMoreOffset, products.length);
    const wrap = document.getElementById('load-more-wrap');
    if (shown >= products.length) {
        if (wrap) wrap.style.display = 'none';
    } else {
        document.getElementById('shown-count').textContent = `Showing ${shown} of ${products.length}`;
    }
}

// ═══════════════════════════════════════════
// STORE PAGE — Same as home but for direct nav
// ═══════════════════════════════════════════
function renderStorePage(storeId) {
    setSelectedStore(storeId);
    renderHome();
}

// ═══════════════════════════════════════════
// PRODUCT CARD
// ═══════════════════════════════════════════
function productCard(product, storeId) {
    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    const imgContent = images.length > 0 ? `<img src="${images[0]}" alt="${product.name}">` : product.emoji;
    const photoCount = images.length > 1 ? `<div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.5);color:white;border-radius:var(--radius-full);padding:1px 6px;font-size:0.65rem">📷 ${images.length}</div>` : '';
    const isOutOfStock = product.stock === 0;
    return `
        <div class="product-card" data-category="${product.category}" data-name="${product.name.toLowerCase()}" onclick="navigate('product',{id:'${product.id}',storeId:'${storeId}'})">
            <div class="product-img" style="position:relative">
                ${imgContent}
                ${photoCount}
                ${isOutOfStock ? '<div style="position:absolute;inset:0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:var(--red)">SOLD OUT</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatRWF(product.price)}</div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();addProductToCart('${storeId}','${product.id}')" ${isOutOfStock ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>
                        ${isOutOfStock ? 'Sold Out' : '+ Add'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addProductToCart(storeId, productId) {
    Store.addToCart(storeId, productId);
    updateNav();
    const prod = Store.getProduct(productId);
    showToast(`${prod.emoji} ${prod.name} added!`);
}

// ═══════════════════════════════════════════
// PRODUCT DETAIL
// ═══════════════════════════════════════════
function renderProductDetail(productId, storeId) {
    const product = Store.getProduct(productId);
    const store = STORES.find(s => s.id === storeId) || STORES[0];
    if (!product) return navigate('home');

    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    const stockLabel = product.stock === 0
        ? `<span style="color:var(--red);font-weight:700">❌ Out of Stock</span>`
        : product.stock <= 5 && product.stock != null
        ? `<span style="color:var(--orange);font-weight:700">⚠️ Only ${product.stock} left!</span>`
        : `<span style="color:var(--forest);font-weight:700">✅ In Stock</span>`;

    const container = document.getElementById('page-container');
    window.scrollTo({ top: 0, behavior: 'instant' });
    container.innerHTML = `
        <div style="max-width:1000px;margin:0 auto">
            <!-- Back button -->
            <div style="padding:10px 12px">
                <button class="btn btn-ghost btn-sm" onclick="navigateBack()" style="padding:6px 10px;font-size:0.82rem">← Back</button>
            </div>

            <div class="product-detail-grid" style="padding:0 12px">
                <!-- Images -->
                <div>
                    <div style="width:100%;height:400px;border-radius:var(--radius-md);overflow:hidden;background:var(--cream);display:flex;align-items:center;justify-content:center;margin-bottom:8px;padding:12px">
                        ${images.length > 0
                            ? `<img src="${images[0]}" style="max-width:100%;max-height:100%;object-fit:contain" id="main-photo-img">`
                            : `<span style="font-size:6rem">${product.emoji}</span>`}
                    </div>
                    ${images.length > 1 ? `
                    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">
                        ${images.map((img, i) => `
                            <img src="${img}"
                                onclick="document.getElementById('main-photo-img').src='${img}';document.querySelectorAll('.thumb').forEach(t=>t.style.border='2px solid var(--cream-dark)');this.style.border='2px solid var(--saffron)'"
                                class="thumb"
                                style="width:60px;height:60px;border-radius:8px;object-fit:cover;cursor:pointer;flex-shrink:0;border:${i===0?'2px solid var(--saffron)':'2px solid var(--cream-dark)'}">
                        `).join('')}
                    </div>` : ''}
                </div>

                <!-- Details -->
                <div style="padding:4px 0">
                    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--slate);margin-bottom:4px">
                        ${Store.getCategories().find(c => c.id === product.category)?.name || ''}
                    </div>
                    <h1 style="margin-bottom:8px;font-size:1.5rem">${product.name}</h1>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--forest);margin-bottom:10px">${formatRWF(product.price)}</div>
                    <div style="margin-bottom:12px">${stockLabel}</div>

                    <div style="padding:10px;background:var(--cream);border-radius:var(--radius-md);margin-bottom:14px;font-size:0.82rem">
                        <span style="color:var(--slate)">Available at:</span>
                        <span style="font-weight:600">${product.stores.map(s => STORES.find(st=>st.id===s)?.name.replace('Patel ','')).filter(Boolean).join(' · ')}</span>
                    </div>

                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
                        <div class="qty-control">
                            <button onclick="changeDetailQty(-1)">−</button>
                            <span id="detail-qty">1</span>
                            <button onclick="changeDetailQty(1)">+</button>
                        </div>
                        <button class="btn btn-primary" style="flex:1;padding:12px;border-radius:var(--radius-md)"
                            onclick="addProductToCartQty('${storeId}','${product.id}')"
                            ${product.stock === 0 ? 'disabled style="opacity:0.4"' : ''}>
                            ${product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                        </button>
                    </div>
                    <div style="font-size:0.78rem;color:var(--slate)">
                        📍 Shopping from: <b>${store.name}</b>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function changeDetailQty(delta) {
    const el = document.getElementById('detail-qty');
    el.textContent = Math.max(1, parseInt(el.textContent) + delta);
}

function addProductToCartQty(storeId, productId) {
    const qty = parseInt(document.getElementById('detail-qty').textContent) || 1;
    Store.addToCart(storeId, productId, qty);
    updateNav();
    const prod = Store.getProduct(productId);
    showToast(`${prod.emoji} ${prod.name} ×${qty} added!`);
}

// ═══════════════════════════════════════════
// CART
// ═══════════════════════════════════════════
function renderCart() {
    const container = document.getElementById('page-container');
    let storeCartsHtml = '';
    let hasItems = false;

    STORES.forEach(store => {
        const cart = Store.getCart(store.id);
        if (cart.length === 0) return;
        hasItems = true;
        const products = Store.getProducts();
        let storeTotal = 0;
        const itemsHtml = cart.map(ci => {
            const prod = products.find(p => p.id === ci.productId);
            if (!prod) return '';
            const lineTotal = prod.price * ci.qty;
            storeTotal += lineTotal;
            const imgContent = prod.image ? `<img src="${prod.image}" alt="">` : prod.emoji;
            return `
                <div class="cart-item">
                    <div class="cart-item-img">${imgContent}</div>
                    <div class="cart-item-details">
                        <h4>${prod.name}</h4>
                        <div class="cart-item-price">${formatRWF(prod.price)} each</div>
                    </div>
                    <div class="qty-control">
                        <button onclick="updateQty('${store.id}','${prod.id}',${ci.qty - 1})">−</button>
                        <span>${ci.qty}</span>
                        <button onclick="updateQty('${store.id}','${prod.id}',${ci.qty + 1})">+</button>
                    </div>
                    <div style="font-weight:700;min-width:80px;text-align:right;font-size:0.85rem">${formatRWF(lineTotal)}</div>
                    <button class="cart-item-remove" onclick="removeCartItem('${store.id}','${prod.id}')">✕</button>
                </div>
            `;
        }).join('');

        storeCartsHtml += `
            <div style="margin-bottom:var(--gap-lg)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <h3 style="display:flex;align-items:center;gap:6px;font-size:1rem">${store.emoji} ${store.name}</h3>
                    <span style="font-weight:700;color:var(--forest);font-size:0.9rem">${formatRWF(storeTotal)}</span>
                </div>
                ${itemsHtml}
                <div style="text-align:right;margin-top:var(--gap-sm)">
                    <button class="btn btn-primary" onclick="navigate('checkout',{storeId:'${store.id}'})">Checkout ${store.name.replace('Patel ','')} →</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="container" style="padding:var(--gap-lg) 12px;max-width:900px;margin:0 auto">
            <h1 style="font-size:1.5rem">Your Cart</h1>
            <p style="color:var(--slate);margin-bottom:var(--gap-md);font-size:0.85rem">Each store has a separate cart for easier delivery.</p>
            ${hasItems ? storeCartsHtml : `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Browse products and add items!</p>
                    <button class="btn btn-primary" style="margin-top:12px" onclick="navigate('home')">Start Shopping</button>
                </div>
            `}
        </div>
    `;
}

function updateQty(storeId, productId, qty) {
    if (qty < 1) return removeCartItem(storeId, productId);
    Store.updateCartQty(storeId, productId, qty);
    renderCart();
    updateNav();
}

function removeCartItem(storeId, productId) {
    Store.removeFromCart(storeId, productId);
    renderCart();
    updateNav();
    showToast('Item removed', 'info');
}

// ═══════════════════════════════════════════
// CHECKOUT
// ═══════════════════════════════════════════
function renderCheckout(storeId) {
    const user = Store.getCurrentUser();
    const isGuest = !user || user.role !== 'customer';
    const store = STORES.find(s => s.id === storeId);
    if (!store) return navigate('cart');
    const cart = Store.getCart(storeId);
    if (cart.length === 0) return navigate('cart');

    const products = Store.getProducts();
    let subtotal = 0;
    const items = cart.map(ci => {
        const p = products.find(pr => pr.id === ci.productId);
        subtotal += p.price * ci.qty;
        return { ...ci, name: p.name, emoji: p.emoji, price: p.price };
    });
    // ✅ FREE DELIVERY on orders over RWF 15,000
    const FREE_DELIVERY_THRESHOLD = 15000;
    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 1500;
    const total = subtotal + delivery;

    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="checkout-layout">
            <div>
                <h2 style="margin-bottom:var(--gap-md);font-size:1.3rem">Checkout — ${store.name.replace('Patel ','')}</h2>

                ${isGuest ? `
                <div class="card" style="margin-bottom:var(--gap-md)">
                    <div class="card-body">
                        <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:10px;font-size:0.95rem">Your Details</h3>
                        <p style="color:var(--slate);font-size:0.82rem;margin-bottom:var(--gap-md)">Guest checkout. <a href="#" onclick="navigate('login');return false">Sign in</a> for faster checkout.</p>
                        <div class="form-row">
                            <div class="form-group"><label>Full Name *</label><input type="text" class="form-input" id="checkout-name" placeholder="Your full name"></div>
                            <div class="form-group"><label>Phone *</label><input type="tel" class="form-input" id="checkout-phone" placeholder="+250 7XX XXX XXX"></div>
                        </div>
                        <div class="form-group"><label>Email</label><input type="email" class="form-input" id="checkout-email" placeholder="your@email.com (optional)"></div>
                        <div class="form-group"><label>Delivery Address *</label><textarea class="form-input" id="checkout-address" rows="2" placeholder="Your address in Kigali"></textarea></div>
                    </div>
                </div>
                ` : `
                <div class="card" style="margin-bottom:var(--gap-md)">
                    <div class="card-body">
                        <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:10px;font-size:0.95rem">Delivery Address</h3>
                        <div class="form-group"><label>Address</label><textarea class="form-input" id="checkout-address" rows="2">${user.address || ''}</textarea></div>
                        <div class="form-row">
                            <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="checkout-phone" value="${user.phone || ''}"></div>
                            <div class="form-group"><label>Email</label><input type="email" class="form-input" id="checkout-email" value="${user.email || ''}"></div>
                        </div>
                    </div>
                </div>
                `}

                <div class="card" style="margin-bottom:var(--gap-md)">
                    <div class="card-body">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem;font-weight:600">
                            <input type="checkbox" id="business-toggle" onchange="toggleBusinessFields()" style="width:16px;height:16px">
                            🏢 Ordering for a business? (for TIN invoice)
                        </label>
                        <div id="business-fields" style="display:none;margin-top:12px">
                            <div class="form-group"><label>Business Name</label><input type="text" class="form-input" id="checkout-business-name" placeholder="Company / business name"></div>
                            <div class="form-group"><label>TIN Number</label><input type="text" class="form-input" id="checkout-tin" placeholder="Tax Identification Number"></div>
                            <p style="font-size:0.75rem;color:var(--slate);margin-top:2px">These will appear on your invoice for tax purposes.</p>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom:var(--gap-md)">
                    <div class="card-body">
                        <h3 style="font-family:var(--font-body);font-weight:700;margin-bottom:10px;font-size:0.95rem">Payment Method</h3>
                        <div class="payment-options">
                            <label class="payment-option selected" onclick="selectPayment(this,'mtn')">
                                <input type="radio" name="payment" value="mtn" checked>
                                <span class="payment-icon">📱</span>
                                <div><div class="payment-label">MTN Mobile Money</div><div class="payment-desc">Send to MoMo Pay code</div></div>
                            </label>
                            <label class="payment-option" onclick="selectPayment(this,'cod')">
                                <input type="radio" name="payment" value="cod">
                                <span class="payment-icon">💵</span>
                                <div><div class="payment-label">Cash on Delivery</div><div class="payment-desc">Pay when you receive</div></div>
                            </label>
                        </div>
                        <div id="momo-fields" style="margin-top:var(--gap-md)">
                            <div style="background:var(--cream);border:2px solid var(--saffron-light);border-radius:var(--radius-md);padding:var(--gap-md);margin-bottom:var(--gap-md)">
                                <div style="font-weight:700;margin-bottom:6px;font-size:0.9rem">📱 Send <span style="color:var(--forest)">${formatRWF(total)}</span> to:</div>
                                <div style="background:white;border-radius:var(--radius-md);padding:12px;border:1px solid var(--cream-dark)">
                                    <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--slate);margin-bottom:3px">MoMo Pay Code</div>
                                    <div style="font-family:var(--font-mono);font-size:1.8rem;font-weight:700;color:var(--coffee);letter-spacing:3px">${STORE_MOMO_CODES[storeId] || '004305'}</div>
                                    <div style="font-size:0.78rem;color:var(--slate);margin-top:2px">Dial: <b>*182*8*1*${STORE_MOMO_CODES[storeId] || '004305'}#</b></div>
                                </div>
                                <div style="font-size:0.75rem;color:var(--light-slate);margin-top:8px">After sending, upload a screenshot below.</div>
                            </div>
                            <div class="form-group"><label>Your MoMo Number</label><input type="tel" class="form-input" id="momo-number" placeholder="07X XXX XXXX"></div>
                            <div class="form-group">
                                <label>Payment Screenshot *</label>
                                <div class="upload-zone" id="proof-upload-zone" onclick="document.getElementById('proof-file').click()">
                                    <div class="upload-icon">📸</div>
                                    <p>Tap to upload screenshot</p>
                                    <p class="upload-hint">JPG, PNG — max 2MB</p>
                                </div>
                                <input type="file" id="proof-file" accept="image/*" style="display:none" onchange="previewPaymentProof(this)">
                                <div id="proof-preview" style="display:none;margin-top:8px;position:relative">
                                    <img id="proof-preview-img" class="upload-preview" style="width:160px;height:auto;max-height:240px">
                                    <button class="btn btn-ghost btn-sm" style="position:absolute;top:2px;right:2px;background:white" onclick="clearPaymentProof()">✕</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn btn-primary btn-full" style="padding:14px;font-size:0.95rem;border-radius:var(--radius-md)" onclick="placeOrder('${storeId}',${total})">
                    Place Order — ${formatRWF(total)}
                </button>
            </div>
            <div class="checkout-summary">
                <h3 style="margin-bottom:12px">Order Summary</h3>
                ${items.map(it => `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid var(--cream-dark)">
                        <div style="display:flex;gap:10px;align-items:flex-start;min-width:0">
                            <span style="background:var(--forest);color:white;font-size:0.72rem;font-weight:700;min-width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${it.qty}×</span>
                            <div style="min-width:0">
                                <div style="font-size:0.88rem;color:var(--coffee);font-weight:500;line-height:1.3">${it.name}</div>
                                <div style="font-size:0.75rem;color:var(--light-slate);margin-top:1px">${formatRWF(it.price)} each</div>
                            </div>
                        </div>
                        <div style="font-weight:600;color:var(--coffee);white-space:nowrap;font-size:0.88rem">${formatRWF(it.price * it.qty)}</div>
                    </div>
                `).join('')}
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 4px">
                    <span style="color:var(--slate);font-size:0.88rem">Subtotal</span>
                    <span style="color:var(--coffee);font-size:0.88rem">${formatRWF(subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
                    <span style="color:var(--slate);font-size:0.88rem">Delivery fee</span>
                    <span style="font-size:0.88rem">${delivery === 0 ? '<b style="color:var(--forest)">FREE</b>' : formatRWF(delivery)}</span>
                </div>
                ${delivery === 0 ? '' : `<div style="font-size:0.75rem;color:var(--forest);background:var(--cream-light);border-radius:6px;padding:6px 8px;margin:4px 0">Add ${formatRWF(15000 - subtotal)} more to get FREE delivery</div>`}
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;margin-top:6px;border-top:2px solid var(--cream-dark)">
                    <span style="font-weight:700;font-size:1.05rem;color:var(--coffee)">Total</span>
                    <span style="font-weight:800;font-size:1.15rem;color:var(--forest)">${formatRWF(total)}</span>
                </div>
            </div>
        </div>
    `;
}

let selectedPayment = 'mtn';
let paymentProofData = null;

function toggleBusinessFields() {
    const checked = document.getElementById('business-toggle').checked;
    document.getElementById('business-fields').style.display = checked ? 'block' : 'none';
}

function selectPayment(el, method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('momo-fields').style.display = method === 'cod' ? 'none' : 'block';
}

function previewPaymentProof(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Screenshot must be under 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        paymentProofData = e.target.result;
        document.getElementById('proof-preview-img').src = e.target.result;
        document.getElementById('proof-preview').style.display = 'block';
        document.getElementById('proof-upload-zone').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function clearPaymentProof() {
    paymentProofData = null;
    document.getElementById('proof-preview').style.display = 'none';
    document.getElementById('proof-upload-zone').style.display = '';
    document.getElementById('proof-file').value = '';
}

async function placeOrder(storeId, total) {
    try {
        const user = Store.getCurrentUser();
        const isGuest = !user || user.role !== 'customer';
        const address = document.getElementById('checkout-address').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const email = document.getElementById('checkout-email').value.trim();

        // ✅ VALIDATION
        if (isGuest) {
            const name = document.getElementById('checkout-name').value.trim();
            if (!name) return showToast('Please enter your name', 'error');
            if (!phone) return showToast('Please enter your phone number', 'error');
            if (!address) return showToast('Please enter a delivery address', 'error');
        } else {
            if (!phone) return showToast('Please enter your phone number', 'error');
            if (!address) return showToast('Please enter a delivery address', 'error');
        }
        
        if (selectedPayment !== 'cod' && !paymentProofData) {
            return showToast('Please upload your payment screenshot', 'error');
        }

        const cart = Store.getCart(storeId);
        if (!cart || cart.length === 0) return showToast('Your cart is empty', 'error');

        const products = Store.getProducts();
        const items = cart.map(ci => {
            const p = products.find(pr => pr.id === ci.productId);
            if (!p) throw new Error('Product not found: ' + ci.productId);
            return { productId: ci.productId, name: p.name, emoji: p.emoji, price: p.price, qty: ci.qty, image: p.image || (p.images && p.images[0]) || null };
        });
        
        const orderId = 'ORD-' + String(2000 + Math.floor(Math.random() * 8000));
        const store = STORES.find(s => s.id === storeId);
        if (!store) throw new Error('Store not found');
        
        const customerName = isGuest ? document.getElementById('checkout-name').value.trim() : user.name;

        // ✅ Business / TIN fields (optional)
        const businessToggle = document.getElementById('business-toggle');
        const isBusiness = businessToggle && businessToggle.checked;
        const businessName = isBusiness ? (document.getElementById('checkout-business-name').value.trim() || null) : null;
        const tinNumber = isBusiness ? (document.getElementById('checkout-tin').value.trim() || null) : null;

        const order = {
            id: orderId, 
            customerId: isGuest ? null : user.id, 
            customerName, 
            customerEmail: email,
            customerPhone: phone, 
            customerAddress: address, 
            businessName,
            tinNumber,
            storeId, 
            storeName: store.name,
            items, 
            total, 
            paymentMethod: selectedPayment,
            paymentProof: selectedPayment !== 'cod' ? paymentProofData : null,
            paymentVerified: selectedPayment === 'cod', 
            status: selectedPayment === 'cod' ? 'pending' : 'awaiting-payment',
            driverId: null,
            created_at: new Date().toISOString()
        };
        
        // ✅ ADD ORDER WITH ERROR HANDLING
        await Store.addOrder(order);
        if (!order) throw new Error('Failed to create order');
        
        Store.clearCart(storeId);
        paymentProofData = null;
        selectedPayment = 'mtn'; // Reset to default
        updateNav();
        showEmailPreview('order-confirmation', order);
        setTimeout(() => navigate('order-success', { orderId }), 500);
    } catch (err) {
        console.error('Order error:', err);
        showToast('Failed to place order: ' + err.message, 'error');
    }
}

function renderOrderSuccess(orderId) {
    const order = Store.getOrders().find(o => o.id === orderId);
    const isMomo = order && order.payment_method !== 'cod';
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div style="text-align:center;padding:var(--gap-xl) var(--gap-md)">
            <div style="font-size:4rem;margin-bottom:var(--gap-sm)">🛒</div>
            <h1 style="font-size:1.5rem">Order Placed!</h1>
            <p style="color:var(--slate);font-size:0.9rem;margin:var(--gap-sm) auto;max-width:400px">
                Your order <b>${orderId}</b> has been placed.
                ${isMomo ? 'Payment screenshot is being reviewed.' : 'You\'ll pay cash on delivery.'}
            </p>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:var(--gap-lg)">
                <button class="btn btn-primary" onclick="navigate('my-orders')">View Orders</button>
                <button class="btn btn-outline" onclick="navigate('home')">Continue Shopping</button>
            </div>
        </div>
    `;
}

function renderMyOrders() {
    const user = Store.getCurrentUser();
    if (!user) return navigate('login');
    const orders = Store.getOrders().filter(o => o.customer_id === user.id);
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="container" style="padding:var(--gap-lg) 12px;max-width:900px;margin:0 auto">
            <h1 style="font-size:1.4rem">My Orders</h1>
            <p style="color:var(--slate);margin-bottom:var(--gap-md);font-size:0.85rem">${orders.length} order${orders.length!==1?'s':''}</p>
            ${orders.length === 0 ? '<div class="empty-state"><div class="empty-icon">📋</div><h3>No orders yet</h3><p>Place your first order!</p></div>' : ''}
            ${orders.map(o => `
                <div class="card" style="margin-bottom:8px">
                    <div class="card-body" style="padding:12px">
                        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:6px">
                            <div>
                                <h3 style="font-family:var(--font-body);font-weight:700;font-size:0.9rem">${o.id}</h3>
                                <div style="font-size:0.78rem;color:var(--slate)">${STORES.find(s => s.id === o.store_id)?.name || o.store_id} · ${formatDate(o.created_at)}</div>
                            </div>
                            <div style="text-align:right">
                                ${statusTag(o.status)}
                                <div style="font-weight:700;color:var(--forest);margin-top:2px;font-size:0.9rem">${formatRWF(o.total)}</div>
                            </div>
                        </div>
                        <div style="margin-top:6px;font-size:0.78rem;color:var(--slate)">
                            ${o.items.map(it => `${it.emoji} ${it.name} x${it.qty}`).join(' · ')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
function renderLogin() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-logo"><div class="logo-mark">P</div><span style="font-family:var(--font-display);font-size:1.2rem;color:var(--coffee)">Patel Stores</span></div>
                <h2 style="font-size:1.3rem">Welcome Back</h2>
                <p class="auth-sub">Sign in to your account</p>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="login-email" placeholder="your@email.com"></div>
                <div class="form-group"><label>Password</label><input type="password" class="form-input" id="login-password" placeholder="••••••••"></div>
                <button class="btn btn-primary btn-full" onclick="doCustomerLogin()">Sign In</button>
                <div class="auth-divider">or</div>
                <button class="btn btn-outline btn-full" onclick="navigate('register')">Create an Account</button>
            </div>
        </div>
    `;
}

async function doCustomerLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    
    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return showToast(error.message, 'error');
        const customer = Store.getCustomers().find(c => c.id === data.user.id);
        if (!customer) return showToast('Customer record not found.', 'error');
        
        // ✅ ADMIN DETECTED (by database role) → redirect to staff portal
        if (customer.role === 'admin') {
            await sb.auth.signOut();
            showAdminRedirectMessage();
            return;
        }
        
        Store.setCurrentUser({ ...customer, role: 'customer' });
        showToast('Welcome back, ' + customer.name + '!');
        navigate('home');
    } catch (err) { showToast('Login failed: ' + err.message, 'error'); }
}

// ✅ NEW FUNCTION: SHOW ADMIN REDIRECT MESSAGE
function showAdminRedirectMessage() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="auth-page">
            <div class="auth-card" style="text-align:center;max-width:400px">
                <div style="font-size:3rem;margin-bottom:var(--gap-md)">👤</div>
                <h2 style="font-size:1.3rem;color:var(--coffee)">Admin Account Detected</h2>
                <p class="auth-sub" style="margin-bottom:var(--gap-lg)">
                    This is an admin account. Please use the staff portal to login.
                </p>
                
                <button class="btn btn-primary btn-full" onclick="window.location.href='/admin-portal.html'" style="margin-bottom:var(--gap-md)">
                    Go to Staff Portal →
                </button>
                
                <button class="btn btn-outline btn-full" onclick="navigate('login')">
                    Back to Customer Login
                </button>
                
                <div style="margin-top:var(--gap-lg);padding:var(--gap-md);background:var(--cream-light);border-radius:8px;font-size:0.85rem;color:var(--slate)">
                    <strong>💡 Tip:</strong> Staff members should use the staff portal for admin access.
                </div>
            </div>
        </div>
    `;
}

function renderRegister() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-logo"><div class="logo-mark">P</div><span style="font-family:var(--font-display);font-size:1.2rem;color:var(--coffee)">Patel Stores</span></div>
                <h2 style="font-size:1.3rem">Create Account</h2>
                <p class="auth-sub">Join Patel Stores today</p>
                <div class="form-row">
                    <div class="form-group"><label>First Name</label><input type="text" class="form-input" id="reg-first" placeholder="Jean"></div>
                    <div class="form-group"><label>Last Name</label><input type="text" class="form-input" id="reg-last" placeholder="Baptiste"></div>
                </div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="reg-email" placeholder="your@email.com"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="reg-phone" placeholder="+250 7XX XXX XXX"></div>
                <div class="form-group"><label>Delivery Address</label><textarea class="form-input" id="reg-address" rows="2" placeholder="Your address in Kigali"></textarea></div>
                <div class="form-group"><label>Password</label><input type="password" class="form-input" id="reg-password" placeholder="Minimum 6 characters"></div>
                <button class="btn btn-primary btn-full" onclick="doRegister()">Create Account</button>
                <div style="text-align:center;margin-top:var(--gap-md)"><span style="font-size:0.85rem;color:var(--slate)">Have an account? </span><a href="#" onclick="navigate('login');return false">Sign In</a></div>
            </div>
        </div>
    `;
}

async function doRegister() {
    const first = document.getElementById('reg-first').value.trim();
    const last = document.getElementById('reg-last').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const address = document.getElementById('reg-address').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!first || !last || !email || !phone || !password) return showToast('Please fill in all fields', 'error');
    if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');
    try {
        const { data: authData, error: authError } = await sb.auth.signUp({ email, password });
        if (authError) return showToast(authError.message, 'error');
        const customer = await Store.addCustomer({ id: authData.user.id, name: first + ' ' + last, email, phone, address });
        Store.setCurrentUser({ ...customer, role: 'customer' });
        showToast('Welcome, ' + customer.name + '!');
        navigate('home');
    } catch (err) { showToast('Registration failed: ' + err.message, 'error'); }
}

function renderStaffLogin() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
        <div class="auth-page" style="background:var(--coffee)">
            <div class="auth-card">
                <div class="auth-logo"><div class="logo-mark">P</div><span style="font-family:var(--font-display);font-size:1.2rem;color:var(--coffee)">Staff Portal</span></div>
                <h2 style="font-size:1.2rem">Staff Sign In</h2>
                <p class="auth-sub">Admin or Driver access only</p>
                <div class="tabs" style="margin-bottom:var(--gap-md)">
                    <button class="tab active" onclick="switchStaffTab('admin',this)">Admin</button>
                    <button class="tab" onclick="switchStaffTab('driver',this)">Driver</button>
                </div>
                <div id="staff-form-admin">
                    <div class="form-group"><label>Email</label><input type="email" class="form-input" id="staff-email" placeholder="your@email.com"></div>
                    <div class="form-group"><label>Password</label><input type="password" class="form-input" id="staff-password" placeholder="••••••••"></div>
                    <button class="btn btn-primary btn-full" onclick="doStaffLogin('admin')">Sign In as Admin</button>
                </div>
                <div id="staff-form-driver" style="display:none">
                    <div class="form-group"><label>Email</label><input type="email" class="form-input" id="driver-email" placeholder="your@email.com"></div>
                    <div class="form-group"><label>Password</label><input type="password" class="form-input" id="driver-password" placeholder="••••••••"></div>
                    <button class="btn btn-secondary btn-full" onclick="doStaffLogin('driver')">Sign In as Driver</button>
                </div>
                <div style="text-align:center;margin-top:var(--gap-md)"><a href="#" onclick="navigate('login');return false" style="font-size:0.82rem;color:var(--slate)">← Back to Customer Login</a></div>
            </div>
        </div>
    `;
}

function switchStaffTab(tab, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('staff-form-admin').style.display = tab === 'admin' ? '' : 'none';
    document.getElementById('staff-form-driver').style.display = tab === 'driver' ? '' : 'none';
}

async function doStaffLogin(role) {
    if (role === 'admin') {
        const email = document.getElementById('staff-email').value.trim();
        const password = document.getElementById('staff-password').value;
        if (!email || !password) return showToast('Please fill in all fields', 'error');
        try {
            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) return showToast('Invalid credentials', 'error');
            const customer = Store.getCustomers().find(c => c.id === data.user.id);
            if (!customer || customer.role !== 'admin') { await sb.auth.signOut(); return showToast('Access denied.', 'error'); }
            Store.setCurrentUser({ ...customer, role: 'admin' });
            showToast('Welcome, Admin!');
            navigate('admin');
        } catch (err) { showToast('Login failed: ' + err.message, 'error'); }
    } else {
        const email = document.getElementById('driver-email').value.trim();
        const password = document.getElementById('driver-password').value;
        const driver = Store.getDrivers().find(d => d.email === email && d.password === password);
        if (driver) {
            Store.setCurrentUser({ ...driver, role: 'driver' });
            showToast(`Welcome, ${driver.name}!`);
            navigate('driver');
        } else { showToast('Invalid driver credentials', 'error'); }
    }
}
