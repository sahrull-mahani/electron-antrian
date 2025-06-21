require('dotenv').config()
const { app, BrowserWindow, ipcMain, dialog, Menu, globalShortcut } = require('electron')
const path = require('path')
const api = require('./api')
const express = require('express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')

// Buat server HTTP dan Socket.io
const appExpress = express()
const server = createServer(appExpress)
const io = new Server(server)

io.on('connection', (socket) => {
    console.log('Client terhubung')

    // Kirim data ke client saat ada antrian baru
    socket.on('send-antrian', (result) => {
        io.emit('call-antrian', result)
    })
})

// Jalankan server di port 3000
server.listen(3000, () => console.log('Server Socket.io berjalan di port 3000'))

function createWindow() {
    const win = new BrowserWindow({
        frame: false,
        autoHideMenuBar: true,
        alwaysOnTop: false,
        resizable: true,
        minimizable: false,
        width: 800,
        height: 600,
        fullscreen: true,
        focusable: true,
        show: false,
        icon: __dirname + '/assets/img/LOGO_KOTA_GORONTALO.png',
        webPreferences: {
            devTools: true,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    // win.webContents.openDevTools()
    win.loadFile(path.join(__dirname, 'src/pages/index.html'))

    win.on('close', function (e) {
        const choice = dialog.showMessageBoxSync(this, {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Keluar',
            message: 'Anda yakin ingin keluar...?',
            detail: 'Tekan tombol Yes jika Anda benar-benar ingin mengakhiri sesi ini. Tapi jika Anda masih belum yakin silahkan pilih No / klik tombol Batal!'
        })

        if (choice === 1) {
            e.preventDefault()
        }
    })

    ipcMain.handle('get-users', async () => {
        return await api.getAllUsers()
    })

    ipcMain.handle('add-user', async (event, user) => {
        return await api.addUser(user)
    })

    ipcMain.handle('delete-user', async (event, id) => {
        return await api.deleteUser(id)
    })

    ipcMain.handle('verify-user', async (event, arg) => {
        const { username, password } = arg
        return await api.verifyUser(username, password)
    })

    ipcMain.handle('get-queue-skipped', async () => {
        return await api.queueSkipped()
    })

    ipcMain.handle('add-queue', async (event, queue) => {
        return await api.addQueue(queue)
    })

    ipcMain.handle('get-queue', async () => {
        return await api.getQueue()
    })

    ipcMain.handle('update-queue', async (event, queue) => {
        return await api.updateQueue(queue)
    })

    ipcMain.handle('clear-skipped', async () => {
        return await api.clearQueueSkipped()
    })

    ipcMain.handle('truncate', async (event, table) => {
        return await api.truncateData(table)
    })

    let secondWin = null

    ipcMain.handle('fullscreen', () => {
        if (secondWin && !secondWin.isDestroyed()) {
            secondWin.setFullScreen(true)
        }
    })

    ipcMain.on('logout', () => {
        if (secondWin && !secondWin.isDestroyed()) {
            secondWin.hide()
        }
    })

    win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'l') {
            event.preventDefault()

            secondWin = new BrowserWindow({
                width: 800,
                height: 900,
                autoHideMenuBar: true,
                frame: false,
                resizable: true,
                transparent: true,
                alwaysOnTop: false,
                focusable: true,
                show: false,
                icon: __dirname + '/assets/img/LOGO_KOTA_GORONTALO.png',
                webPreferences: {
                    devTools: true,
                    nodeIntegration: true,
                    contextIsolation: false,
                    preload: path.join(__dirname, 'preload.js')
                }
            })

            secondWin.loadFile(path.join(__dirname, 'src/pages/login.html'))
            secondWin.center()
            secondWin.show()

            // Bersihkan saat window ditutup
            secondWin.on('closed', () => {
                secondWin = null
            })
        }
        if (input.control && input.key.toLowerCase() === 'n') {
            event.preventDefault()
            secondWin = new BrowserWindow({
                width: 800,
                height: 900,
                autoHideMenuBar: true,
                frame: false,
                resizable: true,
                transparent: true,
                alwaysOnTop: false,
                focusable: true,
                show: false,
                icon: __dirname + '/assets/img/LOGO_KOTA_GORONTALO.png',
                webPreferences: {
                    devTools: true,
                    nodeIntegration: true,
                    contextIsolation: false,
                    preload: path.join(__dirname, 'preload.js')
                }
            })

            secondWin.loadFile(path.join(__dirname, 'src/pages/register.html'))
            secondWin.center()
            secondWin.show()

            // Bersihkan saat window ditutup
            secondWin.on('closed', () => {
                secondWin = null
            })
        }
        if (input.control && input.key.toLowerCase() === 't') {
            event.preventDefault()
            win.webContents.send('play', 'check sound')
        }
    })

    win.show()
}

app.whenReady().then(() => {
    createWindow()
})

ipcMain.on('keluar', (even) => {
    app.quit() // Lanjutkan untuk keluar aplikasi
})

app.on('window-all-closed', () => {
    app.quit()
})
