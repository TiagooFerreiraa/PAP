const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});