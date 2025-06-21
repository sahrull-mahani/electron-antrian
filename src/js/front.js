ipcRenderer.on('play', (event, arg) => {
    if (arg == 'check sound') {
        const audio = new Audio('../audio/tingtung.mp3')

        audio.play()
            .then(() => console.log("Audio berhasil diputar"))
            .catch(error => console.error("Gagal memutar audio:", error))
    }
})

function updateWaktu() {
    const sekarang = new Date()
    document.getElementById('waktu-realtime').textContent =
        sekarang.toLocaleTimeString('en-US', { hour12: false })

    requestAnimationFrame(updateWaktu)
}

updateWaktu()

const formatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
})

const tanggalIndonesia = formatter.format(new Date())
document.getElementById('tanggal-realtime').textContent = tanggalIndonesia

const audio = new Audio('../audio/tingtung.mp3')
const callAudio = (data) => {
    const { nomor, loket, jenis_kelamin } = data
    audio.play()
        .then(() => console.log("Audio berhasil diputar"))
        .catch(error => console.error("Gagal memutar audio:", error))
    audio.onended = function () {
        try {
            responsiveVoice.speak(`Nomor antrian ${nomor} menuju ${loket}`, jenis_kelamin == "Female" ?
                "Indonesian Female" : "Indonesian Male")
        } catch (error) {
            console.log(error)
            dangerAlert('Suara tidak dapat dijangkau')
        }
    }
}

async function getQueue() {
    try {
        const queue = await ipcRenderer.invoke('get-queue')
        document.getElementById('nomor-antrian').textContent = queue.length
    } catch (error) {
        console.error('Error getting queue:', error)
        dangerAlert('Ada yang salah dengan daftar nomor antrian')
    }
}
getQueue()

const socket = io('http://localhost:3000')

// Terima update realtime
socket.on('call-antrian', (data) => {
    console.log(`Antrian baru: ${data.nomor}`, data)
    getQueue()
    callAudio(data)
})