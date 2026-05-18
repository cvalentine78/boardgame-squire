import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const SESSION_FILE = join(process.cwd(), '.bgg-session.json')

// Returns Authorization header value if API key is set
export function getBggApiKey(): string | null {
  const key = process.env.BGG_API_KEY
  return key ? `Bearer ${key}` : null
}

export function getBggCookie(): string | null {
  try {
    if (!existsSync(SESSION_FILE)) return null
    const data = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'))
    if (!data.cookie) return null
    if (data.expires && Date.now() > data.expires) return null
    return data.cookie
  } catch {
    return null
  }
}

export function saveBggCookie(cookie: string, expires: number) {
  writeFileSync(SESSION_FILE, JSON.stringify({ cookie, expires }))
}

export function clearBggCookie() {
  writeFileSync(SESSION_FILE, JSON.stringify({}))
}

export function isBggConnected(): boolean {
  return getBggApiKey() !== null || getBggCookie() !== null
}

// Auto-login using credentials stored in .env.local
export async function autoLogin(): Promise<string | null> {
  const username = process.env.BGG_USERNAME
  const password = process.env.BGG_PASSWORD
  if (!username || !password) return null

  try {
    const res = await fetch('https://boardgamegeek.com/login/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ credentials: { username, password } }),
    })

    if (res.status !== 200 && res.status !== 204) return null

    const rawCookies: string[] = typeof (res.headers as any).getSetCookie === 'function'
      ? (res.headers as any).getSetCookie()
      : (res.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).filter(Boolean)

    const seen = new Set<string>()
    const parts: string[] = []
    let expires = Date.now() + 1000 * 60 * 60 * 24 * 7

    for (const raw of rawCookies) {
      const [nameVal] = raw.split(';')
      if (!nameVal) continue
      const [name] = nameVal.trim().split('=')
      if (seen.has(name)) continue
      seen.add(name)
      parts.push(nameVal.trim())
      const expMatch = raw.match(/expires=([^;]+)/i)
      if (expMatch) {
        const exp = new Date(expMatch[1]).getTime()
        if (!isNaN(exp)) expires = Math.min(expires, exp)
      }
    }

    if (!parts.length) return null
    const cookie = parts.join('; ')
    saveBggCookie(cookie, expires)
    return cookie
  } catch {
    return null
  }
}

// Returns auth headers for BGG XML API requests.
// Prefers API key (Bearer token) over session cookie.
export async function getBggAuthHeaders(): Promise<Record<string, string>> {
  const apiKey = getBggApiKey()
  if (apiKey) {
    return { 'Authorization': apiKey }
  }
  const cookie = getBggCookie() ?? await autoLogin()
  if (cookie) {
    return { 'Cookie': cookie }
  }
  return {}
}

// Legacy — kept for backward compat
export async function getOrRefreshCookie(): Promise<string | null> {
  return getBggCookie() ?? await autoLogin()
}
