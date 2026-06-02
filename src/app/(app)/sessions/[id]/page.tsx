'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, getSessionPlayers, getScores, upsertScore, deleteSingleScore, updateSession, deleteSession, insertSession, insertPlayers, getMessages, sendMessage } from '@/lib/db'

type Player = { id: string; name: string; is_winner: boolean }
type RoundRow = { id: string; scores: Record<string, string> }
type Message = { id: string; user_id: string | null; display_name: string; content: string; created_at: string }
type Session = {
  id: string; status: string; join_code: string; game_id: string; winner_name?: string | null
  first_player?: string | null
  games: { name: string; rules_pdf_url: string | null; scoring_categories: string[] | null } | null
}

type EditingCell = {
  rowId: string
  playerName: string
  rowIdx: number
  label: string
  currentValue: string
}


export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [rows, setRows] = useState<RoundRow[]>([{ id: '1', scores: {} }])
  const [loading, setLoading] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Who goes first
  const [firstPlayer, setFirstPlayer] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [copied, setCopied] = useState(false)

  // Score cell modal
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [cellInput, setCellInput] = useState('')
  const [cellSaving, setCellSaving] = useState(false)
  const cellInputRef = useRef<HTMLInputElement>(null)

  // Chat
  const [messages, setMessages] = useState<Message[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<Session | null>(null)
  const editingCellRef = useRef<EditingCell | null>(null)

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
    const roundMap: Record<number, Record<string, string>> = {}
    ;(scoreData ?? []).forEach((s: { round: number; player_name: string; points: number }) => {
      if (!roundMap[s.round]) roundMap[s.round] = {}
      roundMap[s.round][s.player_name] = String(s.points)
    })

    if (cats.length > 0) {
      setRows(cats.map((_, i) => ({ id: String(i + 1), scores: roundMap[i + 1] ?? {} })))
    } else {
      const maxRound = Math.max(10, ...Object.keys(roundMap).map(Number))
      setRows(Array.from({ length: maxRound }, (_, i) => ({
        id: String(i + 1),
        scores: roundMap[i + 1] ?? {},
      })))
    }

    setLoading(false)

    if (sessionData?.status === 'active' && pl.length > 0) {
      if (sessionData.first_player) {
        setFirstPlayer(sessionData.first_player)
      }
      // first_player left null until user taps "Pick First Player"
    }
  }, [id])

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { editingCellRef.current = editingCell }, [editingCell])

  const reloadScores = useCallback(async () => {
    if (editingCellRef.current) return  // don't reload while a player is mid-entry
    const scoreData = await getScores(id)
    const cats: string[] = sessionRef.current?.games?.scoring_categories ?? []
    const roundMap: Record<number, Record<string, string>> = {}
    ;(scoreData ?? []).forEach((s: { round: number; player_name: string; points: number }) => {
      if (!roundMap[s.round]) roundMap[s.round] = {}
      roundMap[s.round][s.player_name] = String(s.points)
    })
    if (cats.length > 0) {
      setRows(cats.map((_, i) => ({ id: String(i + 1), scores: roundMap[i + 1] ?? {} })))
    } else {
      const maxRound = Math.max(10, ...Object.keys(roundMap).map(Number))
      setRows(Array.from({ length: maxRound }, (_, i) => ({
        id: String(i + 1),
        scores: roundMap[i + 1] ?? {},
      })))
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    getMessages(id).then(data => setMessages(data as Message[]))
    createClient().auth.getSession().then(({ data: { session } }) => {
      setMyUserId(session?.user?.id ?? null)
    })
  }, [id])

  useEffect(() => {
    const channel = createClient()
      .channel(`session-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'scores',
        filter: `session_id=eq.${id}`,
      }, () => { reloadScores() })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `session_id=eq.${id}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setChatOpen(prev => {
          if (!prev) setUnread(u => u + 1)
          return prev
        })
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [id, reloadScores])

  // Poll every 5 seconds as a fallback for devices where Supabase Realtime
  // isn't firing (e.g. Realtime not enabled on the scores table in the dashboard)
  useEffect(() => {
    if (!session || session.status !== 'active') return
    const interval = setInterval(() => reloadScores(), 5000)
    return () => clearInterval(interval)
  }, [session, reloadScores])

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

  // Focus the cell input when the modal opens
  useEffect(() => {
    if (editingCell) {
      setTimeout(() => cellInputRef.current?.focus(), 50)
    }
  }, [editingCell])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || sending) return
    setSending(true)
    setChatInput('')
    try {
      await sendMessage(id, text)
    } catch { /* ignore */ }
    setSending(false)
  }

  function addRow() {
    setRows(prev => [...prev, { id: String(prev.length + 1), scores: {} }])
  }

  function deleteRow(rowId: string) {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  function getTotal(playerName: string) {
    return rows.reduce((sum, row) => {
      const val = parseInt(row.scores[playerName] ?? '0')
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }

  // Score cell modal
  function openCell(rowId: string, playerName: string, rowIdx: number) {
    const row = rows.find(r => r.id === rowId)
    const currentValue = row?.scores[playerName] ?? ''
    const cats: string[] = session?.games?.scoring_categories ?? []
    const label = cats.length > 0
      ? (cats[rowIdx] ?? `Round ${rowIdx + 1}`)
      : `Round ${rowIdx + 1}`
    setEditingCell({ rowId, playerName, rowIdx, label, currentValue })
    setCellInput(currentValue)
  }

  async function handleCellSave() {
    if (!editingCell || cellSaving) return
    setCellSaving(true)
    const { rowId, playerName, rowIdx } = editingCell
    const val = parseInt(cellInput)

    // Optimistic local update
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      if (isNaN(val)) {
        const next = { ...r.scores }
        delete next[playerName]
        return { ...r, scores: next }
      }
      return { ...r, scores: { ...r.scores, [playerName]: String(val) } }
    }))

    setEditingCell(null)

    try {
      if (isNaN(val)) {
        await deleteSingleScore(id, playerName, rowIdx + 1)
      } else {
        await upsertScore({ session_id: id, player_name: playerName, points: val, round: rowIdx + 1 })
      }
      await reloadScores()
    } catch {
      await reloadScores() // revert to DB state on error
    }
    setCellSaving(false)
  }

  async function handleCellClear() {
    if (!editingCell || cellSaving) return
    setCellSaving(true)
    const { rowId, playerName, rowIdx } = editingCell

    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const next = { ...r.scores }
      delete next[playerName]
      return { ...r, scores: next }
    }))

    setEditingCell(null)

    try {
      await deleteSingleScore(id, playerName, rowIdx + 1)
      await reloadScores()
    } catch {
      await reloadScores()
    }
    setCellSaving(false)
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
      router.push(`/sessions/${newSession.id}`)
    } catch (err) {
      console.error('Error starting rematch:', err)
    }
  }

  async function handleEndGame(resolvedWinner?: string) {
    try {
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
      console.error('Error ending game:', err)
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

  const hasAnyScore = sortedByScore.some(p => p.total !== 0)
  const highScore = sortedByScore[0]?.total ?? 0
  const tiedPlayers = hasAnyScore ? sortedByScore.filter(p => p.total === highScore) : []
  const isTie = tiedPlayers.length > 1
  const autoWinner = !isTie && tiedPlayers.length === 1 ? tiedPlayers[0].name : null

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">←</button>
          <div>
            <h1 className="text-lg font-bold text-white">{session.games?.name}</h1>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(session.join_code)
                setCopied(true)
                setTimeout(() => setCopied(false), 2500)
              }}
              className="text-xs text-indigo-400 font-mono hover:text-indigo-300 transition-colors"
              title="Tap to copy join code"
            >
              {copied ? '✓ Copied!' : session.join_code}
            </button>
          </div>
        </div>
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
            {spinning ? 'Picking...' : firstPlayer ? '🔀 Re-roll' : '🔀 Pick First Player'}
          </button>
        </div>
      )}

      {/* Score Grid */}
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
            {players.map(p => {
              const val = row.scores[p.name]
              return (
                <div key={p.id} className="flex-1 border-l border-slate-100">
                  {completed ? (
                    <div className="text-center py-3 text-sm text-slate-700 font-medium">{val ?? '—'}</div>
                  ) : (
                    <button
                      onClick={() => openCell(row.id, p.name, rowIdx)}
                      className={`w-full py-3 text-sm font-medium text-center transition-colors hover:bg-indigo-50 active:bg-indigo-100 ${
                        val !== undefined ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      {val ?? '—'}
                    </button>
                  )}
                </div>
              )
            })}
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
              ? (winner ? `🏆 ${winner} wins — End Game` : 'Pick a winner above')
              : autoWinner
                ? `🏆 ${autoWinner} wins — End Game`
                : 'End Game'}
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

      {/* Chat */}
      <div className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <button
          onClick={() => { setChatOpen(v => !v); setUnread(0) }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-semibold text-white text-sm">Match Chat</span>
            {!chatOpen && unread > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} new</span>
            )}
            {messages.length > 0 && (
              <span className="text-xs text-slate-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="text-slate-400 text-sm">{chatOpen ? '▲' : '▼'}</span>
        </button>

        {chatOpen && (
          <div className="border-t border-slate-700">
            <div className="h-56 overflow-y-auto px-3 py-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">No messages yet — say something! 👋</p>
              ) : (
                messages.map(msg => {
                  const isMe = msg.user_id === myUserId
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-xs text-slate-400 mb-0.5 ml-1">{msg.display_name}</span>
                      )}
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-slate-600 mt-0.5 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-700 flex gap-2 p-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1 bg-white text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

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

      {/* Score cell modal — bottom sheet */}
      {editingCell && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={e => { if (e.target === e.currentTarget) setEditingCell(null) }}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingCell(null)} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl space-y-5">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{editingCell.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{editingCell.playerName}</p>
            </div>

            <input
              ref={cellInputRef}
              type="number"
              value={cellInput}
              onChange={e => setCellInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCellSave() }}
              onWheel={e => e.currentTarget.blur()}
              placeholder="Enter score…"
              className="w-full text-center text-4xl font-bold bg-slate-100 text-slate-800 rounded-2xl px-4 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-300"
            />

            <div className="flex gap-3">
              {editingCell.currentValue !== '' && (
                <button
                  onClick={handleCellClear}
                  disabled={cellSaving}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors disabled:opacity-40"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleCellSave}
                disabled={cellSaving}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-colors disabled:opacity-40"
              >
                {cellSaving ? 'Saving…' : 'Save Score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
