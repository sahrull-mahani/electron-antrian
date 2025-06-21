const db = require('./db')
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10; // Tingkat kesulitan hashing

module.exports = {
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT id, nama, jenis_kelamin, username, loket, role FROM tbl_user", [], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    },

    addUser: async (user) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash password sebelum disimpan
                const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

                db.run(
                    `INSERT INTO tbl_user 
                    (nama, jenis_kelamin, username, password, loket, role) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        user.nama,
                        user.jenis_kelamin,
                        user.username,
                        hashedPassword, // Simpan yang sudah di-hash
                        user.loket,
                        user.role
                    ],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    },

    // Fungsi untuk verifikasi login
    verifyUser: async (username, password) => {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT * FROM tbl_user WHERE username = ?",
                [username],
                async (err, user) => {
                    if (err) return reject(err);
                    if (!user) return resolve('404');

                    // Bandingkan password dengan hash
                    const isMatch = await bcrypt.compare(password, user.password);
                    console.log(isMatch)
                    if (isMatch) {
                        resolve(user);
                    } else {
                        resolve('404');
                    }
                }
            );
        });
    },

    deleteUser: (id) => {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM tbl_user WHERE id = ?", [id], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    },

    getQueue: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM tbl_antrian", [], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    },

    queueSkipped: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tbl_antrian WHERE status = ?', [2], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    },

    addQueue: (queue) => {
        return new Promise((resolve, reject) => {
            try {
                // Pertama, cek apakah sudah ada antrian dengan no_antrian dan status yang sama
                db.get(
                    `SELECT id FROM tbl_antrian 
                    WHERE no_antrian = ? AND status = ?`,
                    [queue.no_antrian, queue.status],
                    (err, existingRow) => {
                        if (err) return reject(err);

                        // Jika sudah ada, reject dengan pesan error
                        if (existingRow) {
                            return reject(new Error(`Nomor antrian ${queue.no_antrian} dengan status ${queue.status} sudah ada`));
                        }

                        // Jika belum ada, lakukan insert
                        db.run(
                            `INSERT INTO tbl_antrian 
                            (tanggal, no_antrian, status, updated_at, id_user) 
                            VALUES (?, ?, ?, ?, ?)`,
                            [
                                queue.tanggal,
                                queue.no_antrian,
                                queue.status,
                                queue.updated_at,
                                queue.id_user,
                            ],
                            function (err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    },

    updateQueue: (queue) => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE tbl_antrian SET status = ? WHERE id = ?", [queue.status, queue.id], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    },

    clearQueueSkipped: () => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE tbl_antrian SET status = ?", [1], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    },

    truncateData : (table) => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM ${table}`, [], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
            db.run(`DELETE FROM sqlite_sequence WHERE name = '${table}'`, [], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    }
}