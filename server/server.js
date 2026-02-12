const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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

    const sql = "SELECT * FROM users WHERE Email = ?";

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
            const storedHash = user.Password ?? user.password ?? user.password_hash ?? user.PasswordHash;

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
                id: user.ID,
                username: user.Username,
                email: user.Email
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

            const sql = "INSERT INTO users (Username, Email, Password) VALUES (?, ?, ?)";

            pool.query(sql, [username, email, hashedPassword], (err) => {
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});