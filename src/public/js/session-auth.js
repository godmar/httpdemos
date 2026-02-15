const out = document.getElementById('out')
let csrf = ''

async function showResponse (res) {
  const text = await res.text()
  out.textContent = `${res.status}\n${text}`
}

document.getElementById('login')?.addEventListener('click', async () => {
  const username = document.getElementById('u')?.value ?? ''
  const res = await fetch('/api/session/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username })
  })

  const data = await res.json()
  csrf = data.csrfToken ?? ''
  out.textContent = JSON.stringify(data, null, 2)
})

document.getElementById('me')?.addEventListener('click', async () => {
  const res = await fetch('/api/session/me', { credentials: 'include' })
  await showResponse(res)
})

document.getElementById('mutate')?.addEventListener('click', async () => {
  const res = await fetch('/api/session/protected-action', {
    method: 'POST',
    credentials: 'include',
    headers: { 'x-csrf-token': csrf }
  })
  await showResponse(res)
})

document.getElementById('logout')?.addEventListener('click', async () => {
  const res = await fetch('/api/session/logout', {
    method: 'POST',
    credentials: 'include'
  })
  await showResponse(res)
})
