const openBtn = document.getElementById('open')
const out = document.getElementById('out')

openBtn?.addEventListener('click', () => {
  out.textContent = ''
  const es = new EventSource('/api/sse/clock?count=6&intervalMs=700')

  es.addEventListener('tick', (event) => {
    out.textContent += `${event.data}\n`
  })

  es.addEventListener('done', () => {
    out.textContent += '[stream closed]'
    es.close()
  })
})
