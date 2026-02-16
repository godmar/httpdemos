const origin = window.location.origin
const originEl = document.getElementById('sse-origin')
const curlEl = document.getElementById('curl-sse')

if (originEl) {
  originEl.textContent = origin
}

if (curlEl) {
  curlEl.textContent = `curl -N ${origin}/api/sse/clock?count=6\\&intervalMs=700`
}
