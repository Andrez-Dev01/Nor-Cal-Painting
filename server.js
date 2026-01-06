require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./database'); // Import our database file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to read JSON data

// --- ANTI-SPAM RULE 1: Rate Limiting ---
// Only allow 5 requests every 15 minutes from the same IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: "Too many attempts from this IP, please try again later."
});

// The Route
app.post('/api/contact', limiter, (req, res) => {
    const { name, email, message, bot_check } = req.body;

    // --- ANTI-SPAM RULE 2: The Honeypot ---
    // If the hidden 'bot_check' field has ANY text, it is a bot.
    if (bot_check && bot_check.length > 0) {
        console.log(`Bot detected! IP: ${req.ip}`);
        // We lie to the bot and say "Success" so it stops trying
        return res.status(200).json({ message: 'Message sent!' });
    }

    // Validation (Basic)
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Insert into Database
    const sql = `INSERT INTO contacts (name, email, message, date) VALUES (?, ?, ?, ?)`;
    const now = new Date().toISOString();

    db.run(sql, [name, email, message, now], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log(`New contact added. ID: ${this.lastID}`);
        res.json({ message: 'Message received successfully!', id: this.lastID });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});