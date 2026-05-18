import { NextRequest, NextResponse } from 'next/server'
import { saveBggCookie, clearBggCookie, isBggConnected } from '@/lib/bgg-session'

export async function GET() {
  return NextResponse.json({ connected: isBggConnected() })
}

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  try {
    const res = await fetch('https://boardgamegeek.com/login/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ credentials: { username, password } }),
    })

    if (res.status !== 200) {
      const body = await res.json().catch(() => ({}))
      const msg = body?.errors?.message ?? 'Invalid username or password'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    // Parse all Set-Cookie headers and build a cookie string
    const rawCookies = res.headers.getSetCookie?.() ?? []
    const cookieParts: string[] = []
    let latestExpiry = Date.now() + 1000 * 60 * 60 * 24 * 7 // default 7 days

    for (const raw of rawCookies) {
      const [nameVal] = raw.split(';')
      if (nameVal) cookieParts.push(nameVal.trim())
      const expiresMatch = raw.match(/expires=([^;]+)/i)
      if (expiresMatch) {
        const exp = new Date(expiresMatch[1]).getTime()
        if (!isNaN(exp)) latestExpiry = Math.min(latestExpiry, exp)
      }
    }

    if (cookieParts.length === 0) {
      return NextResponse.json({ error: 'No session cookie returned' }, { status: 502 })
    }

    saveBggCookie(cookieParts.join('; '), latestExpiry)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('BGG login error:', err)
    return NextResponse.json({ error: 'Could not reach BoardGameGeek' }, { status: 502 })
  }
}

export async function DELETE() {
  clearBggCookie()
  return NextResponse.json({ success: true })
}
