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

// Middleware to verify ADMIN ONLY
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

// ---- AUTHENTICATION API ----

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
        console.error("Registration Error:", error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials (User not found)' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(400).json({ error: 'Invalid credentials (Password mismatch)' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ---- DATA API ----

// Fetch all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM rooms ORDER BY price ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Fetch all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM menu_items ORDER BY category, price ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// Create a room booking (Protected Route)
app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, guests, totalPrice } = req.body;
        
        const result = await db.query(
            'INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, total_price, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [req.user.id, roomId, checkIn, checkOut, totalPrice, 'confirmed']
        );
        res.status(201).json({ message: 'Booking successful', bookingId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Submit Food or Table Request (Protected Route)
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        // Here we just log it or mock an order table insertion, returning success
        res.status(201).json({ message: 'Request received successfully' });
    } catch (error) {
         res.status(500).json({ error: 'Failed to process request' });
    }
});

// ---- ADMIN API (PROTECTED) ----

// Fetch all bookings for Admin
app.get('/api/admin/bookings', authenticateAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT b.id, u.name as guest, r.room_type as room, b.total_price as price, b.status 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN rooms r ON b.room_id = r.id 
            ORDER BY b.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin bookings' });
    }
});

// Update booking status
app.patch('/api/admin/bookings/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Get Admin Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const revResult = await db.query('SELECT SUM(total_price) as total FROM bookings WHERE status != $1', ['cancelled']);
        const countResult = await db.query('SELECT COUNT(*) as active FROM bookings WHERE status != $1', ['checked-out']);
        res.json({
            revenue: parseFloat(revResult.rows[0].total || 0),
            activeBookings: parseInt(countResult.rows[0].active || 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Start the server if running locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Luxe backend server is listening on port ${PORT}`);
    });
}

// Important for Vercel to treat this as a Serverless Function
module.exports = app;
