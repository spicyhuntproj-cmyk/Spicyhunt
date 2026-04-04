// public/app.js
const API_URL = '/api'; 
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let menuQtyMap = {}; // Tracks quantities selected in the menu UI

function formatINR(number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(number);
}

// --- Auth State Management: Simplified Restaurant Flow ---
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    const authNavItem = document.getElementById('auth-nav-item');
    if (!authNavItem) return;

    if (token && userStr) {
        const user = JSON.parse(userStr);
        authNavItem.innerHTML = `
            <div class="dropdown">
                <a class="btn btn-outline-warning dropdown-toggle rounded-pill px-4 btn-sm" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                    👑 ${user.name.toUpperCase()}
                </a>
                <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
                    <li><a class="dropdown-item small" href="booking.html">Begin Booking</a></li>
                    <li><hr class="dropdown-divider border-secondary"></li>
                    <li><a class="dropdown-item small" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </div>
        `;
    } else {
        authNavItem.innerHTML = `<a class="btn btn-outline-warning rounded-pill px-4 btn-sm" href="login.html">Login</a>`;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tableReserved'); 
    window.location.href = 'index.html';
}

function enforceAuthOnBookingPages() {
    const protectedPages = ['booking.html', 'checkout.html'];
    const currentPath = window.location.pathname;
    const isProtected = protectedPages.some(p => currentPath.endsWith(p));
    
    const token = localStorage.getItem('token');
    if (isProtected && !token) {
        alert('Please login to continue your royal culinary journey.');
        window.location.href = 'login.html';
    }
}

// --- SMART SEQUENTIAL FLOW LOGIC ---
window.handleCheckoutRedirection = function() {
    const tableBooked = localStorage.getItem('tableReserved');
    if (tableBooked === 'true' || tableBooked === true) {
        window.location.href = 'checkout.html';
    } else {
        window.location.href = 'booking.html?origin=menu';
    }
};

// --- Professional Menu Assets ---
const catImages = {
    'Starters': 'starters_tandoori_category_1775318986848.png',
    'Mains (Vegetarian)': 'mains_vegetarian_category_1775319014150.png',
    'Mains (Non-Vegetarian)': 'rajasthani_laal_maas_signature_1775318214346.png',
    'Breads & Sides': 'indian_breads_category_1775319045170.png',
    'Desserts': 'indian_desserts_category_1775319080000_1775319071061.png',
    'Beverages': 'refreshments_category_1775319100000_1775319098931.png'
};

const mockMenu = [
    { id: 1, name: 'Gold-Leaf Galouti Kebab', price: 2500, description: 'Melt-in-mouth lamb patties infused with 16 royal spices.', category: 'Starters', image_url: catImages['Starters'] },
    { id: 2, name: 'Truffle Butter Chicken Samosa', price: 1800, description: 'Crispy pastry pillows stuffed with shredded butter chicken and truffle.', category: 'Starters', image_url: catImages['Starters'] },
    { id: 3, name: 'Peshawari Paneer Tikka', price: 1500, description: 'Charcoal-grilled cottage cheese marinated in hung curd.', category: 'Starters', image_url: catImages['Starters'] },
    { id: 4, name: 'Saffron Tandoori Jhinga', price: 3200, description: 'Tiger prawns marinated with wild Kashmiri saffron.', category: 'Starters', image_url: catImages['Starters'] },
    { id: 9, name: 'Dal Bukhara', price: 1800, description: 'Black lentils simmered overnight on a slow charcoal fire.', category: 'Mains (Vegetarian)', image_url: catImages['Mains (Vegetarian)'] },
    { id: 11, name: 'Paneer Lababdar', price: 1900, description: 'Cottage cheese cubes in a rich, creamy tomato gravy.', category: 'Mains (Vegetarian)', image_url: catImages['Mains (Vegetarian)'] },
    { id: 17, name: 'Rajasthani Laal Maas', price: 3400, description: 'Fiery lamb dish from the royal kitchens of Rajasthan.', category: 'Mains (Non-Vegetarian)', image_url: catImages['Mains (Non-Vegetarian)'] },
    { id: 24, name: 'Awadhi Lamb Biryani', price: 3800, description: 'The peak of Nawabi cuisine, slow-cooked to perfection.', category: 'Mains (Non-Vegetarian)', image_url: 'awadhi_biryani_signature_1775318352835.png' },
    { id: 20, name: 'Gold-Leaf Butter Chicken', price: 2800, description: 'Tandoori chicken in a velvet-smooth smoked tomato gravy.', category: 'Mains (Non-Vegetarian)', image_url: 'gold_leaf_butter_chicken_signature_1775318389450.png' },
    { id: 25, name: 'Truffle Cheese Naan', price: 800, description: 'Flatbread stuffed with cheddar and finished with truffle oil.', category: 'Breads & Sides', image_url: catImages['Breads & Sides'] },
    { id: 26, name: 'Garlic Butter Naan', price: 500, description: 'Classic flatbread brushed liberally with garlic and ghee.', category: 'Breads & Sides', image_url: catImages['Breads & Sides'] },
    { id: 29, name: '24K Pistachio Rasmalai', price: 1200, description: 'Soft cheese discs in pistachio milk, adorned with 24K gold.', category: 'Desserts', image_url: catImages['Desserts'] },
    { id: 31, name: 'Shahi Tukda', price: 1100, description: 'Crisp fried bread soaked in saffron milk and topped with rich cream.', category: 'Desserts', image_url: catImages['Desserts'] },
    { id: 33, name: 'Saffron Cardamom Lassi', price: 600, description: 'A thick churned yogurt drink sweetened and infused with premium saffron.', category: 'Beverages', image_url: catImages['Beverages'] },
    { id: 36, name: 'Jal Jeera', price: 500, description: 'A refreshing tangy mocktail with roasted cumin and tamarind.', category: 'Beverages', image_url: catImages['Beverages'] }
];

// --- Dynamic Menu & Quantity Logic (Perfected Visibility) ---
async function loadMenu() {
    const container = document.getElementById('dynamic-menu-container');
    if (!container) return;
    updateCartBadge();
    
    let items = mockMenu.filter(item => item.image_url && item.image_url !== '');
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
        if (!menuQtyMap[item.id]) menuQtyMap[item.id] = 0; // Start at 0 (internal)
    });

    const order = ['Starters', 'Mains (Vegetarian)', 'Mains (Non-Vegetarian)', 'Breads & Sides', 'Desserts', 'Beverages'];
    let html = '';

    order.forEach(cat => {
        if (!categories[cat]) return;
        html += `
            <div class="menu-structure-panel mb-5">
                <h2 class="menu-category px-4 py-3 m-0">${cat}</h2>
                <div class="row g-4 p-4">
        `;

        categories[cat].forEach(item => {
            const hasInCart = cart.find(i => i.id === item.id);
            const initialQty = hasInCart ? hasInCart.qty : 0;
            
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card dish-card-perfect pb-3">
                        <div class="dish-img-container" style="height:220px;">
                            <img src="${item.image_url}" alt="${item.name}" class="dish-img">
                            <span class="glass-badge">${formatINR(item.price)}</span>
                        </div>
                        <div class="card-body px-3 text-center d-flex flex-column">
                            <h4 class="brand-logo fs-5 mt-2">${item.name}</h4>
                            <p class="text-muted small flex-grow-1" style="min-height:50px;">${item.description}</p>
                            
                            <!-- Hidden until first Add -->
                            <div id="qty-container-${item.id}" class="d-flex justify-content-center align-items-center mb-3" style="display: ${initialQty > 0 ? 'flex' : 'none'} !important;">
                                <button class="btn btn-qty" onclick="changeMenuQty(${item.id}, -1)">-</button>
                                <span class="mx-3 fw-bold fs-5" id="qty-display-${item.id}">${initialQty || 1}</span>
                                <button class="btn btn-qty" onclick="changeMenuQty(${item.id}, 1)">+</button>
                            </div>

                            <div class="mt-auto">
                                <button id="add-btn-${item.id}" class="btn btn-primary-custom w-100 rounded-pill py-2" onclick="addToCartPerfect(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})">
                                    ${initialQty > 0 ? 'Add More' : 'Add to Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Keep local state in sync
            menuQtyMap[item.id] = initialQty || 1;
        });
        html += `   </div>
            </div>`;
    });
    container.innerHTML = html;
}

window.changeMenuQty = function(id, delta) {
    let current = menuQtyMap[id] || 1;
    let newVal = Math.max(1, current + delta);
    menuQtyMap[id] = newVal;
    const display = document.getElementById(`qty-display-${id}`);
    if (display) display.textContent = newVal;
}

window.addToCartPerfect = function(id, name, price) {
    const qty = menuQtyMap[id] || 1;
    const existingIndex = cart.findIndex(i => i.id === id);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ id, name, price, qty });
    }
    
    // UI FEEDBACK: Reveal the quantity selector ONLY after first add
    const qtyContainer = document.getElementById(`qty-container-${id}`);
    if (qtyContainer) {
        qtyContainer.style.setProperty('display', 'flex', 'important');
    }
    const addBtn = document.getElementById(`add-btn-${id}`);
    if (addBtn) {
        addBtn.innerText = 'Add More';
        addBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
        setTimeout(() => { addBtn.style.background = ''; }, 1000);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
};

function updateCartBadge() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        countEl.textContent = total;
        countEl.style.display = total > 0 ? 'flex' : 'none';
    }
}

// --- Royal Checkout ---
function loadCheckout() {
    const checkoutContainer = document.getElementById('checkout-items');
    if (!checkoutContainer) return;

    if (cart.length === 0) {
        checkoutContainer.innerHTML = '<p class="text-center text-muted py-4">Your culinary cart is empty.</p>';
        document.getElementById('checkout-total').textContent = formatINR(0);
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach((item, index) => {
        let itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `
            <div class="d-flex justify-content-between align-items-center mb-4 border-bottom border-light pb-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0 fs-5">${item.name}</h6>
                    <small class="text-muted">${formatINR(item.price)} per portion</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="d-flex align-items-center bg-white rounded-5 px-2 border">
                        <button class="btn btn-sm btn-link text-dark text-decoration-none" onclick="updateCartQty(${index}, -1)">-</button>
                        <span class="px-2 fw-bold">${item.qty}</span>
                        <button class="btn btn-sm btn-link text-dark text-decoration-none" onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                    <span class="fw-bold fs-5" style="min-width: 100px; text-align: right;">${formatINR(itemTotal)}</span>
                    <button class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="removeFromCart(${index})">×</button>
                </div>
            </div>
        `;
    });
    checkoutContainer.innerHTML = html;
    document.getElementById('checkout-total').textContent = formatINR(total);
}

window.updateCartQty = function(index, delta) {
    cart[index].qty = Math.max(1, cart[index].qty + delta);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCheckout();
    updateCartBadge();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCheckout();
    updateCartBadge();
};

document.addEventListener('DOMContentLoaded', () => {
    enforceAuthOnBookingPages();
    checkAuth();
    loadMenu();
    loadCheckout();

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('tableReserved', 'true');
            const params = new URLSearchParams(window.location.search);
            window.location.href = 'menu.html';
        });
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Spicy Hunt Order Placed Successfully!');
            localStorage.removeItem('cart');
            localStorage.removeItem('tableReserved'); 
            window.location.href = 'index.html';
        });
    }
});
