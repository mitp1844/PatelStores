/* ═══════════════════════════════════════════
   PATEL STORES — Simple Router
   ═══════════════════════════════════════════ */

let currentRoute = '';
let routeParams = {};
let navHistory = []; // track internal navigation history



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
    // Push current route to history before changing
    if (currentRoute && currentRoute !== route) {
        navHistory.push({ route: currentRoute, params: { ...routeParams } });
        if (navHistory.length > 20) navHistory.shift();
    }
    currentRoute = route;
    routeParams = params;
    // Save to localStorage so refresh restores the page
    try {
       if (!['admin', 'admin-orders', 'admin-payments', 'admin-products', 'admin-categories', 'admin-customers', 'admin-customer-detail', 'admin-drivers', 'admin-analytics','driver','staff-login'].includes(route)) {
            localStorage.setItem('patel_last_route', JSON.stringify({ route, params }));
        }
    } catch(e) {}
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderApp();
}

function navigateBack() {
    if (navHistory.length > 0) {
        const prev = navHistory.pop();
        currentRoute = prev.route;
        routeParams = prev.params;
        window.scrollTo({ top: 0, behavior: 'instant' });
        renderApp();
    } else {
        navigate('home');
    }
}

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
