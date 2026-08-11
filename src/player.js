import { CONFIG } from './config.js'

const KEY = 'plistrust.provider'

export function providerButtons(movieId) {
  const last = localStorage.getItem(KEY)
  const ordered = [...CONFIG.PROVIDERS].sort((a, b) => (a.id === last ? -1 : b.id === last ? 1 : 0))
  return ordered
    .map((p) => `<button class="play-btn" data-play="${p.id}" data-id="${movieId}">▶ Ver en ${p.nombre}</button>`)
    .join('')
}

export function openPlayer(providerId, movieId) {
  const p = CONFIG.PROVIDERS.find((x) => x.id === providerId)
  if (!p) return
  localStorage.setItem(KEY, providerId)
  const iframe = document.getElementById('player-frame')
  iframe.src = p.url(movieId)
  document.getElementById('modal').classList.remove('hidden')
  document.body.classList.add('modal-open')
}

export function closePlayer() {
  const iframe = document.getElementById('player-frame')
  iframe.src = 'about:blank'
  document.getElementById('modal').classList.add('hidden')
  document.body.classList.remove('modal-open')
}
