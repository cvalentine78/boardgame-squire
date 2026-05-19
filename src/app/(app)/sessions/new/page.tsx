'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getGames, getPlayers, insertSession, insertPlayers } from '@/lib/db'

type Game = { id: string; name: string; min_players: number | null; max_players: number | null }
type Player = { id: string; name: string; avatar: string | null }

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

export default function NewSessionPage() {
  return <Suspense><NewSessionForm /></Suspense>
}

function NewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getGames(), getPlayers()]).then(([gameData, playerData]) => {
      if (Array.isArray(gameData)) {
        setGames(gameData)
        const gameId = searchParams.get('game')
        if (gameId) {
          const match = gameData.find((g: Game) => g.id === gameId)
          if (match) setSelectedGame(match)
        }
      }
      if (Array.isArray(playerData)) setPlayers(playerData)
    })
  }, [])

  function togglePlayer(name: string) {
    const max = selectedGame?.max_players
    setSelectedNames(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (max && prev.length >= max) return prev // already at max
      return [...prev, name]
    })
  }

  const atMax = !!(selectedGame?.max_players && selectedNames.length >= selectedGame.max_players)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGame) { setError('Please select a game first.'); return }
    if (selectedNames.length < 1) { setError('Select at least one player.'); return }

    setSaving(true)
    setError('')

    try {
      const first = selectedNames[Math.floor(Math.random() * selectedNames.length)]
      const session = await insertSession({
        game_id: selectedGame.id,
        join_code: generateCode(),
        status: 'active',
        first_player: first,
      })

      await insertPlayers(
        selectedNames.map((name, i) => ({
          session_id: session.id,
          player_name: name,
          turn_order: i + 1,
        }))
      )

      router.push(`/sessions/${session.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">←</button>
        <h1 className="text-2xl font-bold text-white">New Match</h1>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        {error && <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg p-3">⚠️ {error}</p>}

        {/* Game selection */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <label className="block text-xs text-slate-500 uppercase tracking-wide font-bold">Select Game</label>

          {selectedGame && (
            <div className="flex items-center gap-2 bg-indigo-600 rounded-xl px-4 py-2.5">
              <span className="text-white text-lg">✓</span>
              <span className="font-semibold text-white flex-1">{selectedGame.name}</span>
              <button type="button" onClick={() => { setSelectedGame(null); setSelectedNames([]) }}
                className="text-indigo-200 hover:text-white text-xl leading-none">×</button>
            </div>
          )}

          {games.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <p>No games found.</p>
              <button type="button" onClick={() => router.push('/games/new')}
                className="mt-2 text-indigo-600 hover:text-indigo-500 underline">
                Add a game first
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {games.map(game => (
                <button key={game.id} type="button" onClick={() => { setSelectedGame(game); setSelectedNames([]) }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors border ${
                    selectedGame?.id === game.id
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                  }`}>
                  <span className="font-medium">{game.name}</span>
                  {game.min_players && game.max_players && (
                    <span className={`ml-2 text-sm ${selectedGame?.id === game.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {game.min_players}–{game.max_players} players
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Player picker */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">
              Players
              {selectedGame?.max_players ? ` (max ${selectedGame.max_players})` : ''}
            </label>
            {selectedNames.length > 0 && (
              <span className="text-xs text-indigo-600 font-semibold">{selectedNames.length} selected</span>
            )}
          </div>

          {players.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <p>No saved players yet.</p>
              <button type="button" onClick={() => router.push('/players')}
                className="mt-2 text-indigo-600 hover:text-indigo-500 underline">
                Add players first
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {players.map(player => {
                const selected = selectedNames.includes(player.name)
                const disabled = !selected && atMax
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => togglePlayer(player.name)}
                    disabled={disabled}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors text-left ${
                      selected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : disabled
                          ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      selected ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {selected
                        ? <span className="text-white text-sm font-bold">✓</span>
                        : player.avatar
                          ? <span className="text-lg">{player.avatar}</span>
                          : <span className="text-sm font-bold text-indigo-600">{player.name.slice(0, 1).toUpperCase()}</span>
                      }
                    </div>
                    <span className="font-medium text-sm truncate">{player.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Show selected order */}
          {selectedNames.length > 0 && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1.5">Turn order (tap to reorder):</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNames.map((name, i) => (
                  <span key={name} className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                    <span className="text-indigo-400">{i + 1}.</span> {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-lg transition-colors">
          {saving ? 'Starting...' : 'Start Match 🎲'}
        </button>
      </form>
    </div>
  )
}
