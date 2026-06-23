'use client'

import { useEffect, useState } from 'react'
import { getMyInviteCode, getFriends, addFriendByCode, removeFriend } from '@/lib/db'

type Friend = { id: string; friendUserId: string; friendName: string; since: string }

export default function FriendsPage() {
  const [myCode, setMyCode] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const [addCode, setAddCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const [code, list] = await Promise.all([getMyInviteCode(), getFriends()])
    setMyCode(code)
    setFriends(list)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleCopy() {
    await navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (addCode.length < 6 || adding) return
    setAdding(true)
    setAddError('')
    setAddSuccess('')
    try {
      const name = await addFriendByCode(addCode)
      setAddCode('')
      setAddSuccess(`✓ ${name} added as a friend!`)
      await reload()
      setTimeout(() => setAddSuccess(''), 4000)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setAdding(false)
  }

  async function handleRemove(id: string) {
    await removeFriend(id)
    setConfirmRemoveId(null)
    await reload()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-2xl font-bold text-white">Friends</h1>

      {/* Your invite code */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Your Invite Code</p>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-xl px-5 py-4 transition-colors group"
        >
          <span className="font-mono text-3xl font-bold tracking-widest text-indigo-700 flex-1 text-center">
            {myCode}
          </span>
          <span className="text-sm font-semibold text-indigo-500 group-hover:text-indigo-700 shrink-0">
            {copied ? '✓ Copied!' : 'Copy'}
          </span>
        </button>
        <p className="text-xs text-slate-400 text-center">
          Share this code with a friend. Once they add you, you can both see each other&apos;s games, matches, and stats.
        </p>
      </div>

      {/* Add a friend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Add a Friend</p>
        <form onSubmit={handleAdd} className="space-y-3">
          {addError && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">⚠️ {addError}</p>
          )}
          {addSuccess && (
            <p className="text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{addSuccess}</p>
          )}
          <input
            type="text"
            value={addCode}
            onChange={e => { setAddCode(e.target.value.toUpperCase()); setAddError('') }}
            placeholder="Their 6-letter code"
            maxLength={6}
            className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 placeholder:text-base placeholder:tracking-normal uppercase"
          />
          <button
            type="submit"
            disabled={adding || addCode.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl py-3 font-semibold transition-colors"
          >
            {adding ? 'Adding...' : 'Add Friend'}
          </button>
        </form>
      </div>

      {/* Friends list */}
      {friends.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-bold px-1">
            Friends ({friends.length})
          </p>
          {friends.map(f => (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {confirmRemoveId === f.id ? (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-slate-700 font-medium text-center">
                    Remove <span className="font-bold">{f.friendName}</span>? They will no longer see your games or stats.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRemove(f.id)}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                    {f.friendName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 leading-tight">{f.friendName}</p>
                    <p className="text-xs text-slate-400">
                      Since {new Date(f.since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmRemoveId(f.id)}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400 space-y-2">
          <div className="text-4xl">👥</div>
          <p className="font-medium">No friends yet</p>
          <p className="text-sm">Share your code above, then add theirs to connect.</p>
        </div>
      )}
    </div>
  )
}
