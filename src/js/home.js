const formPanggilanManual = document.getElementById('panggilan-manual')
const antrianDilewati = document.getElementById('antrian-dilewati')
const button_call_again = document.getElementById('btn-call-again')
const button_next = document.getElementById('btn-next')
const button_skip = document.getElementById('btn-skip')
const nomor_antrian = document.getElementById('nomor-antrian')
const nama_petugas = document.querySelector('.nama-petugas')
const nama_loket = document.querySelector('.nama-loket')
const clear_skipped_queue = document.getElementById('clear-skipped-queue')
const reset_queue = document.getElementById('reset-queue')
const button_list_users = document.getElementById('btn-list-users')
const audio = new Audio('../audio/tingtung.mp3')

const loginSession = JSON.parse(localStorage.getItem('login'))
const { result } = loginSession

if (result.role > 1) {
    button_list_users.remove()
}

const callAudio = (nomor) => {
    audio.play()
        .then(() => console.log("Audio berhasil diputar"))
        .catch(error => console.error("Gagal memutar audio:", error))
    audio.onended = function () {
        try {
            responsiveVoice.speak(`Nomor antrian ${nomor} menuju ${result.loket}`, result.jenis_kelamin == "Female" ?
                "Indonesian Female" : "Indonesian Male")
        } catch (error) {
            console.log(error)
            dangerAlert('Suara tidak dapat dijangkau')
        }
    }
}

const socket = io('http://localhost:3000')

const sendWS = (nomor) => {
    socket.emit('send-antrian', { nomor, loket: result.loket, jenis_kelamin: result.jenis_kelamin })
}

nama_petugas.textContent = result.nama
nama_loket.textContent = result.loket

formPanggilanManual.addEventListener('submit', function (e) {
    e.preventDefault()

    const data = new FormData(this)

    let ent = {}
    for (let entry of data) {
        ent[entry[0]] = entry[1]
    }

    const { nomor } = ent
    const { loket, jenis_kelamin } = result

    if (nomor == '' || nomor < 0) {
        return alert('Masukan nomor antrian yang valid!')
    }

    sendWS(nomor)
})

async function getQueueSkipped() {
    try {
        const queue = await ipcRenderer.invoke('get-queue-skipped')
        // Pastikan queue adalah array sebelum di-map
        return Array.isArray(queue) ? queue : []
    } catch (error) {
        console.error('Error getting skipped queue:', error)
        return [] // Return array kosong jika error
    }
}
async function getQueue() {
    try {
        const queue = await ipcRenderer.invoke('get-queue')
        // Pastikan queue adalah array sebelum di-map
        return Array.isArray(queue) ? queue : []
    } catch (error) {
        console.error('Error getting queue:', error)
        return [] // Return array kosong jika error
    }
}

// Contoh penggunaan dengan mapping
async function processQueues() {
    try {
        const [skippedQueue, normalQueue] = await Promise.all([
            getQueueSkipped(),
            getQueue()
        ])

        // Mapping data skipped queue
        const mappedSkipped = skippedQueue.map(item => ({
            ...item,
            type: 'skipped',
            formattedDate: new Date(item.date).toLocaleDateString('id-ID')
        }))

        // Mapping data normal queue
        const mappedNormal = normalQueue.map(item => ({
            ...item,
            type: 'normal',
            formattedDate: new Date(item.date).toLocaleDateString('id-ID')
        }))

        return {
            skipped: mappedSkipped,
            normal: mappedNormal
        }
    } catch (error) {
        console.error('Error processing queues:', error)
        return {
            skipped: [],
            normal: []
        }
    }
}

// Jalankan proses
const getProgressData = () => {
    processQueues().then(({ normal, skipped }) => {
        console.log('Final Normal:', normal)
        console.log('Final Skipped:', skipped)
        // Lakukan sesuatu dengan hasil mapping

        button_call_again.disabled = normal.length ? false : true
        button_skip.disabled = normal.length ? false : true

        nomor_antrian.textContent = normal.length

        antrianDilewati.innerHTML = ''
        if (!skipped.length) {
            antrianDilewati.innerHTML = `<h1 class="text-lg font-semibold text-center text-gray-500 italic font-mono mt-4 tracking-wider">Tidak ada antrian yang dilewati</h1>`
        } else {
            let dataSkip = ''
            skipped.map((skip) => {
                dataSkip += `<li
                    class="w-full px-4 py-2 border-b bg-orange-700 rounded-lg text-white font-semibold flex justify-between items-center">
                    <h1 class="text-lg">Nomor ${skip.no_antrian}</h1>

                    <div class="inline-flex rounded-md shadow-xs" role="group">
                        <button type="button" data-nomor-antrian=${skip.no_antrian}
                            class="child-panggil-lagi px-4 py-2 text-sm font-medium bg-blue-500 text-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">
                            Panggil
                        </button>
                        <button type="button" data-id=${skip.id}
                            class="child-selesai px-4 py-2 text-sm font-medium bg-green-500 text-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-green-700 focus:z-10 focus:ring-2 focus:ring-green-700 focus:text-green-700">
                            Selesai
                        </button>
                    </div>
                </li>`
            })
            antrianDilewati.innerHTML = dataSkip
        }
    })
}
getProgressData()

antrianDilewati.addEventListener('click', function (e) {
    if (e.target.classList.contains('child-panggil-lagi')) {
        const nomor = e.target.getAttribute('data-nomor-antrian')
        // callAudio(nomor)
        sendWS(nomor)
    }
})
antrianDilewati.addEventListener('click', async function (e) {
    if (e.target.classList.contains('child-selesai')) {
        const id = e.target.getAttribute('data-id')
        await ipcRenderer.invoke('update-queue', { status: 1, id })
        getProgressData()
    }
})

button_call_again.addEventListener('click', async function () {
    const nomor = parseInt(nomor_antrian.textContent)
    // callAudio(nomor)
    sendWS(nomor)
})

button_next.addEventListener('click', async function () {
    let nomor = parseInt(nomor_antrian.textContent)
    const { id } = result
    if (confirm(`Panggil nomor ${nomor + 1} ?`)) {
        nomor_antrian.textContent = nomor + 1

        const currentDate = new Date()
        const dateFormatter = new Intl.DateTimeFormat('en-CA')
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const datePart = dateFormatter.format(currentDate)
        const timePart = timeFormatter.format(currentDate)

        const saveAntrian = {
            tanggal: datePart,
            no_antrian: nomor + 1,
            status: 0,
            updated_at: `${datePart} ${timePart}`,
            id_user: id
        }

        await ipcRenderer.invoke('add-queue', saveAntrian)

        button_call_again.disabled = false
        button_skip.disabled = false
        // callAudio(nomor + 1)
        sendWS(nomor + 1)
    }
})

button_skip.addEventListener('click', async function () {
    const nomor = parseInt(nomor_antrian.textContent)

    if (confirm(`Lewati nomor ${nomor} ini?`)) {

        await ipcRenderer.invoke('update-queue', { status: 2, id: nomor })

        const currentDate = new Date()
        const dateFormatter = new Intl.DateTimeFormat('en-CA')
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const datePart = dateFormatter.format(currentDate)
        const timePart = timeFormatter.format(currentDate)

        const saveAntrian = {
            tanggal: datePart,
            no_antrian: nomor + 1,
            status: 0,
            updated_at: `${datePart} ${timePart}`,
            id_user: result.id
        }

        await ipcRenderer.invoke('add-queue', saveAntrian)

        // callAudio(nomor + 1)
        sendWS(nomor + 1)
        getProgressData()
    }
})

clear_skipped_queue.addEventListener('click', async function () {
    await ipcRenderer.invoke('clear-skipped')
    getProgressData()
})

reset_queue.addEventListener('click', async function () {
    if (confirm('Mulai antrian baru?')) {
        await ipcRenderer.invoke('truncate', 'tbl_antrian')
        getProgressData()
    }
})