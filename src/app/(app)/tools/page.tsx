'use client'

import { useState, useEffect } from 'react'
import { getPlayers } from '@/lib/db'

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

  // Non-d6: styled number card with die label
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

  const [savedPlayers, setSavedPlayers] = useState<{ id: string; name: string }[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [firstPlayer, setFirstPlayer] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    getPlayers().then(data => {
      if (Array.isArray(data)) setSavedPlayers(data)
    })
  }, [])

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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      selected ? 'bg-white/20 text-white' : 'bg-white text-indigo-600'
                    }`}>
                      {selected ? '✓' : p.name.slice(0, 1).toUpperCase()}
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
    </div>
  )
}
