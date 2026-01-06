require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { db, isPostgres } = require('./database'); // 

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: "Too many attempts from this IP, please try again later."
});


app.post('/api/contact', limiter, (req, res) => {
    const { name, email, message, bot_check } = req.body;

    if (bot_check && bot_check.length > 0) {
        return res.status(200).json({ message: 'Message sent!' });
    }

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const now = new Date().toISOString();

    if (isPostgres) {

        const sql = `INSERT INTO contacts (name, email, message, date) VALUES ($1, $2, $3, $4) RETURNING id`;
        
        db.query(sql, [name, email, message, now], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({ message: 'Message received (Cloud)!', id: result.rows[0].id });
        });

    } else {

        const sql = `INSERT INTO contacts (name, email, message, date) VALUES (?, ?, ?, ?)`;
        
        db.run(sql, [name, email, message, now], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({ message: 'Message received (Local)!', id: this.lastID });
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});