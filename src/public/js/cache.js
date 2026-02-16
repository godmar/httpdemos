const originEl = document.getElementById('cache-origin')
const curlPublicEl = document.getElementById('curl-cache-public')
const curlPrivateEl = document.getElementById('curl-cache-private')
const curlNoStoreEl = document.getElementById('curl-cache-no-store')

const origin = window.location.origin

if (originEl) {
  originEl.textContent = origin
}

if (curlPublicEl) {
  curlPublicEl.textContent = `curl -v ${origin}/api/cache/public`
}

if (curlPrivateEl) {
  curlPrivateEl.textContent = `curl -v ${origin}/api/cache/private`
}

if (curlNoStoreEl) {
  curlNoStoreEl.textContent = `curl -v ${origin}/api/cache/no-store`
}
