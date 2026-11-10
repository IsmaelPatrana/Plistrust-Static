import { CONFIG } from './config.js'

const KEY = 'plistrust.provider'

export function providerButtons(type, id, season = 1, episode = 1) {
  const last = localStorage.getItem(KEY)
  const ordered = [...CONFIG.PROVIDERS].sort((a, b) => (a.id === last ? -1 : b.id === last ? 1 : 0))
  return ordered
    .map((p) => `<button class="play-btn" data-play="${p.id}" data-type="${type}" data-id="${id}" data-se="${season}" data-ep="${episode}">▶ Ver en ${p.nombre}</button>`)
    .join('')
}

export async function openPlayer(providerId, type, id, season = 1, episode = 1) {
  const p = CONFIG.PROVIDERS.find((x) => x.id === providerId)
  if (!p) return
  const url = p.url(type, id, season, episode)

  if (p.precheck) {
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' })
      if (!res.ok) {
        showPlayerError(`“${p.nombre}” no tiene disponible este título. Prueba con el otro proveedor.`)
        return
      }
    } catch {
      // sin CORS no se puede validar: se intenta reproducir igual
    }
  }

  localStorage.setItem(KEY, providerId)
  const iframe = document.getElementById('player-frame')
  // Volver a pulsar Play sobre el mismo título tiene que pedir un embed nuevo
  // (si no, el src no cambia y queda clavado en la página de error del proveedor).
  if (iframe.src === url) iframe.src = 'about:blank'
  iframe.src = url
  document.getElementById('modal').classList.remove('hidden')
  document.body.classList.add('modal-open')
}

function showPlayerError(msg) {
  const err = document.getElementById('player-error')
  if (!err) return
  err.textContent = msg
  err.classList.remove('hidden')
  document.getElementById('modal').classList.remove('hidden')
}

export function closePlayer() {
  const iframe = document.getElementById('player-frame')
  iframe.src = 'about:blank'
  const err = document.getElementById('player-error')
  if (err) err.classList.add('hidden')
  document.getElementById('modal').classList.add('hidden')
  document.body.classList.remove('modal-open')
}
