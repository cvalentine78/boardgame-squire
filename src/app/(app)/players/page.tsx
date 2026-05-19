'use client'

import { useEffect, useState, useRef } from 'react'
import { getPlayers, insertPlayer, deletePlayer, updatePlayerAvatar } from '@/lib/db'

type Player = { id: string; name: string; avatar: string | null }

const AVATARS = [
  '🦁','🐯','🦊','🐺','🐻','🐼','🐨','🐸','🦋','🐧','🦄','🐲',
  '🦅','🐬','🐙','🦀','🐝','🦎',
  '🎮','🎯','🎲','🃏','🧩','🏆','⚔️','🛡️','🎭','🎪',
  '🌟','⚡','🔥','💎','🌈','❄️','🌊','🌙','☀️','🍀',
  '👑','🚀','💫','🎸','🎩','🤖','👻','🧙','🦸','🎃',
]

function AvatarPicker({ selected, onSelect }: { selected: string; onSelect: (a: string) => void }) {
  return (
    <div className="grid grid-cols-9 gap-1.5 max-h-40 overflow-y-auto p-1">
      {AVATARS.map(a => (
        <button
          key={a}
          type="button"
          onClick={() => onSelect(a)}
          className={`text-xl rounded-lg p-1 transition-colors ${
            selected === a ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100'
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  )
}

function PlayerAvatar({ player, size = 'md' }: { player: Pick<Player, 'name' | 'avatar'>; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-base' : 'w-9 h-9 text-xl'
  if (player.avatar) {
    return (
      <div className={`${sz} rounded-full bg-indigo-50 flex items-center justify-center shrink-0`}>
        {player.avatar}
      </div>
    )
  }
  return (
    <div className={`${sz} rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0`}>
      {player.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // Add form
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState(AVATARS[0])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit avatar
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchPlayers() {
    const data = await getPlayers()
    setPlayers(Array.isArray(data) ? data as Player[] : [])
    setLoading(false)
  }

  useEffect(() => { fetchPlayers() }, [])

  async function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A player with that name already exists.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await insertPlayer(trimmed, newAvatar)
      setNewName('')
      setNewAvatar(AVATARS[0])
      setShowAvatarPicker(false)
      await fetchPlayers()
      inputRef.current?.focus()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not add player.')
    }
    setSaving(false)
  }

  async function handleAvatarChange(playerId: string, avatar: string) {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, avatar } : p))
    setEditingAvatarId(null)
    try {
      await updatePlayerAvatar(playerId, avatar)
    } catch {
      await fetchPlayers() // revert on error
    }
  }

  async function handleDelete(id: string) {
    await deletePlayer(id)
    setConfirmId(null)
    fetchPlayers()
  }

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-2xl font-bold text-white">Players</h1>

      {/* Add player */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <label className="text-xs text-slate-500 uppercase tracking-wide font-bold block">Add Player</label>

        <div className="flex gap-3 items-center">
          {/* Avatar preview / picker toggle */}
          <button
            type="button"
            onClick={() => setShowAvatarPicker(v => !v)}
            title="Pick an avatar"
            className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center shrink-0 transition-colors border-2 ${
              showAvatarPicker ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
            }`}
          >
            {newAvatar}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Player name..."
            className="flex-1 bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-3 rounded-lg font-semibold transition-colors">
            Add
          </button>
        </div>

        {/* Inline avatar picker for new player */}
        {showAvatarPicker && (
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <p className="text-xs text-slate-400 mb-2 font-medium">Choose an avatar</p>
            <AvatarPicker selected={newAvatar} onSelect={a => { setNewAvatar(a); setShowAvatarPicker(false) }} />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}
      </div>

      {/* Player list */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-lg font-medium">No players yet</p>
          <p className="text-sm mt-1">Add your first player above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map(player => (
            <div key={player.id}>
              {confirmId === player.id ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                  <p className="flex-1 text-sm text-red-700">Remove <span className="font-semibold">{player.name}</span>?</p>
                  <button onClick={() => setConfirmId(null)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-medium text-slate-700">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(player.id)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Tap avatar to change it */}
                    <button
                      type="button"
                      onClick={() => setEditingAvatarId(editingAvatarId === player.id ? null : player.id)}
                      title="Change avatar"
                      className="shrink-0 hover:scale-110 transition-transform"
                    >
                      <PlayerAvatar player={player} />
                    </button>
                    <span className="flex-1 font-medium text-slate-800">{player.name}</span>
                    <button onClick={() => setConfirmId(player.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      🗑
                    </button>
                  </div>

                  {/* Avatar picker for this player */}
                  {editingAvatarId === player.id && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                      <p className="text-xs text-slate-400 mb-2 font-medium">Choose an avatar</p>
                      <AvatarPicker
                        selected={player.avatar ?? ''}
                        onSelect={a => handleAvatarChange(player.id, a)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
