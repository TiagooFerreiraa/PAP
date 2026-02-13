const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ensure uploads directory exists and serve it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// multer storage for product images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        cb(null, name);
    }
});
const upload = multer({ storage });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    res.send("Hello World");
})

app.get('/test-db', (req, res) => {
    pool.query('SELECT 1 + 1 AS result', (err, results ) => {
        if (err) {
            console.error('DB error: ', err);
            return res.status(500).send('Database connection failed');
        }

        res.json({ message: 'Database OK!', result: results[0].result });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    pool.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];
            // Normalize possible column names for the stored hash
            const storedHash = user.password ?? user.Password ?? user.password_hash ?? user.PasswordHash;

            if (!storedHash) {
                console.error('No password hash found for user record:', user);
                return res.status(500).json({ message: "User record missing password hash" });
            }

            let passwordMatch = false;
            try {
                passwordMatch = await bcrypt.compare(password, storedHash);
            } catch (bcryptErr) {
                console.error('bcrypt.compare error:', bcryptErr);
                return res.status(500).json({ message: "Authentication error" });
            }

            if (!passwordMatch) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    });
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const sql = "SELECT ID FROM users WHERE Email = ? OR Username = ?";

        pool.query(sql, [email, username], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: "Email or username already in use"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";

            pool.query(sql, [username, email, hashedPassword, 'user'], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Error creating user" });
                }

                res.status(201).json({
                    message: "User registered successfully"
                });
            });
        });
    } catch {
        res.status(500).json({ message: "Server error" });
    }
});

// defer listening until after routes are registered

// --- Products endpoints ---
app.get('/products', (req, res) => {
    const sql = `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC`;
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/products', upload.single('image'), (req, res) => {
    const body = req.body || {};
    const name = body.name;
    const description = body.description;
    const price = body.price;
    const stock = body.stock;
    const category_id = body.category_id;

    console.log('Received product create:', { body, file: req.file && { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } });

    if (!name || price == null || stock == null) {
        return res.status(400).json({ message: 'Missing fields', received: { body, file: req.file && req.file.filename } });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const sql = 'INSERT INTO products (name, description, price, stock, category_id, image) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(sql, [name, description || null, price, stock, category_id || null, imageUrl], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Product created' });
    });
});

app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    pool.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    });
});

// --- Categories endpoints ---
app.get('/categories', (req, res) => {
    pool.query('SELECT * FROM categories ORDER BY name', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/categories', (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Missing name' });
    pool.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || null], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'Category created' });
    });
});

app.delete('/categories/:id', (req, res) => {
    const { id } = req.params;
    pool.query('DELETE FROM categories WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    });
});

// --- Users endpoints (admin use) ---
app.get('/users', (req, res) => {
    pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/users', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    try {
        const hashed = await bcrypt.hash(password, 10);
        pool.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role || 'user'], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database error' });
            }
            res.status(201).json({ message: 'User created' });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    pool.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});