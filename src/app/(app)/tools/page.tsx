'use client'

import { useState, useEffect } from 'react'
import { getPlayers } from '@/lib/db'
import { getRoundTracker, setRoundTracker, clearRoundTracker, advanceRound, type RoundTrackerState } from '@/lib/round-tracker'

const DICE = [4, 6, 8, 10, 12, 20, 100]

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1
}

// Pip positions in a 3×3 grid (indices 0-8: TL,TC,TR,ML,MC,MR,BL,BC,BR)
const PIP_MAP: Record<number, boolean[]> = {
  1: [false,false,false,false,true, false,false,false,false],
  2: [false,false,true, false,false,false,true, false,false],
  3: [false,false,true, false,true, false,true, false,false],
  4: [true, false,true, false,false,false,true, false,true ],
  5: [true, false,true, false,true, false,true, false,true ],
  6: [true, false,true, true, false,true, true, false,true ],
}

const DIE_SHAPES: Record<number, { points: string; textY: number }> = {
  4:   { points: '32,5 61,57 3,57',                         textY: 46 },
  8:   { points: '32,4 60,32 32,60 4,32',                   textY: 36 },
  10:  { points: '32,4 58,26 46,58 18,58 6,26',             textY: 38 },
  12:  { points: '32,4 57,20 57,44 32,60 7,44 7,20',        textY: 36 },
  20:  { points: '32,59 3,7 61,7',                          textY: 32 },
  100: { points: '32,4 58,26 46,58 18,58 6,26',             textY: 38 },
}

function DiceFace({ value, sides }: { value: number; sides: number }) {
  if (sides === 6) {
    const pips = PIP_MAP[value] ?? PIP_MAP[1]
    return (
      <div className="w-16 h-16 bg-white rounded-xl border-2 border-indigo-400 shadow-lg p-2 flex-shrink-0">
        <div className="grid grid-cols-3 grid-rows-3 h-full">
          {pips.map((show, i) => (
            <div key={i} className="flex items-center justify-center">
              {show && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const shape = DIE_SHAPES[sides]
  if (shape) {
    const label = sides === 100 ? `${value}` : `${value}`
    return (
      <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <polygon points={shape.points} fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
          {sides === 20 ? (
            <>
              <text
                x="32"
                y={shape.textY - 10}
                textAnchor="middle"
                fill="#a5b4fc"
                fontSize="9"
                fontFamily="sans-serif"
              >
                d{sides}
              </text>
              <text
                x="32"
                y={shape.textY + 4}
                textAnchor="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {label}
              </text>
            </>
          ) : (
            <>
              <text
                x="32"
                y={shape.textY}
                textAnchor="middle"
                fill="white"
                fontSize={value >= 100 ? '12' : '16'}
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {label}
              </text>
              <text
                x="32"
                y={shape.textY + 11}
                textAnchor="middle"
                fill="#a5b4fc"
                fontSize="9"
                fontFamily="sans-serif"
              >
                d{sides}
              </text>
            </>
          )}
        </svg>
      </div>
    )
  }

  // Fallback
  return (
    <div className="w-16 h-16 bg-indigo-600 rounded-xl shadow-lg flex flex-col items-center justify-center flex-shrink-0">
      <span className="text-2xl font-bold text-white leading-none">{value}</span>
      <span className="text-xs text-indigo-200 mt-0.5">d{sides}</span>
    </div>
  )
}

export default function ToolsPage() {
  const [selectedDie, setSelectedDie] = useState(6)
  const [diceCount, setDiceCount] = useState(1)
  const [rolls, setRolls] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)

  const [savedPlayers, setSavedPlayers] = useState<{ id: string; name: string; avatar: string | null }[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [firstPlayer, setFirstPlayer] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)

  // Round Tracker
  const [rtPlayers, setRtPlayers] = useState<string[]>([])
  const [rtInput, setRtInput] = useState('')
  const [rtRound, setRtRound] = useState(1)
  const [rtFirstIdx, setRtFirstIdx] = useState(0)
  const [rtActive, setRtActive] = useState(false)

  useEffect(() => {
    getPlayers().then(data => {
      if (Array.isArray(data)) setSavedPlayers(data)
    })
    // Restore any active session
    const saved = getRoundTracker()
    if (saved) {
      setRtPlayers(saved.players)
      setRtRound(saved.round)
      setRtFirstIdx(saved.firstIdx)
      setRtActive(saved.active)
    }
  }, [])

  function rtAddPlayer() {
    const name = rtInput.trim()
    if (!name || rtPlayers.includes(name)) return
    setRtPlayers(prev => [...prev, name])
    setRtInput('')
  }

  function rtRemovePlayer(name: string) {
    setRtPlayers(prev => {
      const next = prev.filter(p => p !== name)
      setRtFirstIdx(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }

  function rtStart() {
    const state: RoundTrackerState = { players: rtPlayers, round: rtRound, firstIdx: rtFirstIdx, active: true }
    setRoundTracker(state)
    setRtActive(true)
  }

  function rtNextRound() {
    const current: RoundTrackerState = { players: rtPlayers, round: rtRound, firstIdx: rtFirstIdx, active: true }
    const next = advanceRound(current)
    setRoundTracker(next)
    setRtRound(next.round)
    setRtFirstIdx(next.firstIdx)
  }

  function rtReset() {
    setRtRound(1)
    setRtFirstIdx(0)
    setRtActive(false)
    clearRoundTracker()
  }

  function handleRoll() {
    setRolling(true)
    setTimeout(() => {
      const results = Array.from({ length: diceCount }, () => rollDie(selectedDie))
      setRolls(results)
      setRolling(false)
    }, 400)
  }

  function togglePlayer(name: string) {
    setSelectedPlayers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
    setFirstPlayer(null)
  }

  function handleWhoGoesFirst() {
    if (selectedPlayers.length === 0) return
    setSpinning(true)
    setFirstPlayer(null)
    setTimeout(() => {
      setFirstPlayer(selectedPlayers[Math.floor(Math.random() * selectedPlayers.length)])
      setSpinning(false)
    }, 600)
  }

  const total = rolls.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold text-white">Game Tools</h1>

      {/* Dice Roller */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">🎲 Dice Roller</h2>

        <div>
          <label className="text-sm text-slate-500 block mb-2">Dice Type</label>
          <div className="flex flex-wrap gap-2">
            {DICE.map(d => (
              <button key={d} onClick={() => setSelectedDie(d)}
                className={`px-3 py-2 rounded-lg text-sm font-mono font-bold transition-colors ${
                  selectedDie === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                d{d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500 block mb-2">Number of Dice: {diceCount}</label>
          <input type="range" min={1} max={10} value={diceCount}
            onChange={e => setDiceCount(Number(e.target.value))}
            className="w-full accent-indigo-500" />
        </div>

        <button onClick={handleRoll} disabled={rolling}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-4 text-lg font-bold transition-colors">
          {rolling ? '🎲 Rolling...' : `Roll ${diceCount}d${selectedDie}`}
        </button>

        {rolls.length > 0 && !rolling && (
          <div className="text-center space-y-3">
            <div className="flex flex-wrap gap-3 justify-center">
              {rolls.map((r, i) => (
                <DiceFace key={i} value={r} sides={selectedDie} />
              ))}
            </div>
            {diceCount > 1 && (
              <p className="text-slate-500 text-sm">
                Total: <span className="text-slate-800 font-bold text-lg">{total}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Who Goes First */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">🏆 Who Goes First?</h2>

        {savedPlayers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No players yet — add some on the Players page.
          </p>
        ) : (
          <div>
            <label className="text-sm text-slate-500 block mb-2">Select players</label>
            <div className="grid grid-cols-2 gap-2">
              {savedPlayers.map(p => {
                const selected = selectedPlayers.includes(p.name)
                return (
                  <button key={p.id} type="button" onClick={() => togglePlayer(p.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors text-left ${
                      selected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      selected ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {p.avatar ? p.avatar : selected ? '✓' : p.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button onClick={handleWhoGoesFirst} disabled={spinning || selectedPlayers.length < 2}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-4 text-lg font-bold transition-colors">
          {spinning ? '🎰 Picking...' : 'Pick First Player!'}
        </button>

        {firstPlayer && !spinning && (
          <div className="text-center bg-emerald-50 border border-emerald-200 rounded-xl py-4">
            <div className="text-3xl mb-1">🥇</div>
            <div className="text-xl font-bold text-emerald-700">{firstPlayer}</div>
            <div className="text-sm text-slate-500">goes first!</div>
          </div>
        )}
      </div>

      {/* Round Tracker */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">🔄 Round Tracker</h2>

        {/* Player entry */}
        <div>
          <label className="text-sm text-slate-500 block mb-2">Players (in seat order)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={rtInput}
              onChange={e => setRtInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') rtAddPlayer() }}
              placeholder="Add player name..."
              className="flex-1 bg-slate-100 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            <button
              onClick={rtAddPlayer}
              disabled={!rtInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Add
            </button>
          </div>

          {/* Quick-add from roster */}
          {savedPlayers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {savedPlayers.filter(p => !rtPlayers.includes(p.name)).map(p => (
                <button
                  key={p.id}
                  onClick={() => setRtPlayers(prev => [...prev, p.name])}
                  className="text-xs bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 rounded-full transition-colors"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Player order list */}
        {rtPlayers.length > 0 && (
          <div className="space-y-1.5">
            {rtPlayers.map((name, i) => (
              <div key={name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                i === rtFirstIdx
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-sm font-bold w-5 shrink-0 text-center">
                  {i === rtFirstIdx ? '👑' : `${i + 1}`}
                </span>
                <span className="flex-1 font-medium text-sm">{name}</span>
                {i === rtFirstIdx && (
                  <span className="text-xs text-indigo-200 font-semibold">First Player</span>
                )}
                <button
                  onClick={() => rtRemovePlayer(name)}
                  className={`text-xs px-1.5 shrink-0 transition-colors ${i === rtFirstIdx ? 'text-indigo-300 hover:text-white' : 'text-slate-400 hover:text-red-400'}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Round display + controls */}
        {rtPlayers.length >= 2 && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Round</span>
              <span className="text-2xl font-bold text-indigo-600">{rtRound}</span>
            </div>

            {!rtActive ? (
              <button
                onClick={rtStart}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm transition-colors"
              >
                ▶ Start Tracking — opens in score sheet
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-sm text-emerald-700 font-semibold">Active — visible in score sheet</span>
                </div>
                <button
                  onClick={rtNextRound}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-sm transition-colors"
                >
                  Next Round → {rtPlayers[(rtFirstIdx + 1) % rtPlayers.length]} goes first
                </button>
              </>
            )}

            <button
              onClick={rtReset}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              Reset to Round 1
            </button>
          </div>
        )}

        {rtPlayers.length === 1 && (
          <p className="text-sm text-slate-400 text-center">Add at least 2 players to start tracking.</p>
        )}
      </div>

    </div>
  )
}
