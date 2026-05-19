'use client'

import { useEffect, useState } from 'react'
import { getMyParties, createParty, joinPartyByCode, leaveParty, updateParty } from '@/lib/db'

type Member = { user_id: string; display_name: string; joined_at: string }
type Party = { id: string; name: string; invite_code: string; members: Member[]; myUserId: string }

export default function PartyPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [partyName, setPartyName] = useState('')
  const [creating, setCreating] = useState(false)

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const [error, setError] = useState('')

  async function reload() {
    setLoading(true)
    const p = await getMyParties()
    setParties(p as Party[])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!partyName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createParty(partyName.trim())
      setPartyName('')
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
    setExpandedId(party.id) // ensure card is open
  }

  async function commitRename(partyId: string) {
    const trimmed = editingName.trim()
    if (!trimmed) { setEditingId(null); return }
    setSavingName(true)
    try {
      await updateParty(partyId, trimmed)
      setParties(prev => prev.map(p => p.id === partyId ? { ...p, name: trimmed } : p))
    } catch {
      // ignore — name stays as-is
    }
    setEditingId(null)
    setSavingName(false)
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

      {/* Create form (inline, toggled) */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Create a New Party</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              autoFocus
              type="text"
              value={partyName}
              onChange={e => { setPartyName(e.target.value); setError('') }}
              placeholder="e.g. Game Night Crew, Family"
              maxLength={40}
              className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setPartyName('') }}
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
                          title="Rename party"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{party.members.length} member{party.members.length !== 1 ? 's' : ''}</p>
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
                    {/* Rename */}
                    {editingId !== party.id && (
                      <button
                        onClick={() => startEditing(party)}
                        className="w-full flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl px-4 py-2.5 transition-colors"
                      >
                        ✏️ <span className="font-medium">Rename party</span>
                      </button>
                    )}

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

                    {/* What's shared */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shared with this party</p>
                      <p className="text-xs text-slate-400">Shared games, player roster, match history, live scoring</p>
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

      {/* Join form — always visible */}
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

      {/* Empty state — no parties, show create form inline */}
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
              <input
                type="text"
                value={partyName}
                onChange={e => { setPartyName(e.target.value); setError('') }}
                placeholder="e.g. Game Night Crew"
                maxLength={40}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
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
