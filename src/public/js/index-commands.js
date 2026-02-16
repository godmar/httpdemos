const origin = window.location.origin

const indexCache = document.getElementById('index-curl-cache')
const indexPut = document.getElementById('index-curl-put')

if (indexCache) {
  indexCache.textContent = `curl -i ${origin}/api/cache/public`
}

if (indexPut) {
  indexPut.textContent = `curl -i -X PUT ${origin}/api/todos/42 \\
  -H 'content-type: application/json' \\
  -d '{"title":"Learn PUT","done":false}'`
}
