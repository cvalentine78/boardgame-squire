import { NextRequest, NextResponse } from 'next/server'
import { getBggAuthHeaders } from '@/lib/bgg-session'

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#10;/g, ' ').replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–').replace(/&#[0-9]+;/g, '')
    .replace(/<[^>]+>/g, '').trim()
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json(null, { status: 400 })

  const authHeaders = await getBggAuthHeaders()
  if (!Object.keys(authHeaders).length) return NextResponse.json({ error: 'BGG login failed' }, { status: 401 })

  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`

  try {
    let xml = ''
    for (let i = 0; i < 3; i++) {
      const res = await fetch(url, {
        headers: {
          ...authHeaders,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        },
      })
      if (res.status === 401) break
      if (res.status === 200) { xml = await res.text(); break }
      await new Promise(r => setTimeout(r, 1000))
    }
    if (!xml) return NextResponse.json(null, { status: 502 })

    const nameMatch = xml.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/)
    const descMatch = xml.match(/<description>([\s\S]*?)<\/description>/)
    const minMatch = xml.match(/<minplayers[^>]*value="(\d+)"/)
    const maxMatch = xml.match(/<maxplayers[^>]*value="(\d+)"/)
    const thumbMatch = xml.match(/<thumbnail>([\s\S]*?)<\/thumbnail>/)
    const ratingMatch = xml.match(/<average[^>]*value="([^"]+)"/)
    const weightMatch = xml.match(/<averageweight[^>]*value="([^"]+)"/)

    const mechanics = [...xml.matchAll(/<link type="boardgamemechanic"[^>]*value="([^"]+)"/g)]
      .map(m => decode(m[1]))

    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null
    const weight = weightMatch ? parseFloat(weightMatch[1]) : null

    return NextResponse.json({
      name: nameMatch ? decode(nameMatch[1]) : '',
      description: descMatch ? decode(descMatch[1]) : '',
      minPlayers: minMatch ? minMatch[1] : '',
      maxPlayers: maxMatch ? maxMatch[1] : '',
      thumbnail: thumbMatch ? thumbMatch[1].trim() : null,
      mechanics,
      rating: rating && rating > 0 ? Math.round(rating * 10) / 10 : null,
      weight: weight && weight > 0 ? Math.round(weight * 10) / 10 : null,
    // Game data rarely changes — cache for 24 hours at CDN, 1 hour at browser
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } })
  } catch (err) {
    console.error('BGG game error:', err)
    return NextResponse.json(null, { status: 502 })
  }
}
