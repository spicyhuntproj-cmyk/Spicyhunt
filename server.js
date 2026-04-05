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
        
        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, 'user']
        );
        return res.status(201).json({ message: 'Royal Access Granted! Please sign in.' });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
        const matchUser = result.rows[0];

        const match = await bcrypt.compare(password, matchUser.password_hash);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: matchUser.id, role: matchUser.role, name: matchUser.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: matchUser.id, name: matchUser.name, role: matchUser.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- RESTAURANT DATA API ---- //
app.get('/api/menu', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// ---- RESERVATION & ORDERS API (PROTECTED) ---- //
app.post('/api/book-table', authenticateToken, async (req, res) => {
    try {
        const { date, time, guests, occasion } = req.body;
        const result = await db.query(
            'INSERT INTO table_reservations (user_id, booking_date, booking_time, guests, occasion) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [req.user.id, date, time, guests, occasion]
        );
        return res.status(201).json({ message: 'Table Reserved Successfully', bookingId: result.rows[0].id });
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ error: 'Failed to reserve table.' });
    }
});

app.post('/api/checkout', authenticateToken, async (req, res) => {
    try {
        const { cartItems, totalPrice } = req.body;
        
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
        return res.status(201).json({ message: 'Royal Feast Order Placed Successfully!', orderId });
    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ error: 'Failed to process order.' });
    }
});

// ---- USER DASHBOARD API ---- //
app.get('/api/user/dashboard', authenticateToken, async (req, res) => {
    try {
        const tablesRes = await db.query('SELECT id, booking_date, booking_time, guests, occasion, status FROM table_reservations WHERE user_id = $1', [req.user.id]);
        const ordersRes = await db.query('SELECT id, total_price, status, created_at FROM food_orders WHERE user_id = $1', [req.user.id]);

        return res.json({
            reservations: tablesRes.rows,
            orders: ordersRes.rows
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: 'Failed to build dashboard.' });
    }
});

app.patch('/api/user/reservations/:id/cancel', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE table_reservations SET status = $1 WHERE id = $2 AND user_id = $3', ['cancelled', req.params.id, req.user.id]);
        return res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel reservation' });
    }
});

app.patch('/api/user/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        await db.query('UPDATE food_orders SET status = $1 WHERE id = $2 AND user_id = $3', ['cancelled', req.params.id, req.user.id]);
        return res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Spicy Hunt backend server is listening on port ${PORT}`);
    });
}

module.exports = app;
