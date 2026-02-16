const origin = window.location.origin
const originEl = document.getElementById('chunked-origin')
const curlEl = document.getElementById('curl-chunked')

if (originEl) {
  originEl.textContent = origin
}

if (curlEl) {
  curlEl.textContent = `curl -i ${origin}/api/chunked/time?count=4\\&intervalMs=1000`
}
