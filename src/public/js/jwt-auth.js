const out = document.getElementById('out')
let accessToken = ''

async function showResponse (res) {
  const text = await res.text()
  out.textContent = `${res.status}\n${text}`
}

document.getElementById('login')?.addEventListener('click', async () => {
  const username = document.getElementById('user')?.value ?? ''
  const res = await fetch('/api/jwt/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username })
  })

  const data = await res.json()
  accessToken = data.accessToken ?? ''
  out.textContent = JSON.stringify(data, null, 2)
})

document.getElementById('me')?.addEventListener('click', async () => {
  const res = await fetch('/api/jwt/me', {
    headers: { authorization: `Bearer ${accessToken}` }
  })
  await showResponse(res)
})

document.getElementById('refresh')?.addEventListener('click', async () => {
  const res = await fetch('/api/jwt/refresh', {
    method: 'POST',
    credentials: 'include'
  })

  const data = await res.json()
  if (data.accessToken) {
    accessToken = data.accessToken
  }
  out.textContent = JSON.stringify(data, null, 2)
})

document.getElementById('logout')?.addEventListener('click', async () => {
  const res = await fetch('/api/jwt/logout', {
    method: 'POST',
    credentials: 'include'
  })
  await showResponse(res)
})
