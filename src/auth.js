import { CONFIG } from './config.js'

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function checkPassword(pw) {
  return (await sha256(pw)) === CONFIG.PASSWORD_HASH
}

const KEY = 'plistrust.session'

export function isLogged() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return false
  try {
    const s = JSON.parse(raw)
    if (Date.now() > s.exp) {
      logout()
      return false
    }
    return true
  } catch {
    logout()
    return false
  }
}

export function login() {
  localStorage.setItem(KEY, JSON.stringify({ exp: Date.now() + CONFIG.SESSION_DAYS * 864e5 }))
}

export function logout() {
  localStorage.removeItem(KEY)
}
