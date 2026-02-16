const urlEl = document.getElementById('network-url')
const imgEl = document.getElementById('network-barcode')

if (urlEl && imgEl) {
  const origin = window.location.origin
  urlEl.textContent = origin
  imgEl.src = `/api/meta/qr.svg?text=${encodeURIComponent(origin)}`
  imgEl.alt = `QR code for ${origin}`
}
