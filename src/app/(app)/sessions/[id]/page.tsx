'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSession, getSessionPlayers, getScores, insertScores, deleteScores, upsertScore, deleteSingleScore, updatePlayerWinner, updateSession, deleteSession, insertSession, insertPlayers } from '@/lib/db'

type Player = { id: string; name: string; is_winner: boolean }
type RoundRow = { id: string; scores: Record<string, string> }
type Session = {
  id: string; status: string; join_code: string; game_id: string; winner_name?: string | null
  first_player?: string | null
  games: { name: string; rules_pdf_url: string | null; scoring_categories: string[] | null } | null
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [rows, setRows] = useState<RoundRow[]>([{ id: '1', scores: {} }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Who goes first
  const [firstPlayer, setFirstPlayer] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [copied, setCopied] = useState(false)


  function animateTo(playerList: Player[], target: string) {
    if (playerList.length === 0) return
    setSpinning(true)
    setFirstPlayer(null)
    let ticks = 0
    const total = 14 + Math.floor(Math.random() * 8)
    const interval = setInterval(() => {
      setFirstPlayer(playerList[ticks % playerList.length].name)
      ticks++
      if (ticks >= total) {
        clearInterval(interval)
        setFirstPlayer(target)
        setSpinning(false)
      }
    }, 80)
  }

  async function pickFirst(playerList: Player[]) {
    if (playerList.length === 0) return
    const chosen = playerList[Math.floor(Math.random() * playerList.length)].name
    await updateSession(id, { first_player: chosen })
    animateTo(playerList, chosen)
  }

  const fetchData = useCallback(async () => {
    const [sessionData, playerData, scoreData] = await Promise.all([
      getSession(id),
      getSessionPlayers(id),
      getScores(id),
    ])

    setSession(sessionData)
    const pl = (playerData ?? []).map((p: { id: string; player_name: string; is_winner: boolean }) => ({
      id: p.id,
      name: p.player_name,
      is_winner: p.is_winner,
    }))
    setPlayers(pl)

    const cats: string[] = sessionData?.games?.scoring_categories ?? []

    // Build a round→scores map from whatever is in the database
    const roundMap: Record<number, Record<string, string>> = {}
    ;(scoreData ?? []).forEach((s: { round: number; player_name: string; points: number }) => {
      if (!roundMap[s.round]) roundMap[s.round] = {}
      roundMap[s.round][s.player_name] = String(s.points)
    })

    if (cats.length > 0) {
      // Category game: always show every category row, fill in scores where they exist
      setRows(cats.map((_, i) => ({ id: String(i + 1), scores: roundMap[i + 1] ?? {} })))
    } else {
      // Round-based game: always show at least 10 rows, more if scores exist beyond that
      const maxRound = Math.max(10, ...Object.keys(roundMap).map(Number))
      setRows(Array.from({ length: maxRound }, (_, i) => ({
        id: String(i + 1),
        scores: roundMap[i + 1] ?? {},
      })))
    }

    setLoading(false)

    // First player is stored in the database so all devices see the same result
    if (sessionData?.status === 'active' && pl.length > 0) {
      if (sessionData.first_player) {
        // Already set — show without animation (may have been set by another device)
        setFirstPlayer(sessionData.first_player)
      } else {
        // Not set yet — this is the first load, randomize and save to DB
        const target = pl[Math.floor(Math.random() * pl.length)].name
        await updateSession(id, { first_player: target })
        setTimeout(() => animateTo(pl, target), 600)
      }
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])


  function addRow() {
    setRows(prev => [...prev, { id: String(prev.length + 1), scores: {} }])
  }

  function deleteRow(rowId: string) {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEdit = useRef<{ rowId: string; playerName: string } | null>(null)

  function updateScore(rowId: string, playerName: string, value: string) {
    setRows(prev => {
      const updated = prev.map(r =>
        r.id === rowId ? { ...r, scores: { ...r.scores, [playerName]: value } } : r
      )
      // Save only the changed cell — avoids overwriting other players' scores
      lastEdit.current = { rowId, playerName }
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(async () => {
        const edit = lastEdit.current
        if (!edit) return
        const row = updated.find(r => r.id === edit.rowId)
        if (!row) return
        const roundIdx = updated.findIndex(r => r.id === edit.rowId)
        const val = parseInt(row.scores[edit.playerName] ?? '')
        if (isNaN(val)) {
          await deleteSingleScore(id, edit.playerName, roundIdx + 1)
        } else {
          await upsertScore({ session_id: id, player_name: edit.playerName, points: val, round: roundIdx + 1 })
        }
      }, 800)
      return updated
    })
  }

  function getTotal(playerName: string) {
    return rows.reduce((sum, row) => {
      const val = parseInt(row.scores[playerName] ?? '0')
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }

  async function handleSave() {
    setSaving(true)
    // Upsert each cell individually so we don't overwrite other players' scores
    const upserts: Promise<void>[] = []
    rows.forEach((row, roundIdx) => {
      players.forEach(p => {
        const val = parseInt(row.scores[p.name] ?? '')
        if (!isNaN(val)) {
          upserts.push(upsertScore({ session_id: id, player_name: p.name, points: val, round: roundIdx + 1 }))
        }
      })
    })
    await Promise.all(upserts)
    setSaving(false)
  }

  async function handleBack() {
    if (!completed) await handleSave()
    router.back()
  }

  async function handleDelete() {
    await deleteSession(id)
    router.push('/sessions')
  }

  async function handleShare() {
    if (!session) return
    const totals = players.map(p => ({ name: p.name, total: getTotal(p.name) }))
    const sorted = [...totals].sort((a, b) => b.total - a.total)
    const lines = [
      `🎲 ${session.games?.name ?? 'Board Game'} Results`,
      session.winner_name ? `🏆 Winner: ${session.winner_name}` : '',
      ...sorted.map((p, i) => `${ ['🥇','🥈','🥉'][i] ?? `${i+1}.`} ${p.name}: ${p.total}`),
      'Tracked with Boardgame Squire 🎲',
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleRematch() {
    if (!session) return
    try {
      const code = Math.random().toString(36).substring(2, 7).toUpperCase()
      const newSession = await insertSession({
        game_id: session.game_id,
        join_code: code,
        status: 'active',
      })
      await insertPlayers(
        players.map((p, i) => ({
          session_id: newSession.id,
          player_name: p.name,
          turn_order: i + 1,
        }))
      )
      const first = players[Math.floor(Math.random() * players.length)].name
      await updateSession(newSession.id, { first_player: first })
      router.push(`/sessions/${newSession.id}`)
    } catch (err) {
      alert('Error starting rematch: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function handleEndGame(resolvedWinner?: string) {
    try {
      await handleSave()

      // Re-fetch scores from DB to get the true totals before declaring a winner
      // (avoids wrong result if one player's screen had stale data when ending the game)
      let winner = resolvedWinner
      if (!winner) {
        const latestScores = await getScores(id)
        const dbTotals: Record<string, number> = {}
        latestScores.forEach((s: { player_name: string; points: number }) => {
          dbTotals[s.player_name] = (dbTotals[s.player_name] ?? 0) + s.points
        })
        const sorted = Object.entries(dbTotals).sort(([, a], [, b]) => b - a)
        const topScore = sorted[0]?.[1]
        const tied = sorted.filter(([, v]) => v === topScore)
        if (tied.length === 1) winner = tied[0][0]
      }

      await updateSession(id, { status: 'completed', winner_name: winner ?? null })
      fetchData()
    } catch (err) {
      alert('Error ending game: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  if (!session) return <div className="text-center py-16 text-slate-400">Match not found.</div>

  const totals = players.map(p => ({ name: p.name, total: getTotal(p.name) }))
  const sortedByScore = [...totals].sort((a, b) => b.total - a.total)
  const completed = session.status === 'completed'
  const medal = ['🥇', '🥈', '🥉']
  const categories: string[] = session.games?.scoring_categories ?? []
  const hasCategories = categories.length > 0

  // Winner logic: auto from scores, tie-break if needed
  const hasAnyScore = sortedByScore.some(p => p.total !== 0)
  const highScore = sortedByScore[0]?.total ?? 0
  const tiedPlayers = hasAnyScore ? sortedByScore.filter(p => p.total === highScore) : []
  const isTie = tiedPlayers.length > 1
  const autoWinner = !isTie && tiedPlayers.length === 1 ? tiedPlayers[0].name : null

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="text-slate-400 hover:text-slate-700">←</button>
          <div>
            <h1 className="text-lg font-bold text-white">{session.games?.name}</h1>
            <span className="text-xs text-indigo-400 font-mono">{session.join_code}</span>
          </div>
        </div>
        {!completed && (
          <button onClick={handleSave} disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-sm text-white">
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {session.games?.rules_pdf_url && (
        <a href={session.games.rules_pdf_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl py-2 text-sm font-medium mb-4">
          📄 Rules PDF
        </a>
      )}

      {/* Who Goes First */}
      {!completed && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4 text-center space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Who Goes First?</p>
          <div className={`text-2xl font-bold min-h-[2rem] transition-all ${spinning ? 'text-indigo-400' : firstPlayer ? 'text-white' : 'text-slate-600'}`}>
            {firstPlayer ?? '—'}
          </div>
          <button
            onClick={() => pickFirst(players)}
            disabled={spinning}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors">
            {spinning ? 'Picking...' : '🔀 Re-roll'}
          </button>
        </div>
      )}

      {/* Score Grid — white card for maximum readability */}
      <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-lg">
        {/* Player headers */}
        <div className="flex border-b-2 border-slate-200">
          <div className={`${hasCategories ? 'w-36' : 'w-14'} shrink-0 bg-slate-50`} />
          {players.map(p => {
            const total = getTotal(p.name)
            const isLeader = sortedByScore[0]?.name === p.name && total > 0
            return (
              <div key={p.id} className="flex-1 flex items-center justify-center gap-1.5 py-3 px-2 border-l border-slate-200 bg-slate-50">
                <div className="text-sm font-bold text-slate-700 truncate">{p.name}</div>
                <div className={`text-sm font-bold shrink-0 ${isLeader ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {total > 0 ? total : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Score rows */}
        {rows.map((row, rowIdx) => (
          <div key={row.id} className="flex border-b border-slate-100 last:border-b-0">
            {hasCategories ? (
              <div className="w-36 shrink-0 flex items-center px-3 border-r border-slate-200 bg-slate-50">
                <span className="text-xs text-slate-600 font-medium leading-tight">{categories[rowIdx] ?? `Round ${rowIdx + 1}`}</span>
              </div>
            ) : (
              <div className="w-14 shrink-0 flex items-center justify-between px-2 bg-slate-50 border-r border-slate-100">
                <span className="text-xs text-slate-400 font-medium">R{rowIdx + 1}</span>
                {!completed && (
                  <button onClick={() => deleteRow(row.id)} className="text-slate-300 hover:text-red-400 text-base transition-colors">🗑</button>
                )}
              </div>
            )}
            {players.map(p => (
              <div key={p.id} className="flex-1 border-l border-slate-100">
                {completed ? (
                  <div className="text-center py-3 text-sm text-slate-700 font-medium">{row.scores[p.name] ?? '—'}</div>
                ) : (
                  <input
                    type="number"
                    value={row.scores[p.name] ?? ''}
                    onChange={e => updateScore(row.id, p.name, e.target.value)}
                    onWheel={e => e.currentTarget.blur()}
                    placeholder="—"
                    className="w-full text-center bg-transparent py-3 text-sm text-slate-800 font-medium focus:outline-none focus:bg-indigo-50 placeholder-slate-300"
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {!completed && (
          <button onClick={addRow}
            className="w-full py-3 text-sm text-indigo-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
            + Add Round
          </button>
        )}

        {/* Totals */}
        <div className="flex border-t-2 border-slate-300 bg-slate-100">
          <div className={`${hasCategories ? 'w-36' : 'w-14'} shrink-0 flex items-center justify-center text-xs text-slate-500 font-bold border-r border-slate-300`}>Σ</div>
          {players.map(p => {
            const total = getTotal(p.name)
            const isLeader = sortedByScore[0]?.name === p.name && total > 0
            return (
              <div key={p.id} className={`flex-1 text-center py-3 font-bold border-l border-slate-200 text-lg ${isLeader ? 'text-indigo-600' : 'text-slate-800'}`}>
                {total}
              </div>
            )
          })}
        </div>
      </div>

      {/* Standings */}
      {sortedByScore.some(p => p.total !== 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Standings</h2>
          {sortedByScore.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-6 text-lg">{medal[i] ?? `${i + 1}.`}</span>
              <span className="flex-1 font-medium text-white">{p.name}</span>
              <span className={`font-bold ${i === 0 ? 'text-indigo-400' : 'text-slate-300'}`}>{p.total}</span>
            </div>
          ))}
        </div>
      )}

      {/* End game */}
      {!completed && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
          <h2 className="font-semibold text-white">End Game</h2>

          {/* Tie-breaker — only shown when scores are level */}
          {isTie && (
            <div className="space-y-2">
              <p className="text-sm text-amber-400 font-medium text-center">
                🤝 It&apos;s a tie! Pick the winner by tie-break rules:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {tiedPlayers.map(p => (
                  <button key={p.name} type="button"
                    onClick={() => setWinner(winner === p.name ? null : p.name)}
                    className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all border ${
                      winner === p.name
                        ? 'bg-yellow-400 border-yellow-300 text-slate-900 scale-105 shadow-lg'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                    }`}>
                    {winner === p.name ? '🏆 ' : ''}{p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => handleEndGame(isTie ? (winner ?? undefined) : (autoWinner ?? undefined))}
            disabled={isTie && !winner}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold transition-colors">
            {isTie
              ? (winner ? `🏆 ${winner} wins — Save & End` : 'Pick a winner above')
              : autoWinner
                ? `🏆 ${autoWinner} wins — Save & End`
                : 'Save & End Game'}
          </button>
        </div>
      )}

      {completed && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🏁</div>
            <p className="font-semibold text-lg text-white">Game Complete</p>
            {session.winner_name && (
              <p className="text-yellow-400 font-bold mt-1 text-lg">🏆 {session.winner_name} wins!</p>
            )}
            {!session.winner_name && sortedByScore[0] && sortedByScore[0].total > 0 && (
              <p className="text-indigo-400 mt-1">{sortedByScore[0].name} leads with {sortedByScore[0].total} points</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-semibold transition-colors">
              {copied ? '✓ Copied!' : '📋 Copy Results'}
            </button>
            <button
              onClick={handleRematch}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold transition-colors">
              🔁 Rematch
            </button>
          </div>
        </div>
      )}

      {/* Delete Session */}
      <div className="mt-4">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/50 transition-colors">
            🗑 Delete Match
          </button>
        ) : (
          <div className="bg-red-950/50 border border-red-800 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium text-center">Delete this match permanently?</p>
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
    </div>
  )
}
