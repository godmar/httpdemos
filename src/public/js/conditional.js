const origin = window.location.origin
const originEl = document.getElementById('conditional-origin')
const firstEl = document.getElementById('curl-conditional-first')
const missEl = document.getElementById('curl-conditional-miss')
const hitEl = document.getElementById('curl-conditional-hit')

if (originEl) {
  originEl.textContent = origin
}

if (firstEl) {
  firstEl.textContent = `curl -i ${origin}/api/conditional/resource`
}

if (missEl) {
  missEl.textContent = `curl -i ${origin}/api/conditional/resource \\
  -H 'If-None-Match: "definitely-not-the-current-etag"'`
}

if (hitEl) {
  hitEl.textContent = `ETAG=$(curl -si ${origin}/api/conditional/resource | awk -F': ' '/^ETag:/{print $2}' | tr -d '\\r')
curl -i ${origin}/api/conditional/resource \\
  -H "If-None-Match: $ETAG"`
}
