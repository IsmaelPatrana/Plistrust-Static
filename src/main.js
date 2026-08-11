import './style.css'
import { CONFIG } from './config.js'
import { isLogged, login, logout, checkPassword } from './auth.js'
import { getList, getByGenre, getMovie, search, poster } from './api.js'
import { providerButtons, openPlayer, closePlayer } from './player.js'

const $ = (sel) => document.querySelector(sel)

const FAV_KEY = 'plistrust.favs'
const CONT_KEY = 'plistrust.continue'
const movieCache = new Map()

const SECTIONS = [
  { titulo: 'Populares', load: () => getList('popular') },
  { titulo: 'En cines', load: () => getList('now_playing') },
  { titulo: 'Mejor valoradas', load: () => getList('top_rated') },
]
const GENRES = [
  [28, 'Acción'], [35, 'Comedia'], [27, 'Terror'],
  [878, 'Ciencia ficción'], [12, 'Aventura'], [18, 'Drama'],
]

const getFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || '{}')
const setFavs = (f) => localStorage.setItem(FAV_KEY, JSON.stringify(f))
const isFav = (id) => id in getFavs()
const getCont = () => JSON.parse(localStorage.getItem(CONT_KEY) || 'null')
const summary = (m) => ({ id: m.id, title: m.title, poster_path: m.poster_path, release_date: m.release_date })

function card(m) {
  const fav = isFav(m.id)
  return `
  <article class="card" data-movie="${m.id}">
    <img src="${poster(m.poster_path)}" alt="${m.title}" loading="lazy" />
    <button class="fav ${fav ? 'on' : ''}" data-fav="${m.id}" title="Favorito">${fav ? '♥' : '♡'}</button>
    <div class="card-body">
      <h3>${m.title}</h3>
      <span>${m.release_date?.slice(0, 4) || '—'} · ⭐ ${m.vote_average?.toFixed(1) ?? '—'}</span>
    </div>
  </article>`
}

const skeleton = (n) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join('')

function errorMsg() {
  return CONFIG.TMDB_KEY.includes('PON_AQUI')
    ? '<p class="empty">Falta configurar la clave de TMDB en <code>src/config.js</code></p>'
    : '<p class="empty">No se pudo cargar el catálogo (revisa red o límite de API)</p>'
}

function fillTrack(id, promise) {
  promise
    .then((d) => {
      const el = document.getElementById(id)
      if (!el) return
      d.results.forEach((m) => movieCache.set(m.id, m))
      el.innerHTML = d.results.length ? d.results.map(card).join('') : '<p class="empty">Sin resultados</p>'
    })
    .catch(() => {
      const el = document.getElementById(id)
      if (el) el.innerHTML = errorMsg()
    })
}

function row(titulo, promise, id) {
  fillTrack(id, promise)
  return `<section class="row" id="${id}"><h2>${titulo}</h2><div class="track">${skeleton(10)}</div></section>`
}

function renderHome() {
  const main = $('#main')
  const cont = getCont()
  const favs = getFavs()
  let html = ''
  if (cont) html += row('Continuar viendo', Promise.resolve({ results: [cont] }), 'row-cont')
  if (Object.keys(favs).length) html += row('Mis favoritos', Promise.resolve({ results: Object.values(favs) }), 'row-favs')
  SECTIONS.forEach((s, i) => { html += row(s.titulo, s.load(), 'row-' + i) })
  GENRES.forEach(([gid, nombre]) => { html += row(nombre, getByGenre(gid), 'g-' + gid) })
  main.innerHTML = html
  document.title = 'Plistrust'
}

async function openDetail(id) {
  $('#main').innerHTML = `<div class="track">${skeleton(6)}</div>`
  try {
    const m = await getMovie(id)
    movieCache.set(m.id, m)
    localStorage.setItem(CONT_KEY, JSON.stringify(summary(m)))
    renderDetail(m)
  } catch {
    $('#main').innerHTML = errorMsg()
  }
}

function renderDetail(m) {
  const fav = isFav(m.id)
  const bg = poster(m.backdrop_path, 'w1280') || poster(m.poster_path, 'w500')
  document.title = `${m.title} — Plistrust`
  $('#main').innerHTML = `
  <section class="detail">
    ${bg ? `<img class="detail-bg" src="${bg}" alt="" />` : ''}
    <button class="back" data-back>← Volver</button>
    <div class="detail-info">
      <img class="detail-poster" src="${poster(m.poster_path, 'w500')}" alt="${m.title}" />
      <div>
        <h2>${m.title} <span class="year">(${m.release_date?.slice(0, 4) || '—'})</span></h2>
        <p class="meta">⭐ ${m.vote_average?.toFixed(1) ?? '—'} · ${m.runtime ?? '—'} min · ${(m.genres || []).map((g) => g.name).join(', ')}</p>
        <p class="overview">${m.overview || 'Sin sinopsis disponible.'}</p>
        <div class="actions">
          ${providerButtons(m.id)}
          <button class="fav big ${fav ? 'on' : ''}" data-fav="${m.id}">${fav ? '♥ Favorito' : '♡ Favorito'}</button>
        </div>
      </div>
    </div>
  </section>`
}

function toggleFav(id, btn) {
  const favs = getFavs()
  if (id in favs) delete favs[id]
  else if (movieCache.has(id)) favs[id] = summary(movieCache.get(id))
  setFavs(favs)
  const on = id in favs
  btn.classList.toggle('on', on)
  btn.innerHTML = btn.classList.contains('big') ? (on ? '♥ Favorito' : '♡ Favorito') : (on ? '♥' : '♡')
  if (!Object.keys(favs).length) renderHome()
  else {
    const frow = $('#row-favs')
    if (frow) frow.querySelector('.track').innerHTML = Object.values(favs).map(card).join('')
  }
}

async function doSearch(q) {
  $('#main').innerHTML = `<section class="row"><h2>Resultados para “${q}”</h2><div class="track" id="search-track">${skeleton(10)}</div></section>`
  document.title = `Buscar: ${q} — Plistrust`
  try {
    const d = await search(q)
    d.results.forEach((m) => movieCache.set(m.id, m))
    $('#search-track').innerHTML = d.results.length
      ? d.results.map(card).join('')
      : '<p class="empty">Sin resultados</p>'
  } catch {
    $('#search-track').innerHTML = errorMsg()
  }
}

function onDocClick(e) {
  const favBtn = e.target.closest('[data-fav]')
  if (favBtn) { toggleFav(favBtn.dataset.fav, favBtn); return }
  const play = e.target.closest('[data-play]')
  if (play) { openPlayer(play.dataset.play, play.dataset.id); return }
  const cardEl = e.target.closest('[data-movie]')
  if (cardEl) { openDetail(cardEl.dataset.movie); return }
  if (e.target.closest('[data-back]')) { renderHome(); return }
  if (e.target.id === 'modal') closePlayer()
}

function showGate() {
  $('#app').classList.add('hidden')
  $('#gate').classList.remove('hidden')
  $('#password-input').focus()
}

function showApp() {
  $('#gate').classList.add('hidden')
  $('#app').classList.remove('hidden')
  renderHome()
}

function init() {
  isLogged() ? showApp() : showGate()

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const err = $('#login-error')
    err.classList.add('hidden')
    if (await checkPassword($('#password-input').value)) {
      login()
      showApp()
    } else {
      err.classList.remove('hidden')
      $('#password-input').value = ''
      $('#password-input').focus()
    }
  })

  $('#logout-btn').addEventListener('click', () => { logout(); showGate() })
  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const q = $('#search-input').value.trim()
    if (q) doSearch(q)
  })
  $('#modal-close').addEventListener('click', closePlayer)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePlayer() })
}

init()
