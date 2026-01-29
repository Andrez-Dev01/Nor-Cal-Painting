require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
    
    console.log("Using PostgreSQL Database (Cloud)...");
    isPostgres = true;
    
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });


    const sql = `CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        message TEXT,
        date TEXT
    )`;
    
    db.query(sql, (err) => {
        if (err) console.error("Error creating table in Postgres:", err);
    });

} else {

    console.log("Using SQLite Database (Local)...");
    
    db = new sqlite3.Database('./contacts.db', (err) => {
        if (err) console.error(err.message);
    });

    const sql = `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        message TEXT,
        date TEXT
    )`;
    
    db.run(sql, (err) => {
        if (err) console.error("Error creating table in SQLite:", err);
    });
}

module.exports = { db, isPostgres };