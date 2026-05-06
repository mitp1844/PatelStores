/* ═══════════════════════════════════════════
   PATEL STORES — State Management (Supabase)
   ═══════════════════════════════════════════
   Design:
   - Local in-memory _cache holds all data (products, orders, customers, drivers, categories)
   - Store.init() fetches everything from Supabase into _cache on app start
   - Getters read synchronously from _cache
   - Writers are async: write to Supabase first, then update _cache
   - Cart data stays in localStorage (per-browser, not synced)
   - Auth: customers use Supabase Auth; admin/driver auth is custom
   - Global `sb` (Supabase client) is provided by supabase-config.js
   ═══════════════════════════════════════════ */

const Store = {
    // In-memory cache for all server data
    _cache: {
        products: [],
        orders: [],
        customers: [],
        drivers: [],
        categories: [],
        currentUser: null
    },

    // ─── INITIALIZATION ─────────────────────────

    /**
     * Fetch all data from Supabase into _cache.
     * Call once on app startup before rendering anything.
     */
    async init() {
        console.log('[Store] Initializing — fetching data from Supabase...');

        // Fetch all tables in parallel
        const [prodRes, ordRes, custRes, drvRes, catRes] = await Promise.all([
            (async () => {
    let all = [], from = 0, size = 1000;
    while (true) {
        const { data } = await sb.from('products').select('*').order('created_at', { ascending: false }).range(from, from + size - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < size) break;
        from += size;
    }
    return { data: all };
})(),
            sb.from('orders').select('*').order('created_at', { ascending: false }),
            sb.from('customers').select('*').order('created_at', { ascending: false }),
            sb.from('drivers').select('*').order('created_at', { ascending: false }),
            sb.from('categories').select('*')
        ]);

        this._cache.products   = prodRes.data || [];
        this._cache.orders     = ordRes.data  || [];
        this._cache.customers  = custRes.data || [];
        this._cache.drivers    = drvRes.data  || [];
        this._cache.categories = catRes.data && catRes.data.length > 0
            ? catRes.data
            : DEFAULT_CATEGORIES;

        // Restore currentUser from localStorage (survives page refresh)
        try {
            const saved = localStorage.getItem('patel_currentUser');
            if (saved) {
                this._cache.currentUser = JSON.parse(saved);
            }
        } catch { /* ignore corrupt data */ }

        console.log('[Store] Init complete —',
            this._cache.products.length, 'products,',
            this._cache.orders.length, 'orders,',
            this._cache.customers.length, 'customers,',
            this._cache.drivers.length, 'drivers,',
            this._cache.categories.length, 'categories');
    },

    // ─── FILE UPLOAD HELPER ─────────────────────

    /**
     * Upload a base64 data-URL to Supabase Storage.
     * @param {string} bucket  - Storage bucket name (e.g. 'uploads')
     * @param {string} path    - File path inside the bucket
     * @param {string} base64DataUrl - Data URL like "data:image/png;base64,..."
     * @returns {string} Public URL of the uploaded file
     */
    async uploadFile(bucket, path, base64DataUrl) {
        // Extract mime type and raw base64
        const [meta, base64] = base64DataUrl.split(',');
        const mime = meta.match(/:(.*?);/)[1];

        // Convert base64 to Blob
        const byteChars = atob(base64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mime });

        // Upload (upsert to allow overwrites)
        const { error } = await sb.storage.from(bucket).upload(path, blob, {
            contentType: mime,
            upsert: true
        });
        if (error) throw new Error('Upload failed: ' + error.message);

        // Get public URL
        const { data } = sb.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    },

    // ─── PRODUCTS ───────────────────────────────

    /** Get all products (sync, from cache). */
    getProducts() {
        return this._cache.products;
    },

    /** Find a single product by ID (sync). */
    getProduct(id) {
        return this._cache.products.find(p => p.id === id) || null;
    },

    /** Find a product by barcode (sync). */
    getProductByBarcode(barcode) {
        if (!barcode) return null;
        return this._cache.products.find(p => p.barcode === barcode) || null;
    },

    /** Link a barcode to an existing product. */
    async linkBarcode(productId, barcode) {
        return await this.updateProduct(productId, { barcode });
    },

    /**
     * Add a new product to Supabase and cache.
     * If product.image is a base64 data URL, upload it to storage first.
     */
    async addProduct(product) {
        let imageUrl = null;

        // Upload image if provided as base64
        if (product.image && product.image.startsWith('data:')) {
            const ext = product.image.match(/data:image\/(\w+)/)?.[1] || 'png';
            const path = `products/${product.id || crypto.randomUUID()}.${ext}`;
            imageUrl = await this.uploadFile('uploads', path, product.image);
        }

        const row = {
            name: product.name,
            category: product.category,
            price: product.price,
            emoji: product.emoji || null,
            stores: product.stores || [],
            image: product.images?.[0] || imageUrl || null,
            images: product.images || (imageUrl ? [imageUrl] : []),
            stock: product.stock ?? null,
            barcode: product.barcode || null
        };

        // If caller provided an id, use it; otherwise let Supabase generate UUID
        if (product.id) row.id = product.id;

        const { data, error } = await sb.from('products').insert(row).select().single();
        if (error) throw new Error('addProduct failed: ' + error.message);

        // Add to front of cache
        this._cache.products.unshift(data);
        return data;
    },

    /**
     * Update an existing product in Supabase and cache.
     * @param {string} id - Product UUID
     * @param {object} updates - Fields to update
     */
    async updateProduct(id, updates) {
        // If image is base64, upload first
        if (updates.image && updates.image.startsWith('data:')) {
            const ext = updates.image.match(/data:image\/(\w+)/)?.[1] || 'png';
            const path = `products/${id}.${ext}`;
            updates.image = await this.uploadFile('uploads', path, updates.image);
        }

        const { data, error } = await sb.from('products').update(updates).eq('id', id).select().single();
        if (error) throw new Error('updateProduct failed: ' + error.message);

        // Update cache
        const idx = this._cache.products.findIndex(p => p.id === id);
        if (idx >= 0) this._cache.products[idx] = data;
        return data;
    },

    /**
     * Delete a product from Supabase and cache.
     * @param {string} id - Product UUID
     */
    async deleteProduct(id) {
        const { error } = await sb.from('products').delete().eq('id', id);
        if (error) throw new Error('deleteProduct failed: ' + error.message);
        this._cache.products = this._cache.products.filter(p => p.id !== id);
    },

    /**
     * Upload an image for a product and update its image URL.
     * @param {string} productId - Product UUID
     * @param {string} dataUrl - Base64 data URL
     */
    async setProductImage(productId, dataUrl) {
        const ext = dataUrl.match(/data:image\/(\w+)/)?.[1] || 'png';
        const path = `products/${productId}.${ext}`;
        const imageUrl = await this.uploadFile('uploads', path, dataUrl);

        return await this.updateProduct(productId, { image: imageUrl });
    },

    // ─── CART (localStorage only) ───────────────

    /** Get cart for a specific store (localStorage). */
    getCart(storeId) {
        try {
            const val = localStorage.getItem('patel_cart_' + storeId);
            return val ? JSON.parse(val) : [];
        } catch { return []; }
    },

    /** Save cart for a specific store (localStorage). */
    setCart(storeId, cart) {
        localStorage.setItem('patel_cart_' + storeId, JSON.stringify(cart));
    },

    /** Add item to cart or increment quantity. */
    addToCart(storeId, productId, qty = 1) {
        const cart = this.getCart(storeId);
        const idx = cart.findIndex(c => c.productId === productId);
        if (idx >= 0) { cart[idx].qty += qty; }
        else { cart.push({ productId, qty }); }
        this.setCart(storeId, cart);
        return cart;
    },

    /** Remove an item from the cart entirely. */
    removeFromCart(storeId, productId) {
        let cart = this.getCart(storeId);
        cart = cart.filter(c => c.productId !== productId);
        this.setCart(storeId, cart);
        return cart;
    },

    /** Update the quantity of a cart item (min 1). */
    updateCartQty(storeId, productId, qty) {
        const cart = this.getCart(storeId);
        const item = cart.find(c => c.productId === productId);
        if (item) { item.qty = Math.max(1, qty); }
        this.setCart(storeId, cart);
        return cart;
    },

    /** Clear all items from a store's cart. */
    clearCart(storeId) { this.setCart(storeId, []); },

    /** Total item count in a single store's cart. */
    getCartCount(storeId) {
        return this.getCart(storeId).reduce((s, c) => s + c.qty, 0);
    },

    /** Total item count across all stores' carts. */
    getTotalCartCount() {
        return STORES.reduce((s, st) => s + this.getCartCount(st.id), 0);
    },

    // ─── ORDERS ─────────────────────────────────

    /** Get all orders (sync, from cache). */
    getOrders() {
        return this._cache.orders;
    },

    /**
     * Add a new order to Supabase and cache.
     * Maps camelCase app fields to snake_case DB columns.
     * If paymentProof is base64, uploads to storage first.
     */
    async addOrder(order) {
        let paymentProofUrl = order.paymentProof || null;

        // Upload payment proof screenshot if base64
        if (paymentProofUrl && paymentProofUrl.startsWith('data:')) {
            const ext = paymentProofUrl.match(/data:image\/(\w+)/)?.[1] || 'png';
            const path = `payment-proofs/${order.id}.${ext}`;
            paymentProofUrl = await this.uploadFile('uploads', path, paymentProofUrl);
        }

        const row = {
            id: order.id,
            customer_id: order.customerId || null,
            customer_name: order.customerName,
            customer_email: order.customerEmail || null,
            customer_phone: order.customerPhone || null,
            customer_address: order.customerAddress || null,
            store_id: order.storeId,
            items: order.items,            // JSONB
            total: order.total,
            status: order.status || 'pending',
            payment_method: order.paymentMethod || null,
            payment_proof: paymentProofUrl,
            payment_verified: order.paymentVerified || false,
            driver_id: order.driverId || null
        };

        const { data, error } = await sb.from('orders').insert(row).select().single();
        if (error) throw new Error('addOrder failed: ' + error.message);

        // Add to front of cache
        this._cache.orders.unshift(data);
        return data;
    },

    /**
     * Update an order's status in Supabase and cache.
     */
    async updateOrderStatus(orderId, status) {
        const { data, error } = await sb.from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();
        if (error) throw new Error('updateOrderStatus failed: ' + error.message);

        const idx = this._cache.orders.findIndex(o => o.id === orderId);
        if (idx >= 0) this._cache.orders[idx] = data;
        return data;
    },

    /**
     * Assign a driver to an order and set status to 'delivering'.
     */
    async assignDriver(orderId, driverId) {
        const { data, error } = await sb.from('orders')
            .update({ driver_id: driverId, status: 'delivering' })
            .eq('id', orderId)
            .select()
            .single();
        if (error) throw new Error('assignDriver failed: ' + error.message);

        const idx = this._cache.orders.findIndex(o => o.id === orderId);
        if (idx >= 0) this._cache.orders[idx] = data;
        return data;
    },

    // ─── CUSTOMERS ──────────────────────────────

    /** Get all customers (sync, from cache). */
    getCustomers() {
        return this._cache.customers;
    },

    /**
     * Add a customer record after Supabase Auth signup.
     * Uses the auth user's UUID as the customer id.
     */
    async addCustomer(customer) {
        const row = {
            id: customer.id,      // UUID from auth.users
            name: customer.name,
            email: customer.email,
            phone: customer.phone || null,
            address: customer.address || null
        };

        const { data, error } = await sb.from('customers').insert(row).select().single();
        if (error) throw new Error('addCustomer failed: ' + error.message);

        this._cache.customers.push(data);
        return data;
    },

    /** Find a single customer by ID (sync). */
    getCustomer(id) {
        return this._cache.customers.find(c => c.id === id) || null;
    },

    // ─── DRIVERS ────────────────────────────────

    /** Get all drivers (sync, from cache). */
    getDrivers() {
        return this._cache.drivers;
    },

    /**
     * Add a new driver to Supabase and cache.
     */
    async addDriver(driver) {
        const row = {
            name: driver.name,
            email: driver.email,
            phone: driver.phone || null,
            password: driver.password,
            vehicle: driver.vehicle || null
        };
        if (driver.id) row.id = driver.id;

        const { data, error } = await sb.from('drivers').insert(row).select().single();
        if (error) throw new Error('addDriver failed: ' + error.message);

        this._cache.drivers.push(data);
        return data;
    },

    /** Find a single driver by ID (sync). */
    getDriver(id) {
        return this._cache.drivers.find(d => d.id === id) || null;
    },

    // ─── AUTH ────────────────────────────────────

    /**
     * Get current logged-in user (sync, from cache).
     * On first call after page load, restores from localStorage.
     */
    getCurrentUser() {
        return this._cache.currentUser;
    },

    /**
     * Set current user in cache and persist to localStorage.
     */
    setCurrentUser(user) {
        this._cache.currentUser = user;
        if (user) {
            localStorage.setItem('patel_currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('patel_currentUser');
        }
    },

    /**
     * Log out: clear Supabase auth session, cache, and localStorage user.
     */
    async logout() {
        await sb.auth.signOut();
        this._cache.currentUser = null;
        localStorage.removeItem('patel_currentUser');
    },

    // ─── CATEGORIES ─────────────────────────────

    /** Get all categories (sync, from cache). */
    getCategories() {
        return this._cache.categories;
    },

    /**
     * Add a new category to Supabase and cache.
     */
    async addCategory(cat) {
        const row = { id: cat.id, name: cat.name, emoji: cat.emoji || null };

        const { data, error } = await sb.from('categories').insert(row).select().single();
        if (error) throw new Error('addCategory failed: ' + error.message);

        this._cache.categories.push(data);
        return data;
    },

    /**
     * Remove a category from Supabase and cache.
     * Protects the 'all' pseudo-category from deletion.
     */
    async removeCategory(id) {
        if (id === 'all') return; // never delete the "All" category

        const { error } = await sb.from('categories').delete().eq('id', id);
        if (error) throw new Error('removeCategory failed: ' + error.message);

        this._cache.categories = this._cache.categories.filter(c => c.id !== id);
    },

    // ─── REFRESH HELPERS ────────────────────────

    /** Re-fetch orders from Supabase into cache. */
    async refreshOrders() {
        const { data } = await sb.from('orders').select('*').order('created_at', { ascending: false });
        this._cache.orders = data || [];
        return this._cache.orders;
    },

    /** Re-fetch products from Supabase into cache. */
    async refreshProducts() {
        const { data } = await sb.from('products').select('*').order('created_at', { ascending: false });
        this._cache.products = data || [];
        return this._cache.products;
    },

    /** Re-fetch customers from Supabase into cache. */
    async refreshCustomers() {
        const { data } = await sb.from('customers').select('*').order('created_at', { ascending: false });
        this._cache.customers = data || [];
        return this._cache.customers;
    },

    /** Re-fetch drivers from Supabase into cache. */
    async refreshDrivers() {
        const { data } = await sb.from('drivers').select('*').order('created_at', { ascending: false });
        this._cache.drivers = data || [];
        return this._cache.drivers;
    }
};
