/* ═══════════════════════════════════════════
   PATEL STORES — Simple Router
   ═══════════════════════════════════════════ */

let currentRoute = '';
let routeParams = {};
let _historyReady = false; // becomes true after the first pushState/replaceState

const routes = {
    'home': () => renderHome(),
    'store': () => renderStorePage(routeParams.id),
    'login': () => renderLogin(),
    'register': () => renderRegister(),
    'staff-login': () => renderStaffLogin(),
    'cart': () => renderCart(),
    'checkout': () => renderCheckout(routeParams.storeId),
    'order-success': () => renderOrderSuccess(routeParams.orderId),
    'my-orders': () => renderMyOrders(),
    'product': () => renderProductDetail(routeParams.id, routeParams.storeId),
    // Admin
    'admin': () => renderAdminDashboard(),
    'admin-orders': () => renderAdminOrders(),
    'admin-payments': () => renderAdminPayments(),
    'admin-products': () => renderAdminProducts(),
    'admin-categories': () => renderAdminCategories(),
    'admin-customers': () => renderAdminCustomers(),
    'admin-customer-detail': () => renderAdminCustomerDetail(routeParams.id),
    'admin-drivers': () => renderAdminDrivers(),
    'admin-analytics': () => renderAdminAnalytics(),
    // Driver
    'driver': () => renderDriverDashboard(),
};

function navigate(route, params = {}) {
    currentRoute = route;
    routeParams = params;
    // Save to localStorage so refresh restores the page
    try {
       if (!['admin', 'admin-orders', 'admin-payments', 'admin-products', 'admin-categories', 'admin-customers', 'admin-customer-detail', 'admin-drivers', 'admin-analytics','driver','staff-login'].includes(route)) {
            localStorage.setItem('patel_last_route', JSON.stringify({ route, params }));
        }
    } catch(e) {}

    // Record this route in real browser history so the Back button walks
    // through in-app pages instead of leaving the site. The very first
    // navigation replaces the existing (URL-less) history entry so Back
    // from the home page still exits the site as expected; every
    // navigation after that pushes a new entry.
    const url = location.pathname + location.search + location.hash;
    if (_historyReady) {
        history.pushState({ route, params }, '', url);
    } else {
        history.replaceState({ route, params }, '', url);
        _historyReady = true;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    renderApp();
}

function navigateBack() {
    // Let the browser's own history stack decide what "back" means —
    // this fires the popstate handler below, which re-renders in place.
    history.back();
}

// Handle the browser/hardware Back and Forward buttons
window.addEventListener('popstate', (event) => {
    const state = event.state;
    currentRoute = state && state.route ? state.route : 'home';
    routeParams = state && state.params ? state.params : {};
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderApp();
});

function renderApp() {
    const container = document.getElementById('page-container');
    container.style.animation = 'none';
    container.offsetHeight; // trigger reflow
    container.style.animation = '';

    updateNav();

    if (routes[currentRoute]) {
        routes[currentRoute]();
    } else {
        renderHome();
    }
}
