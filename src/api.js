import { CONFIG } from './config.js'

const BASE = 'https://api.themoviedb.org/3'
const TTL = 10 * 60 * 1000 // caché de 10 min

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
  
  // Inject media_type into results if not present (useful for single type endpoints)
  if (data.results) {
    const defaultType = path.includes('/tv') ? 'tv' : 'movie'
    data.results.forEach(r => {
      if (!r.media_type) r.media_type = defaultType
    })
  }

  localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: data }))
  return data
}

export const getList = (type, list) => tmdb(`/${type}/${list}`)
export const getByGenre = (type, id, extraParams = {}) => tmdb(`/discover/${type}`, { with_genres: id, sort_by: 'popularity.desc', ...extraParams })
export const getDetails = (type, id) => tmdb(`/${type}/${id}`)
export const getSeason = (type, id, season) => tmdb(`/${type}/${id}/season/${season}`)
export const search = (q) => tmdb('/search/multi', { query: q })

export const poster = (p, w = 'w342') => (p ? `https://image.tmdb.org/t/p/${w}${p}` : '')
