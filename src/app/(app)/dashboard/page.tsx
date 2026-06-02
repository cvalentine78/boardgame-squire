'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSessions } from '@/lib/db'

type Session = {
  id: string
  status: string
  join_code: string
  games: { name: string } | null
}

export default function DashboardPage() {
  const [activeMatches, setActiveMatches] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions().then(data => {
      const all = Array.isArray(data) ? data : []
      setActiveMatches(all.filter(s => s.status === 'active'))
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Boardgame Squire</h1>
        <p className="text-slate-400 text-sm mt-1">Your board game companion 🎲</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/sessions/new"
          className="bg-indigo-600 hover:bg-indigo-500 rounded-xl p-4 text-center transition-colors text-white">
          <div className="text-2xl mb-1">🃏</div>
          <div className="font-semibold text-sm">New Match</div>
        </Link>
        <Link href="/sessions"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm">
          <div className="text-2xl mb-1">📋</div>
          <div className="font-semibold text-sm text-slate-700">All Matches</div>
        </Link>
        <Link href="/games"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm">
          <div className="text-2xl mb-1">🎲</div>
          <div className="font-semibold text-sm text-slate-700">Games</div>
        </Link>
        <Link href="/stats"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm">
          <div className="text-2xl mb-1">📊</div>
          <div className="font-semibold text-sm text-slate-700">Stats</div>
        </Link>
        <Link href="/tools"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm">
          <div className="text-2xl mb-1">🎯</div>
          <div className="font-semibold text-sm text-slate-700">Dice & Tools</div>
        </Link>
        <Link href="/players"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm">
          <div className="text-2xl mb-1">👥</div>
          <div className="font-semibold text-sm text-slate-700">Players</div>
        </Link>
        <Link href="/party"
          className="bg-white hover:bg-slate-50 rounded-xl p-4 text-center transition-colors border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-2xl mb-1">🎉</div>
          <div className="font-semibold text-sm text-slate-700">Party</div>
        </Link>
        <Link href="/whats-new"
          className="bg-slate-800 hover:bg-slate-700 rounded-xl p-4 text-center transition-colors border border-slate-700 col-span-2 md:col-span-1">
          <div className="text-2xl mb-1">📣</div>
          <div className="font-semibold text-sm text-slate-300">What&apos;s New</div>
        </Link>
      </div>

      {/* In-progress matches */}
      {!loading && activeMatches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-white">▶ In Progress</h2>
          <div className="space-y-3">
            {activeMatches.map(session => (
              <Link key={session.id} href={`/sessions/${session.id}`}
                className="flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 rounded-2xl px-5 py-4 transition-colors shadow-lg">
                <div>
                  <div className="font-bold text-white text-lg">{session.games?.name}</div>
                  <div className="text-xs text-indigo-200 font-mono mt-0.5">{session.join_code}</div>
                </div>
                <span className="text-sm font-bold text-white bg-white/20 px-4 py-2 rounded-xl">
                  Resume →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
