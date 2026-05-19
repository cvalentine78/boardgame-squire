'use client'

import { useEffect, useState } from 'react'
import { getAllSessionPlayers, getAllScores, getMyParties } from '@/lib/db'

type Row = {
  player_name: string
  session_id: string
  game_sessions: { id: string; status: string; winner_name: string | null; games: { name: string } | null } | null
}

type ScoreRow = { player_name: string; points: number; session_id: string }

type PlayerStat = {
  name: string
  played: number
  wins: number
  winRate: number
  avgScore: number | null
  bestScore: number | null
}

type GamePlayerStat = { name: string; played: number; wins: number; bestScore: number | null }

type GameStat = {
  name: string
  sessions: number
  players: GamePlayerStat[]
}

type Party = { id: string; name: string; game_id: string | null; game_name: string | null }

export default function StatsPage() {
  const [allRows, setAllRows] = useState<Row[]>([])
  const [allScores, setAllScores] = useState<ScoreRow[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [gameStats, setGameStats] = useState<GameStat[]>([])
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    Promise.all([getAllSessionPlayers(), getAllScores(), getMyParties()]).then(([rows, scoreRows, partyList]) => {
      setAllRows(rows ?? [])
      setAllScores(scoreRows ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setParties((partyList as any[]).filter(p => p.game_id))  // only parties with a game are useful here
      setLoading(false)
    })
  }, [])

  // Recompute stats whenever filter changes
  useEffect(() => {
    if (loading) return

    const selectedParty = parties.find(p => p.id === selectedPartyId) ?? null
    const filterGameName = selectedParty?.game_name ?? null

    const completed = allRows.filter((r: Row) => {
      if (r.game_sessions?.status !== 'completed') return false
      if (filterGameName && r.game_sessions?.games?.name !== filterGameName) return false
      return true
    })

    // Build per-session totals
    const sessionTotals: Record<string, Record<string, number>> = {}
    allScores.forEach((s: ScoreRow) => {
      if (!sessionTotals[s.session_id]) sessionTotals[s.session_id] = {}
      sessionTotals[s.session_id][s.player_name] =
        (sessionTotals[s.session_id][s.player_name] ?? 0) + s.points
    })

    const uniqueSessions = new Set(completed.map((r: Row) => r.session_id))
    setTotalSessions(uniqueSessions.size)

    // Per-player stats
    const byPlayer: Record<string, { name: string; played: number; wins: number; scores: number[] }> = {}
    completed.forEach((r: Row) => {
      if (!byPlayer[r.player_name])
        byPlayer[r.player_name] = { name: r.player_name, played: 0, wins: 0, scores: [] }
      byPlayer[r.player_name].played++
      if (r.game_sessions?.winner_name === r.player_name) byPlayer[r.player_name].wins++
      const total = sessionTotals[r.session_id]?.[r.player_name]
      if (total !== undefined) byPlayer[r.player_name].scores.push(total)
    })

    setPlayerStats(
      Object.values(byPlayer)
        .map(p => ({
          name: p.name,
          played: p.played,
          wins: p.wins,
          winRate: p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0,
          avgScore: p.scores.length > 0
            ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length)
            : null,
          bestScore: p.scores.length > 0 ? Math.max(...p.scores) : null,
        }))
        .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.played - a.played)
    )

    // Per-game stats
    const byGame: Record<string, {
      name: string
      sessionIds: Set<string>
      players: Record<string, { played: number; wins: number; scores: number[] }>
    }> = {}

    completed.forEach((r: Row) => {
      const name = r.game_sessions?.games?.name ?? 'Unknown'
      if (!byGame[name]) byGame[name] = { name, sessionIds: new Set(), players: {} }
      byGame[name].sessionIds.add(r.session_id)
      if (!byGame[name].players[r.player_name])
        byGame[name].players[r.player_name] = { played: 0, wins: 0, scores: [] }
      byGame[name].players[r.player_name].played++
      if (r.game_sessions?.winner_name === r.player_name)
        byGame[name].players[r.player_name].wins++
      const score = sessionTotals[r.session_id]?.[r.player_name]
      if (score !== undefined) byGame[name].players[r.player_name].scores.push(score)
    })

    setGameStats(
      Object.values(byGame)
        .map(g => ({
          name: g.name,
          sessions: g.sessionIds.size,
          players: Object.entries(g.players)
            .map(([name, s]) => ({
              name,
              played: s.played,
              wins: s.wins,
              bestScore: s.scores.length > 0 ? Math.max(...s.scores) : null,
            }))
            .sort((a, b) => b.wins - a.wins || b.played - a.played),
        }))
        .sort((a, b) => b.sessions - a.sessions)
    )
  }, [allRows, allScores, selectedPartyId, parties, loading])

  const medal = ['🥇', '🥈', '🥉']
  const selectedParty = parties.find(p => p.id === selectedPartyId) ?? null

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold text-white">Stats</h1>

      {/* Party filter */}
      {parties.length > 0 && (
        <div className="bg-white rounded-2xl p-4 space-y-2 shadow-sm">
          <label className="block text-xs text-slate-500 uppercase tracking-wide font-bold">Filter by Party</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPartyId('')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                !selectedPartyId
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All games
            </button>
            {parties.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPartyId(p.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                  selectedPartyId === p.id
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {selectedParty?.game_name && (
            <p className="text-xs text-indigo-500 font-medium pt-1">
              🎲 Showing {selectedParty.game_name} stats only
            </p>
          )}
        </div>
      )}

      {/* Total sessions */}
      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
        <div className="text-3xl font-bold text-indigo-600">{totalSessions}</div>
        <div className="text-sm text-slate-500 mt-1">
          {selectedParty?.game_name
            ? `${selectedParty.game_name} Matches`
            : 'Total Games Played'}
        </div>
      </div>

      {playerStats.length > 0 ? (
        <>
          {/* Leaderboard */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-white">🏆 Leaderboard</h2>
            <div className="space-y-2">
              {playerStats.map((p, i) => (
                <div key={p.name} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl w-8 shrink-0">{medal[i] ?? `${i + 1}.`}</span>
                    <span className="flex-1 font-semibold text-slate-800">{p.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">
                        {p.wins} {p.wins === 1 ? 'win' : 'wins'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.played} {p.played === 1 ? 'game' : 'games'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-11">
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-sm font-bold text-indigo-600">{p.winRate}%</div>
                      <div className="text-xs text-slate-400">Win rate</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-sm font-bold text-slate-700">
                        {p.avgScore !== null ? p.avgScore : '—'}
                      </div>
                      <div className="text-xs text-slate-400">Avg score</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-sm font-bold text-emerald-600">
                        {p.bestScore !== null ? p.bestScore : '—'}
                      </div>
                      <div className="text-xs text-slate-400">Best score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Game — only show when not already filtered to one game */}
          {!selectedParty?.game_name && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-white">By Game</h2>
              <div className="space-y-3">
                {gameStats.map(g => (
                  <div key={g.name} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">{g.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {g.sessions} {g.sessions === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {g.players.map((p, i) => {
                        const winRate = p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0
                        return (
                          <div key={p.name} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-base w-6 shrink-0">{medal[i] ?? `${i + 1}.`}</span>
                            <span className="flex-1 text-sm font-medium text-slate-700">{p.name}</span>
                            <span className="text-xs text-slate-500 w-16 text-right">
                              {p.wins}W – {p.played - p.wins}L
                            </span>
                            {p.bestScore !== null && (
                              <span className="text-xs text-emerald-600 font-semibold w-14 text-right">
                                Best: {p.bestScore}
                              </span>
                            )}
                            <span className={`text-xs font-semibold w-10 text-right ${
                              winRate >= 50 ? 'text-indigo-600' : 'text-slate-400'
                            }`}>
                              {winRate}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-2">📊</div>
          <p>No completed games yet</p>
          <p className="text-sm mt-1">
            {selectedParty?.game_name
              ? `Finish a match of ${selectedParty.game_name} to see stats here`
              : 'Stats will appear after you finish a match'}
          </p>
        </div>
      )}
    </div>
  )
}
