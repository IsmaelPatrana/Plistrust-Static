import './style.css'
import { CONFIG } from './config.js'
import { isLogged, login, logout, checkPassword } from './auth.js'
import { getList, getByGenre, getDetails, getSeason, search, poster } from './api.js'
import { providerButtons, openPlayer, closePlayer } from './player.js'

const $ = (sel) => document.querySelector(sel)

const FAV_KEY = 'plistrust.favs'
const CONT_KEY = 'plistrust.continue'
const movieCache = new Map()

const getFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || '{}')
const setFavs = (f) => localStorage.setItem(FAV_KEY, JSON.stringify(f))
const isFav = (id) => id in getFavs()
const getCont = () => JSON.parse(localStorage.getItem(CONT_KEY) || 'null')

const uid = (m) => `${m.media_type || 'movie'}_${m.id}`
const summary = (m) => ({ 
  id: m.id, 
  media_type: m.media_type || 'movie', 
  title: m.title || m.name, 
  poster_path: m.poster_path, 
  release_date: m.release_date || m.first_air_date,
  vote_average: m.vote_average
})

function card(m) {
  const m_uid = uid(m)
  const fav = isFav(m_uid)
  const title = m.title || m.name
  const date = m.release_date || m.first_air_date
  return `
  <article class="card" data-uid="${m_uid}" data-id="${m.id}" data-type="${m.media_type || 'movie'}">
    <img src="${poster(m.poster_path)}" alt="${title}" loading="lazy" />
    <button class="fav ${fav ? 'on' : ''}" data-fav="${m_uid}" title="Favorito">${fav ? '♥' : '♡'}</button>
    <div class="card-body">
      <h3>${title}</h3>
      <span>${date?.slice(0, 4) || '—'} · ⭐ ${m.vote_average?.toFixed(1) ?? '—'}</span>
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
      const track = el.classList.contains('track') ? el : el.querySelector('.track')
      if (!track) return
      const valid = (d.results || []).filter(m => m.media_type === 'movie' || m.media_type === 'tv')
      valid.forEach((m) => movieCache.set(uid(m), m))
      track.innerHTML = valid.length ? valid.map(card).join('') : '<p class="empty">Sin resultados</p>'
    })
    .catch(() => {
      const el = document.getElementById(id)
      if (el) {
        const track = el.classList.contains('track') ? el : el.querySelector('.track')
        if (track) track.innerHTML = errorMsg()
      }
    })
}

function row(titulo, promise, id) {
  fillTrack(id, promise)
  return `<section class="row" id="${id}"><h2>${titulo}</h2><div class="track">${skeleton(10)}</div></section>`
}

const VIEWS = {
  home: () => {
    let html = ''
    const cont = getCont()
    const favs = getFavs()
    if (cont) html += row('Continuar viendo', Promise.resolve({ results: [cont] }), 'row-cont')
    if (Object.keys(favs).length) html += row('Mis favoritos', Promise.resolve({ results: Object.values(favs) }), 'row-favs')
    html += row('Películas Populares', getList('movie', 'popular'), 'h-movie-pop')
    html += row('Series Populares', getList('tv', 'popular'), 'h-tv-pop')
    return html
  },
  movies: () => {
    let html = row('Populares', getList('movie', 'popular'), 'm-pop')
    html += row('En cines', getList('movie', 'now_playing'), 'm-now')
    html += row('Mejor valoradas', getList('movie', 'top_rated'), 'm-top')
    html += row('Acción', getByGenre('movie', 28), 'm-acc')
    html += row('Comedia', getByGenre('movie', 35), 'm-com')
    html += row('Terror', getByGenre('movie', 27), 'm-ter')
    html += row('Ciencia ficción', getByGenre('movie', 878), 'm-sci')
    html += row('Romance', getByGenre('movie', 10749), 'm-rom')
    html += row('Aventura', getByGenre('movie', 12), 'm-av')
    html += row('Animación', getByGenre('movie', 16), 'm-ani')
    html += row('Suspense', getByGenre('movie', 53), 'm-sus')
    html += row('Misterio', getByGenre('movie', 9648), 'm-mys')
    html += row('Fantasía', getByGenre('movie', 14), 'm-fan')
    html += row('Bélica', getByGenre('movie', 10752), 'm-war')
    html += row('Western', getByGenre('movie', 37), 'm-wes')
    return html
  },
  series: () => {
    let html = row('Populares', getList('tv', 'popular'), 's-pop')
    html += row('Mejor valoradas', getList('tv', 'top_rated'), 's-top')
    html += row('En emisión', getList('tv', 'on_the_air'), 's-on')
    html += row('Drama', getByGenre('tv', 18), 's-dra')
    html += row('Comedia', getByGenre('tv', 35), 's-com')
    html += row('Acción y aventura', getByGenre('tv', 10759), 's-acc')
    html += row('Crimen', getByGenre('tv', 80), 's-cri')
    html += row('Misterio', getByGenre('tv', 9648), 's-mys')
    html += row('Ciencia ficción y fantasía', getByGenre('tv', 10765), 's-sci')
    html += row('Animación', getByGenre('tv', 16), 's-ani')
    return html
  },
  anime: () => {
    let html = row('Series Anime', getByGenre('tv', 16, { with_original_language: 'ja' }), 'a-tv')
    html += row('Películas Anime', getByGenre('movie', 16, { with_original_language: 'ja' }), 'a-mov')
    return html
  },
  docs: () => {
    let html = row('Películas Documentales', getByGenre('movie', 99), 'd-mov')
    html += row('Series Documentales', getByGenre('tv', 99), 'd-tv')
    return html
  }
}

function renderView(viewName) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewName))
  $('#main').innerHTML = VIEWS[viewName]()
  
  const viewTitles = { home: 'Inicio', movies: 'Películas', series: 'Series', anime: 'Anime', docs: 'Documentales' }
  document.title = `${viewTitles[viewName] || 'Inicio'} — Plistrust`
}

async function openDetail(uid_val, id, type) {
  $('#main').innerHTML = `<div class="track">${skeleton(6)}</div>`
  try {
    const m = await getDetails(type, id)
    m.media_type = type
    movieCache.set(uid_val, m)
    localStorage.setItem(CONT_KEY, JSON.stringify(summary(m)))
    renderDetail(m, uid_val)
  } catch {
    $('#main').innerHTML = errorMsg()
  }
}

function renderDetail(m, uid_val) {
  const fav = isFav(uid_val)
  const bg = poster(m.backdrop_path, 'w1280') || poster(m.poster_path, 'w500')
  const title = m.title || m.name
  const date = m.release_date || m.first_air_date
  const isSeries = m.media_type === 'tv'
  
  document.title = `${title} — Plistrust`
  const bgImg = bg ? `<img class="detail-bg" src="${bg}" alt="" />` : ''
  $('#main').innerHTML = `
  <section class="detail">
    ${bgImg}
    <button class="back" data-back>← Volver</button>
    <div class="detail-info">
      <img class="detail-poster" src="${poster(m.poster_path, 'w500')}" alt="${title}" />
      <div class="detail-text">
        <h2>${title} <span class="year">(${date?.slice(0, 4) || '—'})</span></h2>
        <p class="meta"><span class="meta-star">⭐</span> ${m.vote_average?.toFixed(1) ?? '—'} <span class="dot">•</span> ${m.runtime || m.episode_run_time?.[0] || '—'} min <span class="dot">•</span> ${(m.genres || []).map((g) => g.name).join(', ')}</p>
        <p class="overview">${m.overview || 'Sin sinopsis disponible.'}</p>
        ${isSeries ? `
        <div class="ep-picker">
          <label>Temporada <select id="season-select"></select></label>
          <label>Episodio <select id="episode-select"></select></label>
        </div>` : ''}
        <div class="actions">
          <div class="play-btns">${providerButtons(m.media_type, m.id)}</div>
          <button class="fav big ${fav ? 'on' : ''}" data-fav="${uid_val}">${fav ? '♥ Favorito' : '♡ Favorito'}</button>
        </div>
      </div>
    </div>
  </section>`
  if (isSeries) setupEpPicker(m)
}

function setupEpPicker(m) {
  const seasonSelect = $('#season-select')
  const epSelect = $('#episode-select')
  if (!seasonSelect) return
  const seasons = (m.seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0)
  if (!seasons.length) {
    seasonSelect.innerHTML = '<option value="1">Temporada 1</option>'
    return
  }
  seasonSelect.innerHTML = seasons
    .map((s) => `<option value="${s.season_number}">Temporada ${s.season_number}</option>`)
    .join('')

  const reload = async () => {
    const se = Number(seasonSelect.value)
    const eps = await getSeason('tv', m.id, se).then((d) => (d.episodes || []).filter((e) => e.episode_number > 0))
    epSelect.innerHTML = eps.map((e) => `<option value="${e.episode_number}">${e.episode_number}. ${e.name}</option>`).join('')
    renderPlayButtons(m, se, Number(epSelect.value))
  }
  seasonSelect.addEventListener('change', reload)
  epSelect.addEventListener('change', () => renderPlayButtons(m, Number(seasonSelect.value), Number(epSelect.value)))
  reload().catch(() => { epSelect.innerHTML = '<option value="1">Episodio 1</option>' })
}

function renderPlayButtons(m, se, ep) {
  const box = $('.play-btns')
  if (box) box.innerHTML = providerButtons(m.media_type, m.id, se, ep)
}

function toggleFav(uid_val, btn) {
  const favs = getFavs()
  if (uid_val in favs) delete favs[uid_val]
  else if (movieCache.has(uid_val)) favs[uid_val] = summary(movieCache.get(uid_val))
  setFavs(favs)
  
  const on = uid_val in favs
  btn.classList.toggle('on', on)
  btn.innerHTML = btn.classList.contains('big') ? (on ? '♥ Favorito' : '♡ Favorito') : (on ? '♥' : '♡')
  
  const activeBtn = document.querySelector('.nav-btn.active')
  if (activeBtn && activeBtn.dataset.view === 'home') {
    if (!Object.keys(favs).length) {
       const frow = $('#row-favs')
       if(frow) frow.remove()
    } else {
      const frow = $('#row-favs')
      if (frow) frow.querySelector('.track').innerHTML = Object.values(favs).map(card).join('')
      else renderView('home')
    }
  }
}

async function doSearch(q) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  $('#main').innerHTML = `<section class="row"><h2>Resultados para “${q}”</h2><div class="track" id="search-track">${skeleton(10)}</div></section>`
  document.title = `Buscar: ${q} — Plistrust`
  try {
    const d = await search(q)
    const valid = (d.results || []).filter(m => m.media_type === 'movie' || m.media_type === 'tv')
    valid.forEach((m) => movieCache.set(uid(m), m))
    $('#search-track').innerHTML = valid.length
      ? valid.map(card).join('')
      : '<p class="empty">Sin resultados</p>'
  } catch {
    $('#search-track').innerHTML = errorMsg()
  }
}

function onDocClick(e) {
  const navBtn = e.target.closest('.nav-btn')
  if (navBtn) { renderView(navBtn.dataset.view); return }
  
  const favBtn = e.target.closest('[data-fav]')
  if (favBtn) { toggleFav(favBtn.dataset.fav, favBtn); return }
  
  const play = e.target.closest('[data-play]')
  if (play) { openPlayer(play.dataset.play, play.dataset.type, play.dataset.id, play.dataset.se, play.dataset.ep); return }
  
  const cardEl = e.target.closest('[data-uid]')
  if (cardEl) { openDetail(cardEl.dataset.uid, cardEl.dataset.id, cardEl.dataset.type); return }
  
  if (e.target.closest('[data-back]')) { 
    const active = document.querySelector('.nav-btn.active')
    if (active) renderView(active.dataset.view)
    else renderView('home') // fallback if search was active
    return 
  }
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
  renderView('home')
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
