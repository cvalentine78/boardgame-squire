'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSessions, getScoresForSessions } from '@/lib/db'

type Session = {
  id: string
  status: string
  join_code: string
  winner_name: string | null
  created_at: string
  games: { name: string } | null
  session_players: { player_name: string }[]
}

type ScoreRow = { player_name: string; points: number; session_id: string }

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionTotals, setSessionTotals] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions().then(async (sessionData) => {
      const all: Session[] = Array.isArray(sessionData) ? sessionData : []
      setSessions(all)

      // Fetch scores only for the sessions we know about —
      // avoids RLS silently dropping rows on an unfiltered scores query
      const sessionIds = all.map(s => s.id)
      const scoreData = await getScoresForSessions(sessionIds)

      const totals: Record<string, Record<string, number>> = {}
      ;(scoreData ?? []).forEach((s: ScoreRow) => {
        if (!totals[s.session_id]) totals[s.session_id] = {}
        totals[s.session_id][s.player_name] = (totals[s.session_id][s.player_name] ?? 0) + s.points
      })
      setSessionTotals(totals)
      setLoading(false)
    })
  }, [])

  const active = sessions.filter(s => s.status === 'active')
  const completed = sessions.filter(s => s.status === 'completed')

  function SessionCard({ session }: { session: Session }) {
    const scores = sessionTotals[session.id] ?? {}
    const players = session.session_players ?? []
    const hasScores = Object.keys(scores).length > 0
    const isCompleted = session.status === 'completed'

    const sortedPlayers = [...players].sort((a, b) => {
      if (isCompleted && hasScores) return (scores[b.player_name] ?? 0) - (scores[a.player_name] ?? 0)
      return 0
    })

    return (
      <Link href={`/sessions/${session.id}`}
        className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="font-semibold text-slate-800">{session.games?.name ?? 'Unknown game'}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isCompleted ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'
          }`}>
            {isCompleted ? 'done' : 'active'}
          </span>
        </div>

        {/* Date */}
        <div className="px-4 pb-2">
          <span className="text-xs text-slate-400">{formatDate(session.created_at)}</span>
        </div>

        {/* Player scores */}
        {sortedPlayers.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {sortedPlayers.map(p => {
              const isWinner = session.winner_name === p.player_name
              const score = scores[p.player_name]
              return (
                <div key={p.player_name}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${
                    isWinner
                      ? 'bg-yellow-100 text-yellow-800 font-semibold'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                  {isWinner && <span>🏆</span>}
                  <span>{p.player_name}</span>
                  {score !== undefined && (
                    <span className={`font-bold ${isWinner ? 'text-yellow-700' : 'text-slate-800'}`}>
                      {score}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Matches</h1>
        <Link href="/sessions/new"
          className="bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
          + New
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🃏</div>
          <p className="text-lg font-medium">No matches yet</p>
          <Link href="/sessions/new"
            className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
            Start a Match
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-2">Active</h2>
              <div className="space-y-2">
                {active.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-2">Completed</h2>
              <div className="space-y-2">
                {completed.map(s => <SessionCard key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
