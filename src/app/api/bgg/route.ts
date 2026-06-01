import { NextRequest, NextResponse } from 'next/server'
import { getBggAuthHeaders } from '@/lib/bgg-session'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ results: [] })

  const authHeaders = await getBggAuthHeaders()
  if (!Object.keys(authHeaders).length) {
    return NextResponse.json({ error: 'BGG login failed — check BGG_API_KEY or BGG_USERNAME/BGG_PASSWORD in .env.local', results: [] }, { status: 401 })
  }

  try {
    const res = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
      {
        headers: {
          ...authHeaders,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        },
        next: { revalidate: 60 },
      }
    )

    if (res.status === 401) {
      return NextResponse.json({ error: 'BGG session expired — please reconnect', results: [] }, { status: 401 })
    }

    const result = parseSearch(await res.text())
    // Cache search results for 10 minutes — BGG search index rarely changes
    result.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
    return result
  } catch (err) {
    console.error('BGG search error:', err)
    return NextResponse.json({ error: 'Could not reach BoardGameGeek', results: [] }, { status: 502 })
  }
}

function parseSearch(text: string) {
  const items: { id: string; name: string; year: string }[] = []
  for (const match of text.matchAll(/<item[^>]+id="(\d+)"[\s\S]*?<\/item>/g)) {
    const block = match[0]
    const nameMatch = block.match(/<name type="primary"[^>]+value="([^"]+)"/)
    const yearMatch = block.match(/<yearpublished[^>]+value="([^"]+)"/)
    if (nameMatch) {
      items.push({
        id: match[1],
        name: nameMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
        year: yearMatch?.[1] ?? '',
      })
    }
    if (items.length >= 10) break
  }
  return NextResponse.json({ results: items })
}
