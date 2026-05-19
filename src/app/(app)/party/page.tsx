'use client'

import { useEffect, useState } from 'react'
import { getMyParties, getGames, createParty, joinPartyByCode, leaveParty, updateParty } from '@/lib/db'

type Member = { user_id: string; display_name: string; joined_at: string }
type Party = {
  id: string
  name: string
  invite_code: string
  game_id: string | null
  game_name: string | null
  members: Member[]
  myUserId: string
}
type Game = { id: string; name: string }

export default function PartyPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [partyName, setPartyName] = useState('')
  const [createGameId, setCreateGameId] = useState<string>('')
  const [creating, setCreating] = useState(false)

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  // Rename
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Change game for existing party
  const [editGameId, setEditGameId] = useState<string | null>(null)
  const [editGameValue, setEditGameValue] = useState<string>('')
  const [savingGame, setSavingGame] = useState(false)

  const [error, setError] = useState('')

  async function reload() {
    setLoading(true)
    const [p, g] = await Promise.all([getMyParties(), getGames()])
    setParties(p as Party[])
    if (Array.isArray(g)) setGames(g)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!partyName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createParty(partyName.trim(), createGameId || null)
      setPartyName('')
      setCreateGameId('')
      setShowCreate(false)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create party.')
    }
    setCreating(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (joinCode.length < 6) return
    setJoining(true)
    setError('')
    try {
      await joinPartyByCode(joinCode)
      setJoinCode('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join party.')
    }
    setJoining(false)
  }

  async function handleLeave(partyId: string) {
    await leaveParty(partyId)
    setConfirmLeaveId(null)
    await reload()
  }

  function startEditing(party: Party) {
    setEditingId(party.id)
    setEditingName(party.name)
    setExpandedId(party.id)
  }

  async function commitRename(partyId: string) {
    const trimmed = editingName.trim()
    if (!trimmed) { setEditingId(null); return }
    setSavingName(true)
    try {
      await updateParty(partyId, { name: trimmed })
      setParties(prev => prev.map(p => p.id === partyId ? { ...p, name: trimmed } : p))
    } catch { /* ignore */ }
    setEditingId(null)
    setSavingName(false)
  }

  function startEditGame(party: Party) {
    setEditGameId(party.id)
    setEditGameValue(party.game_id ?? '')
    setExpandedId(party.id)
  }

  async function commitGameChange(partyId: string) {
    setSavingGame(true)
    const newGameId = editGameValue || null
    const newGameName = games.find(g => g.id === newGameId)?.name ?? null
    try {
      await updateParty(partyId, { game_id: newGameId })
      setParties(prev => prev.map(p =>
        p.id === partyId ? { ...p, game_id: newGameId, game_name: newGameName } : p
      ))
    } catch { /* ignore */ }
    setEditGameId(null)
    setSavingGame(false)
  }

  async function copyCode(party: Party) {
    await navigator.clipboard.writeText(party.invite_code)
    setCopiedId(party.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Parties</h1>
        <button
          onClick={() => { setShowCreate(v => !v); setError('') }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Party
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg p-3">⚠️ {error}</p>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Create a New Party</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Party name</label>
              <input
                autoFocus
                type="text"
                value={partyName}
                onChange={e => { setPartyName(e.target.value); setError('') }}
                placeholder="e.g. Game Night Crew, Family"
                maxLength={40}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Game <span className="text-slate-400">(optional — filters party stats)</span></label>
              <select
                value={createGameId}
                onChange={e => setCreateGameId(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No specific game</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setPartyName(''); setCreateGameId('') }}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !partyName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Party list */}
      {parties.length === 0 && !showCreate ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <div className="text-5xl">🎉</div>
          <p className="font-medium">No parties yet</p>
          <p className="text-sm">Create one to share games and scores with friends.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parties.map(party => {
            const expanded = expandedId === party.id
            const confirmLeave = confirmLeaveId === party.id
            const copied = copiedId === party.id

            return (
              <div key={party.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Party header */}
                <div className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === party.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => commitRename(party.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(party.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        maxLength={40}
                        className="w-full font-bold text-lg text-slate-800 bg-slate-100 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <p className="font-bold text-slate-800 text-lg leading-tight">{party.name}</p>
                        <button
                          onClick={() => startEditing(party)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-all text-sm"
                          title="Rename"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{party.members.length} member{party.members.length !== 1 ? 's' : ''}</p>
                      {party.game_name && (
                        <>
                          <span className="text-slate-300">·</span>
                          <p className="text-xs text-indigo-500 font-medium">🎲 {party.game_name}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {!savingName && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : party.id)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors px-2 py-1 shrink-0"
                    >
                      {expanded ? 'Hide ▲' : 'Details ▼'}
                    </button>
                  )}
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 space-y-4 pt-4">

                    {/* Rename button */}
                    {editingId !== party.id && (
                      <button
                        onClick={() => startEditing(party)}
                        className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl px-4 py-2.5 transition-colors"
                      >
                        ✏️ <span className="font-medium">Rename party</span>
                      </button>
                    )}

                    {/* Game picker */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">Party Game</p>
                      {editGameId === party.id ? (
                        <div className="flex gap-2">
                          <select
                            autoFocus
                            value={editGameValue}
                            onChange={e => setEditGameValue(e.target.value)}
                            className="flex-1 bg-slate-100 text-slate-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">No specific game</option>
                            {games.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => commitGameChange(party.id)}
                            disabled={savingGame}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 rounded-lg text-sm font-semibold transition-colors"
                          >
                            {savingGame ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditGameId(null)}
                            className="text-slate-400 hover:text-slate-600 px-3 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditGame(party)}
                          className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {party.game_name ? `🎲 ${party.game_name}` : 'No specific game'}
                          </span>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">Change</span>
                        </button>
                      )}
                      {party.game_name && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          Stats for this party are filtered to {party.game_name} only.
                        </p>
                      )}
                    </div>

                    {/* Invite code */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">Invite Code</p>
                      <button
                        onClick={() => copyCode(party)}
                        className="w-full flex items-center justify-between bg-indigo-50 border-2 border-indigo-200 rounded-xl px-5 py-3 hover:border-indigo-400 transition-colors group"
                      >
                        <span className="font-mono text-2xl font-bold tracking-widest text-indigo-700 flex-1 text-center">
                          {party.invite_code}
                        </span>
                        <span className="text-sm font-semibold text-indigo-500 group-hover:text-indigo-700 shrink-0">
                          {copied ? '✓ Copied!' : 'Copy'}
                        </span>
                      </button>
                      <p className="text-xs text-slate-400 mt-1.5 text-center">
                        Share with friends — they enter this on their Party page.
                      </p>
                    </div>

                    {/* Members */}
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">
                        Members ({party.members.length})
                      </p>
                      <div className="space-y-1.5">
                        {party.members.map(m => (
                          <div key={m.user_id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                              {(m.display_name ?? '?').slice(0, 1).toUpperCase()}
                            </div>
                            <span className="flex-1 text-sm font-medium text-slate-700">{m.display_name ?? 'Unknown'}</span>
                            {m.user_id === party.myUserId && (
                              <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Leave */}
                    {!confirmLeave ? (
                      <button
                        onClick={() => setConfirmLeaveId(party.id)}
                        className="w-full py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-900/40 transition-colors"
                      >
                        Leave Party
                      </button>
                    ) : (
                      <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 space-y-3">
                        <p className="text-sm text-red-300 font-medium text-center">
                          Leave <span className="font-bold">{party.name}</span>? You can rejoin with the invite code.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmLeaveId(null)}
                            className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-white transition-colors">
                            Cancel
                          </button>
                          <button onClick={() => handleLeave(party.id)}
                            className="flex-1 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                            Yes, Leave
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Divider */}
      {parties.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-xs uppercase tracking-wide">Join a party</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>
      )}

      {/* Join form */}
      <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">
          {parties.length === 0 ? "Join a Friend's Party" : 'Join Another Party'}
        </p>
        <form onSubmit={handleJoin} className="space-y-3">
          <input
            type="text"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="6-letter code"
            maxLength={6}
            className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 placeholder:text-base placeholder:tracking-normal"
          />
          <button
            type="submit"
            disabled={joining || joinCode.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl py-3 font-semibold transition-colors"
          >
            {joining ? 'Joining...' : 'Join Party'}
          </button>
        </form>
      </div>

      {/* Empty state */}
      {parties.length === 0 && !showCreate && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
          <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Create a New Party</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Party name</label>
                <input
                  type="text"
                  value={partyName}
                  onChange={e => { setPartyName(e.target.value); setError('') }}
                  placeholder="e.g. Game Night Crew"
                  maxLength={40}
                  className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Game <span className="text-slate-400">(optional)</span></label>
                <select
                  value={createGameId}
                  onChange={e => setCreateGameId(e.target.value)}
                  className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No specific game</option>
                  {games.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creating || !partyName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl py-3 font-semibold transition-colors"
              >
                {creating ? 'Creating...' : 'Create Party'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
