/* ═══════════════════════════════════════════
   PATEL STORES — App Initialization
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    const container = document.getElementById('page-container');
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:16px"><div class="logo-mark" style="width:64px;height:64px;font-size:2rem;animation:pulse 1.5s ease-in-out infinite">P</div><p style="color:#64748B;font-size:0.95rem">Loading Patel Stores...</p></div>';

    try {
        // Initialize store — fetch all data from Supabase
        await Store.init();
    } catch (err) {
        console.error('[App] Init failed:', err);
        container.innerHTML = '<div style="text-align:center;padding:80px 20px"><h2>Connection Error</h2><p style="color:#64748B;margin:12px 0">Could not connect to the server. Please check your internet connection and refresh.</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>';
        return;
    }

    // Check auth state and route
    const user = Store.getCurrentUser();
    if (user) {
        if (user.role === 'admin') navigate('admin');
        else if (user.role === 'driver') navigate('driver');
        else {
            // Restore last visited page on refresh
            try {
                const saved = localStorage.getItem('patel_last_route');
                if (saved) {
                    const { route, params } = JSON.parse(saved);
                    navigate(route, params);
                } else {
                    navigate('home');
                }
            } catch(e) {
                navigate('home');
            }
        }
    } else {
        // Restore last visited page for guests too
        try {
            const saved = localStorage.getItem('patel_last_route');
            if (saved) {
                const { route, params } = JSON.parse(saved);
                // Only restore customer-facing pages for guests
                const guestRoutes = ['home','store','product','cart','login','register'];
                if (guestRoutes.includes(route)) {
                    navigate(route, params);
                } else {
                    navigate('home');
                }
            } else {
                navigate('home');
            }
        } catch(e) {
            navigate('home');
        }
    }

    // Scroll effect for nav
    window.addEventListener('scroll', () => {
        document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 10);
    });
});
