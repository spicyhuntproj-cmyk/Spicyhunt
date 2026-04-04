require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Explicit route for Admin Portal
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.status(403).json({ error: 'Royal Admin Access Only' });
        }
        req.user = user;
        next();
    });
};

// ---- AUTHENTICATION API ---- //
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, 'user']
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- RESTAURANT DATA API ---- //
app.get('/api/menu', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items ORDER BY category, price ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// ---- IN-MEMORY FALLBACK (For Broken Local SQL Connections) ---- //
let memReservations = [];
let memOrders = [];
let reqCounterId = 1;

// ---- RESERVATION & ORDERS API (PROTECTED) ---- //
app.post('/api/book-table', authenticateToken, async (req, res) => {
    try {
        const { date, time, guests, occasion } = req.body;
        // Try real SQL first
        try {
            const result = await db.query(
                'INSERT INTO table_reservations (user_id, booking_date, booking_time, guests, occasion) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [req.user.id, date, time, guests, occasion]
            );
            return res.status(201).json({ message: 'Table Reserved (SQL)', bookingId: result.rows[0].id });
        } catch (dbErr) {
            console.warn("SQL Failed. Falling back to Memory:", dbErr.message);
            // Fallback to Memory
            const id = reqCounterId++;
            memReservations.push({ id, user_id: req.user.id, date, time, guests, occasion, status: 'confirmed' });
            return res.status(201).json({ message: 'Table Reserved (Memory)', bookingId: id });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to reserve table.' });
    }
});

app.post('/api/checkout', authenticateToken, async (req, res) => {
    try {
        const { cartItems, totalPrice } = req.body;
        
        try {
            // 1. Create Order (SQL)
            const orderRes = await db.query(
                'INSERT INTO food_orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id',
                [req.user.id, totalPrice, 'preparing']
            );
            const orderId = orderRes.rows[0].id;

            for (const item of cartItems) {
                await db.query(
                    'INSERT INTO food_order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
                    [orderId, item.id, item.qty, item.price]
                );
            }
            return res.status(201).json({ message: 'Order Placed (SQL)', orderId });
        } catch (dbErr) {
            console.warn("SQL Failed. Falling back to Memory:", dbErr.message);
            const id = reqCounterId++;
            memOrders.push({ id, user_id: req.user.id, total: totalPrice, date: new Date().toISOString(), status: 'preparing' });
            return res.status(201).json({ message: 'Order Placed (Memory)', orderId: id });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to process order.' });
    }
});

// ---- USER DASHBOARD API ---- //
app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
    try {
        try {
            // Fetch User's SQL
            const tablesRes = await db.query(`
                SELECT id, booking_date as date, booking_time as time, guests, occasion, status 
                FROM table_reservations 
                WHERE user_id = $1 ORDER BY booking_date DESC, booking_time DESC
            `, [req.user.id]);

            const ordersRes = await db.query(`
                SELECT id, total_price as total, status, created_at as date 
                FROM food_orders 
                WHERE user_id = $1 ORDER BY created_at DESC
            `, [req.user.id]);

            return res.json({
                reservations: tablesRes.rows,
                orders: ordersRes.rows
            });
        } catch (dbErr) {
            console.warn("SQL Failed. Serving Dashboard from Memory:", dbErr.message);
            const userReservations = memReservations.filter(r => r.user_id === req.user.id);
            const userOrders = memOrders.filter(o => o.user_id === req.user.id);
            return res.json({ reservations: userReservations, orders: userOrders });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to build dashboard.' });
    }
});

app.patch('/api/user/reservations/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await db.query('UPDATE table_reservations SET status = $1 WHERE id = $2 AND user_id = $3', ['cancelled', id, req.user.id]);
            return res.json({ message: 'Reservation cancelled successfully (SQL)' });
        } catch (dbErr) {
            console.warn("SQL Failed. Canceling in Memory:", dbErr.message);
            const reservation = memReservations.find(r => r.id == id && r.user_id === req.user.id);
            if (reservation) reservation.status = 'cancelled';
            return res.json({ message: 'Reservation cancelled successfully (Memory)' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel reservation' });
    }
});

app.patch('/api/user/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await db.query('UPDATE food_orders SET status = $1 WHERE id = $2 AND user_id = $3', ['cancelled', id, req.user.id]);
            return res.json({ message: 'Order cancelled successfully (SQL)' });
        } catch(dbErr) {
            const order = memOrders.find(o => o.id == id && o.user_id === req.user.id);
            if (order) order.status = 'cancelled';
            return res.json({ message: 'Order cancelled successfully (Memory)' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

// Admin stub
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    res.json({ revenue: 0, activeBookings: 0 });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Spicy Hunt backend server is listening on port ${PORT}`);
    });
}

module.exports = app;
