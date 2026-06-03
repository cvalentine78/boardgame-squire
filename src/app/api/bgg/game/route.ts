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
    const imageMatch = xml.match(/<image>([\s\S]*?)<\/image>/)
    const ratingMatch = xml.match(/<average[^>]*value="([^"]+)"/)
    const weightMatch = xml.match(/<averageweight[^>]*value="([^"]+)"/)
    const minTimeMatch = xml.match(/<minplaytime[^>]*value="(\d+)"/)
    const maxTimeMatch = xml.match(/<maxplaytime[^>]*value="(\d+)"/)
    const rankMatch = xml.match(/<rank[^>]*type="subtype"[^>]*id="1"[^>]*value="(\d+)"/)

    const mechanics = [...xml.matchAll(/<link type="boardgamemechanic"[^>]*value="([^"]+)"/g)]
      .map(m => decode(m[1]))

    // Find "best at N players" from community poll — pick numplayers with highest Best votes
    let bestPlayers: number | null = null
    const pollMatch = xml.match(/<poll[^>]*name="suggested_numplayers"[\s\S]*?<\/poll>/)
    if (pollMatch) {
      let topVotes = 0
      for (const m of pollMatch[0].matchAll(/<results numplayers="(\d+)"[\s\S]*?<result value="Best" numvotes="(\d+)"/g)) {
        const votes = parseInt(m[2])
        if (votes > topVotes) { topVotes = votes; bestPlayers = parseInt(m[1]) }
      }
    }

    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null
    const weight = weightMatch ? parseFloat(weightMatch[1]) : null
    const minTime = minTimeMatch ? parseInt(minTimeMatch[1]) : null
    const maxTime = maxTimeMatch ? parseInt(maxTimeMatch[1]) : null

    return NextResponse.json({
      name: nameMatch ? decode(nameMatch[1]) : '',
      description: descMatch ? decode(descMatch[1]) : '',
      minPlayers: minMatch ? minMatch[1] : '',
      maxPlayers: maxMatch ? maxMatch[1] : '',
      thumbnail: thumbMatch ? thumbMatch[1].trim() : null,
      image: imageMatch ? imageMatch[1].trim() : null,
      mechanics,
      rating: rating && rating > 0 ? Math.round(rating * 10) / 10 : null,
      weight: weight && weight > 0 ? Math.round(weight * 10) / 10 : null,
      minPlaytime: minTime && minTime > 0 ? minTime : null,
      maxPlaytime: maxTime && maxTime > 0 ? maxTime : null,
      bestPlayers,
      bggRank: rankMatch ? parseInt(rankMatch[1]) : null,
    // Game data rarely changes — cache for 24 hours at CDN, 1 hour at browser
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } })
  } catch (err) {
    console.error('BGG game error:', err)
    return NextResponse.json(null, { status: 502 })
  }
}
