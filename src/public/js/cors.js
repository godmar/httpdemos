const origin = window.location.origin
const originEl = document.getElementById('cors-origin')
const curlEl = document.getElementById('curl-cors-options')

if (originEl) {
  originEl.textContent = origin
}

if (curlEl) {
  curlEl.textContent = `curl -i -X OPTIONS ${origin}/api/cors/echo \\
  -H 'Origin: https://example.edu' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: content-type'`
}
