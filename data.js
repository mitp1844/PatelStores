/* ═══════════════════════════════════════════
   PATEL STORES — Constants & Helpers
   ═══════════════════════════════════════════ */

const STORES = [
    { id: 'supermarket', name: 'Patel Supermarket', address: '6 KN 82 St, Kigali, Rwanda', emoji: '🏪', phone: '+250 788 836 076', email: 'patelgrocersrwanda@gmail.com', hours: '8AM - 8PM Daily' },
    { id: 'grocers', name: 'Patel Grocers', address: '46 KN 14 Ave, Kigali, Rwanda', emoji: '🛒', phone: '+250 783 335 971', email: 'patelgrocersrwanda@gmail.com', hours: '8AM - 10PM Daily' },
    { id: 'shop', name: 'Patel Shop', address: '33GW+243, Kigali, Rwanda', emoji: '🏬', phone: '+250 791 500 812', email: 'patelgrocersrwanda@gmail.com', hours: '8AM - 10PM Daily' }
];

const DEFAULT_CATEGORIES = [
    { id: 'all', name: 'All Products', emoji: '🛍️' },
    { id: 'fruits-veg', name: 'Fruits & Vegetables', emoji: '🥬' },
    { id: 'dairy', name: 'Dairy & Eggs', emoji: '🥛' },
    { id: 'meat', name: 'Meat & Fish', emoji: '🥩' },
    { id: 'bakery', name: 'Bakery', emoji: '🍞' },
    { id: 'beverages', name: 'Beverages', emoji: '🥤' },
    { id: 'snacks', name: 'Snacks', emoji: '🍿' },
    { id: 'household', name: 'Household', emoji: '🧹' },
    { id: 'personal', name: 'Personal Care', emoji: '🧴' },
    { id: 'grains', name: 'Grains & Cereals', emoji: '🌾' }
];

// Admin credentials are stored securely in Supabase — no hardcoded passwords here.

function formatRWF(amount) {
    return 'RWF ' + amount.toLocaleString();
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dtStr) {
    const d = new Date(dtStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
