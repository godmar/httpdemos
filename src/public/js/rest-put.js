const originEl = document.getElementById('api-origin')
const postEl = document.getElementById('curl-post')
const listEl = document.getElementById('curl-list')
const putEl = document.getElementById('curl-put')
const loadTodosBtn = document.getElementById('load-todos')
const todosOutputEl = document.getElementById('todos-output')

const origin = window.location.origin
if (originEl) {
  originEl.textContent = origin
}

if (postEl) {
  postEl.textContent = `curl -i -X POST ${origin}/api/todos \\
  -H 'content-type: application/json' \\
  -d '{"title":"Write notes","done":false}'`
}

if (listEl) {
  listEl.textContent = `curl -i ${origin}/api/todos`
}

if (putEl) {
  putEl.textContent = `curl -i -X PUT ${origin}/api/todos/42 \\
  -H 'content-type: application/json' \\
  -d '{"title":"Write notes","done":true}'`
}

loadTodosBtn?.addEventListener('click', async () => {
  if (!todosOutputEl) return

  todosOutputEl.textContent = 'Loading...'
  try {
    const res = await fetch('/api/todos')
    const data = await res.json()
    todosOutputEl.textContent = JSON.stringify(data, null, 2)
  } catch (err) {
    todosOutputEl.textContent = `Request failed: ${String(err)}`
  }
})
