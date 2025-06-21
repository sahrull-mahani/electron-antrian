const { ipcRenderer } = require('electron')

document.addEventListener('DOMContentLoaded', function () {
    const btn_logout = document.getElementById('btn-logout')

    if (btn_logout) {
        btn_logout.addEventListener('click', function () {
            if (confirm('Akhiri sesi ini?')) {
                localStorage.clear()
                ipcRenderer.send('logout')
            }
        })
    }
})