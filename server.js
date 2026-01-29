require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { db, isPostgres } = require('./database');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
});
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api/contact', contactLimiter);

console.log('isPostgres:', isPostgres)

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: "Too many attempts from this IP, please try again later."
});

app.post('/api/contact', limiter, async (req, res) => {
    const { name, email, message, bot_check } = req.body;

    if (bot_check && bot_check.length > 0) return res.status(200).json({ message: 'Message sent!' });
    if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });

    const now = new Date().toISOString();

    try {
        if (isPostgres) {
            
            const sql = `INSERT INTO contacts (name, email, message, date) VALUES ($1, $2, $3, $4) RETURNING id`;

            await new Promise((resolve, reject) => {
                db.query(sql, [name, email, message, now], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        } else {

            const sql = `INSERT INTO contacts (name, email, message, date) VALUES (?, ?, ?, ?)`;
            await new Promise((resolve, reject) => {
                db.run(sql, [name, email, message, now], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
        }
    } catch (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ error: "Failed to save message to database." });
    }

    try {

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_OWNER,
            subject: `New Lead: ${name}`,
            text: `You have a new message from your website!\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`
        });


        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Thanks for contacting us!",
            text: `Hi ${name},\n\nThanks for reaching out! We received your message and will get back to you shortly.\n\nBest,\nThe Team`
        });

        console.log("Emails sent successfully!");
        res.json({ message: 'Message received and emails sent!' });

    } catch (emailErr) {
        console.error("Email Error:", emailErr);
        res.json({ message: 'Message received!' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});