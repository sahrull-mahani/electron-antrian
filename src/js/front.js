const audio = new Audio('../audio/tingtung.mp3')
const audio_nomor_antrian = new Audio('../audio/speech antrian/nomor antrian.mp3')
const loket_penerimaan_obat = new Audio('../audio/speech antrian/menuju ke loket penerimaan obat.mp3')

// Fungsi untuk memutar sequence audio
function playAudioSequence(audioKeys) {
    if (audioKeys.length === 0) return

    const currentAudio = new Audio('../audio/speech antrian/' + audioKeys[0] + '.mp3')
    if (!currentAudio) {
        console.error(`Audio ${audioKeys[0]} tidak ditemukan`)
        return
    }

    currentAudio.play()
        .catch(error => console.error(`Gagal memutar audio ${audioKeys[0]}:`, error))

    setTimeout(() => {
        const remainingAudios = audioKeys.slice(1)
        if (remainingAudios.length > 0) {
            playAudioSequence(remainingAudios)
        }
    }, 700);
}

ipcRenderer.on('play', (event, arg) => {
    if (arg == 'check sound') {
        audio.play()
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

const callAudio = (data) => {
    const { nomor } = data
    const array_numbers = String(nomor).split('')
    let numbers = [1]

    if (nomor < 20) {
        numbers = [nomor]
    } else if (nomor >= 20 && nomor % 10 === 0 && nomor < 100) {
        numbers = array_numbers
    } else if (nomor >= 20 && nomor < 100) {
        array_numbers.splice(1, 0, '0')
        numbers = array_numbers
    } else if (nomor == 100) {
        numbers = [100]
    } else if (nomor > 100 && nomor < 120) {
        array_numbers.shift()
        numbers = [100]
        numbers.push(parseInt(array_numbers.join('')))
    } else if (nomor >= 120 && nomor < 200) {
        numbers = [100]
        array_numbers.shift()
        numbers.push(...array_numbers)
        if (numbers[2] > 0) {
            numbers.splice(2, 0, '0')
        }
    } else if (nomor >= 200 && nomor < 1000) {
        numbers = [array_numbers[0], '00']
        number_2digits = parseInt(array_numbers.slice(1).join(''))
        if (number_2digits > 0 && number_2digits < 20) {
            numbers.push(number_2digits)
        } else if (number_2digits > 19) {
            if (number_2digits % 10 === 0) {
                numbers.push(...(String(number_2digits).split('')))
            } else {
                numbers.push(...(String(number_2digits).split('')))
                numbers.splice(3, 0, '0')
            }
        }
    }

    numbers.push('menuju ke loket penerimaan obat')

    audio.play()
        .catch(error => console.error("Gagal memutar audio:", error))

    audio.onended = function () {
        audio_nomor_antrian.play()
            .catch(error => console.error("Gagal memutar audio:", error))
        setTimeout(() => {
            playAudioSequence(numbers)
        }, 1300);
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
    getQueue()
    callAudio(data)
})