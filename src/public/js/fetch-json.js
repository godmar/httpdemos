const sendBtn = document.getElementById('send')
const out = document.getElementById('out')

sendBtn?.addEventListener('click', async () => {
  const msgInput = document.getElementById('msg')
  const message = msgInput?.value ?? ''

  const res = await fetch('/api/fetch-json/echo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message })
  })

  out.textContent = JSON.stringify(await res.json(), null, 2)
})
