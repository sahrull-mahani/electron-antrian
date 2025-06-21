const daftar_user = document.getElementById('list-users')

async function loadUsers() {
    const users = await ipcRenderer.invoke('get-users')
    if (!users.length) {
        daftar_user.innerHTML = `<tr>
                        <td colspan="5" align="center">Belum ada user..</td>
                    </tr>`
    } else {
        datausers = ''
        users.map((user, key) => {
            datausers += `<tr class="border-b border-gray-200 bg-purple-200">
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-purple-200">
                            ${key+1}
                        </th>
                        <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap bg-purple-200">
                            ${user.nama}
                        </th>
                        <td class="px-6 py-4 text-gray-900">
                            ${user.username}
                        </td>
                        <td class="px-6 py-4 text-gray-900">
                            ${user.loket}
                        </td>
                        <td class="px-6 py-4 text-gray-900">
                            ${user.jenis_kelamin == 'Male' ? 'Laki-laki' : 'Perempuan'}
                        </td>
                        <td class="px-6 py-4 text-gray-900">
                            ${key ? (
                                `<button class="text-sm bg-red-800 text-red-300 py-1 px-2 rounded-lg btn-hapus" data-id="${user.id}">hapus</button>`
                            ): 'not allowed'}
                        </td>
                    </tr>`
        })
        daftar_user.innerHTML = datausers
    }
}
loadUsers()

daftar_user.addEventListener('click', async function(e) {
    if (e.target.classList.contains('btn-hapus')) {
        if (confirm('Hapus akun ini?')) {
            const id = e.target.getAttribute('data-id')
            await ipcRenderer.invoke('delete-user', id)
            loadUsers()
        }
    }
})