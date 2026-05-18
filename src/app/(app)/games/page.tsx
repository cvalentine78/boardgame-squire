'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getGames, deleteGame } from '@/lib/db'

type Game = {
  id: string
  name: string
  min_players: number | null
  max_players: number | null
  scoring_categories: string[] | null
}

export default function GamesPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function fetchGames() {
    const data = await getGames()
    if (Array.isArray(data)) setGames(data)
    setLoading(false)
  }

  useEffect(() => { fetchGames() }, [])

  async function handleDelete(id: string) {
    await deleteGame(id)
    setConfirmId(null)
    fetchGames()
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <Link href="/games/new"
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
          + Add Game
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : !games.length ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🎲</div>
          <p className="text-lg font-medium">No games yet</p>
          <p className="text-sm mt-1">Add your first game to get started</p>
          <Link href="/games/new"
            className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
            Add a Game
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {games.map(game => (
            <div key={game.id}>
              {confirmId === game.id ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                  <p className="flex-1 text-sm text-red-700">Delete <span className="font-semibold">{game.name}</span>?</p>
                  <button onClick={() => setConfirmId(null)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-medium text-slate-700">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(game.id)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium">
                    Delete
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <Link href={`/games/${game.id}`}
                    className="flex-1 flex items-center justify-between p-4 hover:bg-slate-50 rounded-l-xl transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800">{game.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {game.min_players && game.max_players ? `${game.min_players}–${game.max_players} players` : ''}
                        {game.scoring_categories && game.scoring_categories.length > 0
                          ? `${game.min_players ? ' · ' : ''}${game.scoring_categories.length} scoring categories`
                          : ''}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <button onClick={() => router.push(`/games/${game.id}/edit`)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100">
                      ✏️
                    </button>
                    <button onClick={() => setConfirmId(game.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100">
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
