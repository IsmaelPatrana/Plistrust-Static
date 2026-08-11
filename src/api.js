import { CONFIG } from './config.js'

const BASE = 'https://api.themoviedb.org/3'
const TTL = 10 * 60 * 1000 // caché de 10 min (TMDB limita a ~40 req/10s)

export async function tmdb(path, params = {}) {
  const qs = new URLSearchParams({ api_key: CONFIG.TMDB_KEY, language: 'es-ES', ...params })
  const url = `${BASE}${path}?${qs}`

  const cacheKey = 'tmdb:' + url
  const hit = localStorage.getItem(cacheKey)
  if (hit) {
    const { t, d } = JSON.parse(hit)
    if (Date.now() - t < TTL) return d
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error('TMDB ' + res.status)
  const data = await res.json()
  localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: data }))
  return data
}

export const getList = (list) => tmdb(`/movie/${list}`)
export const getByGenre = (id) => tmdb('/discover/movie', { with_genres: id, sort_by: 'popularity.desc' })
export const getMovie = (id) => tmdb(`/movie/${id}`)
export const search = (q) => tmdb('/search/movie', { query: q })

export const poster = (p, w = 'w342') => (p ? `https://image.tmdb.org/t/p/${w}${p}` : '')
