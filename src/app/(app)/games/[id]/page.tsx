'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getGame, deleteGame, toggleGameShared, copyGame } from '@/lib/db'

type Game = {
  id: string
  name: string
  description: string | null
  min_players: number | null
  max_players: number | null
  rules_pdf_url: string | null
  scoring_categories: string[] | null
  is_shared: boolean | null
  created_by: string | null
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)

  useEffect(() => {
    getGame(id).then((data) => {
      setGame(data)
      setLoading(false)
    })
    createClient().auth.getSession().then(({ data: { session } }) => {
      setMyUserId(session?.user?.id ?? null)
    })
  }, [id])

  async function handleDelete() {
    await deleteGame(id)
    router.push('/games')
  }

  async function handleCopy() {
    setCopying(true)
    try {
      await copyGame(id)
      setCopied(true)
      setTimeout(() => router.push('/games'), 1200)
    } catch { /* ignore */ }
    setCopying(false)
  }

  async function handleToggleShare() {
    if (!game) return
    setToggling(true)
    const newVal = !game.is_shared
    setGame(g => g ? { ...g, is_shared: newVal } : g)
    try {
      await toggleGameShared(id, newVal)
    } catch {
      setGame(g => g ? { ...g, is_shared: game.is_shared } : g)
    }
    setToggling(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  if (!game) return <div className="text-center py-16 text-slate-400">Game not found.</div>

  const isMine = !game.created_by || game.created_by === myUserId

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">←</button>
        <h1 className="text-2xl font-bold text-white">{game.name}</h1>
      </div>

      {/* Game info */}
      <div className="bg-white rounded-2xl p-4 space-y-2 shadow-lg">
        {game.min_players && game.max_players && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Players</span>
            <span className="text-slate-800 font-medium">{game.min_players}–{game.max_players}</span>
          </div>
        )}
        {game.scoring_categories && game.scoring_categories.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Score sheet</span>
            <span className="text-slate-800 font-medium">{game.scoring_categories.length} categories</span>
          </div>
        )}
        {!game.scoring_categories?.length && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Score sheet</span>
            <span className="text-slate-400">Round-by-round grid</span>
          </div>
        )}
        {game.description && (
          <p className="text-slate-600 text-sm pt-1 border-t border-slate-100">{game.description}</p>
        )}
      </div>

      {/* Party game banner + copy button */}
      {!isMine && (
        <div className="bg-indigo-950/50 border border-indigo-700 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 text-lg">🎉</span>
            <p className="text-sm text-indigo-300 font-medium">This game is shared from your party.</p>
          </div>
          <p className="text-xs text-indigo-400">
            Copy it to your own library so you keep access even if you leave the party.
          </p>
          <button
            onClick={handleCopy}
            disabled={copying || copied}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition-colors"
          >
            {copied ? '✓ Copied to your library!' : copying ? 'Copying...' : '📋 Copy to My Library'}
          </button>
        </div>
      )}

      {/* Party sharing toggle — only for your own games */}
      {isMine && (
        <button
          onClick={handleToggleShare}
          disabled={toggling}
          className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-colors shadow-sm ${
            game.is_shared
              ? 'bg-emerald-50 border-2 border-emerald-300'
              : 'bg-white border border-slate-200'
          }`}
        >
          <div className="text-left">
            <p className={`font-semibold text-sm ${game.is_shared ? 'text-emerald-700' : 'text-slate-700'}`}>
              {game.is_shared ? '🌐 Shared with party' : '🔒 Private'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {game.is_shared
                ? 'Your party can see this game and use it in matches.'
                : 'Only you can see this game. Tap to share with your party.'}
            </p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${game.is_shared ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${game.is_shared ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {game.rules_pdf_url && (
          <a href={game.rules_pdf_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-medium transition-colors">
            📄 View Rules PDF
          </a>
        )}
        <button onClick={() => router.push(`/sessions/new?game=${id}`)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold transition-colors">
          🃏 Start a Match
        </button>
        {isMine && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => router.push(`/games/${id}/edit`)}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-medium transition-colors">
              ✏️ Edit Game
            </button>
            <button onClick={() => router.push(`/games/${id}/edit?step=2`)}
              className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-medium transition-colors">
              📋 Edit Score Sheet
            </button>
          </div>
        )}
      </div>

      {/* Delete — only for your own games */}
      {isMine && (
        <div className="pt-2">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 transition-colors">
              🗑 Delete Game
            </button>
          ) : (
            <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 space-y-3">
              <p className="text-sm text-red-300 font-medium text-center">Delete {game.name} permanently?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                  Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
