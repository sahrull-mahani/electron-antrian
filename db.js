const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const bcrypt = require('bcryptjs');
const { app } = require('electron');
const SALT_ROUNDS = 10; // Tingkat kesulitan hashing

// const DB_PATH = path.join(__dirname, 'database.sqlite')
const DB_PATH = path.join(app.getPath('userData'), 'database.sqlite')

let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database error:', err)
    } else {
        console.log('Connected to SQLite database')
        initializeDatabase()
    }
})

function initializeDatabase() {
    db.serialize(async () => {
        // Tabel tbl_user
        db.run(`CREATE TABLE IF NOT EXISTS tbl_user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            jenis_kelamin TEXT CHECK(jenis_kelamin IN ('Female', 'Male')) NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            loket TEXT,
            role INTEGER NOT NULL
        )`);

        // Tabel tb_antrian
        db.run(`CREATE TABLE IF NOT EXISTS tbl_antrian (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT NOT NULL,
            no_antrian INTEGER NOT NULL,
            status INTEGER CHECK(status IN (0, 1, 2)) NOT NULL,
            updated_at TEXT,
            id_user INTEGER,
            FOREIGN KEY (id_user) REFERENCES tbl_user(id)
        )`);

        const username = 'admin';
        const userExists = await new Promise((resolve, reject) => {
            db.get(
                "SELECT 1 FROM tbl_user WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                }
            );
        });

        if (!userExists) {
            const hashedPassword = await bcrypt.hash('admin', SALT_ROUNDS);

            db.run(
                `INSERT INTO tbl_user 
                        (nama, jenis_kelamin, username, password, loket, role) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                ['admin', 'Male', username, hashedPassword, 'Loket Penerimaan Obat', 1],
                function (err) {
                    if (err) {
                        console.error('Gagal insert user admin:', err);
                        reject(err);
                    } else {
                        console.log('User admin berhasil dibuat');
                        // resolve(true);
                    }
                }
            );
        } else {
            console.log('User admin sudah ada');
            // resolve(true);
        }
    });
}

module.exports = db