const { exec } = require('child_process');

const isConnected = window.navigator.onLine

const onlynumber = document.querySelector('.only-number')
if (typeof (onlynumber) != 'undefined' && onlynumber != null) {
    onlynumber.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1')
    })

}

function dangerAlert(text) {
    const alert = document.getElementById('my-alert')
    alert.classList.remove('hidden')
    alert.classList.add('flex')

    const intext = document.querySelector('#my-alert > div')
    intext.innerHTML = ''
    if (typeof text === 'string') {
        intext.innerHTML = `<span class="font-medium text-xl">Info alert!</span> <span class="text-xl">${text}</span>.`
    } else {
        let mess = '<span class="font-medium">Pastikan persyaratan ini terpenuhi:</span>'
        mess += ' <ul class="mt-1.5 list-disc list-inside">'
        Object.entries(text).forEach(elm => {
            mess += `<li>${elm[1].toString()}</li>`
        })
        mess += '</ul>'
        intext.insertAdjacentHTML('afterbegin', mess)
    }
}

function load_page(component, div) {
    qr = new XMLHttpRequest()
    qr.open('get', `../components/${component}.html`)
    qr.send()
    qr.onload = function () { div.insertAdjacentHTML('afterbegin', qr.responseText) }
}

function rm_loadpage(component) {
    document.getElementById(`component-${component}`).remove()
}

function waitForElm(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector))
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector))
                observer.disconnect()
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })
    })
}

function showOSK() {
    exec('osk.exe', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error showing OSK: ${error}`);
        }
        // stdout dan stderr mungkin berisi output dari perintah
    });
}

const keyboardElement = document.querySelector('.keyboard-on-screen')
if (keyboardElement) {
    keyboardElement.addEventListener('click', function () {
        // Panggil fungsi ini ketika Anda ingin menampilkan OSK
        showOSK()
    })
}

const buttonRefresh = document.querySelector('.btn-refresh')
if (buttonRefresh) {
    buttonRefresh.addEventListener('click', function () {
        window.location.reload()
    })
}