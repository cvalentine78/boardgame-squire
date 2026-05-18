'use client'

import { useEffect, useState } from 'react'
import { getMyParty, createParty, joinPartyByCode, leaveParty } from '@/lib/db'

type Member = { user_id: string; display_name: string; joined_at: string }
type Party = { id: string; name: string; invite_code: string; members: Member[]; myUserId: string }

export default function PartyPage() {
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  // Create form
  const [partyName, setPartyName] = useState('')
  const [creating, setCreating] = useState(false)

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)

  const [error, setError] = useState('')

  async function reload() {
    setLoading(true)
    const p = await getMyParty()
    setParty(p as Party | null)
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
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join party.')
    }
    setJoining(false)
  }

  async function handleLeave() {
    if (!party) return
    await leaveParty(party.id)
    setConfirmLeave(false)
    await reload()
  }

  async function copyCode() {
    if (!party) return
    await navigator.clipboard.writeText(party.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  }

  // IN A PARTY
  if (party) {
    return (
      <div className="space-y-5 pb-6">
        <h1 className="text-2xl font-bold text-white">Your Party</h1>

        {/* Party card */}
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Party name</p>
            <p className="text-xl font-bold text-slate-800">{party.name}</p>
          </div>

          {/* Invite code */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">Invite code</p>
            <p className="text-sm text-slate-500 mb-3">
              Share this code with friends. They sign in with Google, then enter this code on their Party page.
            </p>
            <button
              onClick={copyCode}
              className="w-full flex items-center justify-between bg-indigo-50 border-2 border-indigo-200 rounded-xl px-5 py-4 hover:border-indigo-400 transition-colors group"
            >
              <span className="font-mono text-3xl font-bold tracking-widest text-indigo-700 flex-1 text-center">
                {party.invite_code}
              </span>
              <span className="text-sm font-semibold text-indigo-500 group-hover:text-indigo-700 shrink-0">
                {copied ? '✓ Copied!' : 'Copy'}
              </span>
            </button>
          </div>

          {/* Members */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-2">
              Members ({party.members.length})
            </p>
            <div className="space-y-2">
              {party.members.map(m => (
                <div key={m.user_id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                    {(m.display_name ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{m.display_name ?? 'Unknown'}</p>
                  </div>
                  {m.user_id === party.myUserId && (
                    <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-white">What&apos;s shared with your party?</p>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>✅ Player roster — everyone sees the same players</li>
            <li>✅ Game library — share your game collection</li>
            <li>✅ Match history — all sessions visible to everyone</li>
            <li>✅ Live scoring — join any active session by code</li>
          </ul>
        </div>

        {/* Leave party */}
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            className="w-full py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/50 transition-colors"
          >
            Leave Party
          </button>
        ) : (
          <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium text-center">
              Leave <span className="font-bold">{party.name}</span>? You can rejoin with the invite code.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLeave(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleLeave}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                Yes, Leave
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // NOT IN A PARTY
  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-2xl font-bold text-white">Party</h1>
      <p className="text-slate-400 text-sm">
        Create a party to share your player roster, game library, and match history with friends.
        Everyone needs to sign in with Google first.
      </p>

      {error && (
        <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg p-3">⚠️ {error}</p>
      )}

      {/* Create */}
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

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-500 text-sm">or</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* Join */}
      <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Join a Friend&apos;s Party</p>
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
    </div>
  )
}
