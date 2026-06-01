'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { insertGame } from '@/lib/db'
import { suggestCategories } from '@/lib/bgg-categories'

type BggResult = { id: string; name: string; year: string }

export default function NewGamePage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)

  // BGG search state
  const [bggQuery, setBggQuery] = useState('')
  const [bggResults, setBggResults] = useState<BggResult[]>([])
  const [bggSearching, setBggSearching] = useState(false)
  const [bggLoadingGame, setBggLoadingGame] = useState(false)
  const [bggThumbnail, setBggThumbnail] = useState<string | null>(null)
  const [bggId, setBggId] = useState<string | null>(null)
  const bggTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 1 — game info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minPlayers, setMinPlayers] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  // Step 2 — score sheet
  const [categories, setCategories] = useState<string[]>([])
  const [suggestedCats, setSuggestedCats] = useState<string[]>([])
  const [previousCats, setPreviousCats] = useState<string[] | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function onBggInput(q: string) {
    setBggQuery(q)
    setBggResults([])
    if (bggTimer.current) clearTimeout(bggTimer.current)
    if (!q.trim()) return
    bggTimer.current = setTimeout(async () => {
      setBggSearching(true)
      try {
        const res = await fetch(`/api/bgg?query=${encodeURIComponent(q)}`)
        const data = await res.json()
        setBggResults(data.results ?? [])
      } catch { /* ignore */ }
      setBggSearching(false)
    }, 500)
  }

  async function selectBggGame(id: string, gameName: string) {
    setBggResults([])
    setBggQuery('')
    setBggLoadingGame(true)
    setBggId(id)
    try {
      const res = await fetch(`/api/bgg/game?id=${id}`)
      const data = await res.json()
      if (data) {
        setName(data.name || gameName)
        setDescription(data.description || '')
        setMinPlayers(data.minPlayers || '')
        setMaxPlayers(data.maxPlayers || '')
        setBggThumbnail(data.thumbnail || null)
        // Auto-suggest score categories from BGG mechanics
        if (data.mechanics?.length) {
          const suggested = suggestCategories(data.mechanics)
          setSuggestedCats(suggested)
          setPreviousCats(categories) // save current for undo
          setCategories(suggested)
        }
      }
    } catch { /* ignore */ }
    setBggLoadingGame(false)
  }

  function addCategory() {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    setCategories(prev => [...prev, trimmed])
    setNewCategory('')
  }

  function removeCategory(i: number) {
    setCategories(prev => prev.filter((_, idx) => idx !== i))
  }

  function startEditing(i: number) {
    setEditingIndex(i)
    setEditingValue(categories[i])
  }

  function commitEdit() {
    if (editingIndex === null) return
    const trimmed = editingValue.trim()
    if (trimmed) setCategories(prev => prev.map((c, i) => i === editingIndex ? trimmed : c))
    setEditingIndex(null)
    setEditingValue('')
  }

  function moveCategory(i: number, dir: -1 | 1) {
    const next = [...categories]
    const swap = i + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[i], next[swap]] = [next[swap], next[i]]
    setCategories(next)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      let pdfUrl = null
      if (pdfFile) {
        const ext = pdfFile.name.split('.').pop()
        const path = `games/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('rules-pdfs').upload(path, pdfFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('rules-pdfs').getPublicUrl(path)
        pdfUrl = publicUrl
      }
      await insertGame({
        name,
        description: description || null,
        min_players: minPlayers ? parseInt(minPlayers) : null,
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        rules_pdf_url: pdfUrl,
        scoring_categories: categories,
        thumbnail_url: bggThumbnail || null,
        bgg_id: bggId || null,
      })
      router.push('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const previewPlayers = ['P1', 'P2', 'P3']

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="text-slate-400 hover:text-white">←</button>
        <div>
          <h1 className="text-2xl font-bold text-white">Add Game</h1>
          <p className="text-xs text-slate-400">Step {step} of 2</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
      </div>

      {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-800 rounded-lg p-3">⚠️ {error}</p>}

      {step === 1 && (
        <div className="space-y-5">

          {/* BGG Search */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Search BoardGameGeek</h2>
                <p className="text-xs text-slate-400 mt-0.5">Find your game to auto-fill the details</p>
              </div>
              <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-600 text-white tracking-wide">BGG</span>
              </a>
            </div>
            <div className="relative">
              <input type="text" value={bggQuery} onChange={e => onBggInput(e.target.value)}
                placeholder="Type a game name…"
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400" />
              {bggSearching && <span className="absolute right-3 top-3.5 text-slate-400 text-xs">Searching…</span>}
            </div>
            {bggResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {bggResults.map(r => (
                  <button key={r.id} type="button" onClick={() => selectBggGame(r.id, r.name)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between">
                    <span className="font-medium text-slate-800">{r.name}</span>
                    {r.year && <span className="text-slate-400 text-sm shrink-0 ml-2">{r.year}</span>}
                  </button>
                ))}
              </div>
            )}
            {bggLoadingGame && <p className="text-sm text-indigo-500 text-center py-1">Loading game details…</p>}
            {bggThumbnail && !bggLoadingGame && (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <img src={bggThumbnail} alt="" className="w-14 h-14 object-contain rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">Details loaded — review and edit below.</p>
                  {bggId && (
                    <a href={`https://boardgamegeek.com/boardgame/${bggId}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-500 hover:text-indigo-700 underline mt-0.5 inline-block">
                      View on BGG (rules &amp; files) ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Game details */}
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">Game Details</h2>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Game Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                placeholder="Azul, Catan, Ticket to Ride…" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Description <span className="text-slate-400">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-slate-400"
                placeholder="Notes about the game…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Min Players</label>
                <input type="number" value={minPlayers} onChange={e => setMinPlayers(e.target.value)} min={1}
                  className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                  placeholder="2" />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Max Players</label>
                <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} min={1}
                  className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                  placeholder="6" />
              </div>
            </div>
          </div>

          {/* PDF upload */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">Rules PDF <span className="text-slate-400 normal-case">(optional)</span></h2>
            <label className="block cursor-pointer">
              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${pdfFile ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-300 hover:border-slate-400'}`}>
                {pdfFile ? (
                  <div>
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-sm font-medium text-indigo-300">{pdfFile.name}</p>
                    <p className="text-xs text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl mb-1">📤</div>
                    <p className="text-sm text-slate-500">Tap to upload a rules PDF</p>
                  </div>
                )}
              </div>
              <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
            {pdfFile && (
              <button type="button" onClick={() => setPdfFile(null)} className="text-sm text-red-500 hover:text-red-700">Remove file</button>
            )}
          </div>

          <button
            onClick={() => { if (!name.trim()) { setError('Please enter a game name.'); return }; setError(''); setStep(2) }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 font-bold text-lg transition-colors">
            Next: Build Score Sheet →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Score Sheet for {name}</h2>
              <p className="text-sm text-slate-500 mt-1">Add each scoring category. These become the rows on the score sheet during every match.</p>
            </div>
            {previousCats !== null && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 font-medium">BGG suggestions applied.</p>
                <button
                  type="button"
                  onClick={() => { setCategories(previousCats); setPreviousCats(null) }}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ↩ Undo
                </button>
              </div>
            )}

            {suggestedCats.length > 0 && (
              <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5">
                <span className="text-indigo-400 text-sm shrink-0 mt-0.5">🎲</span>
                <p className="text-xs text-indigo-600">
                  <span className="font-semibold">Score sheet auto-filled from BGG mechanics.</span>{' '}
                  Edit, reorder, or add rows below to match your copy of the game.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
                placeholder="e.g. Wall Tiles, Floor Penalty, Bonus…"
                className="flex-1 bg-slate-100 text-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400" />
              <button type="button" onClick={addCategory}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-lg font-semibold transition-colors">Add</button>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2.5">
                    <span className="text-slate-400 text-xs w-5 text-right shrink-0">{i + 1}</span>
                    {editingIndex === i ? (
                      <input autoFocus type="text" value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIndex(null) }}
                        className="flex-1 text-sm font-medium bg-white rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" />
                    ) : (
                      <button type="button" onClick={() => startEditing(i)}
                        className="flex-1 text-sm font-medium text-left hover:text-indigo-600 transition-colors">{cat}</button>
                    )}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveCategory(i, -1)} disabled={i === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs">▲</button>
                      <button type="button" onClick={() => moveCategory(i, 1)} disabled={i === categories.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 text-xs">▼</button>
                      <button type="button" onClick={() => removeCategory(i)}
                        className="p-1 text-slate-400 hover:text-red-500 text-lg leading-none ml-1">×</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                No categories yet — add your first one above,<br />or skip to use a simple round-by-round grid.
              </div>
            )}
          </div>

          {categories.length > 0 && (
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Score Sheet Preview</h3>
              <div className="bg-slate-50 rounded-xl overflow-hidden text-xs border border-slate-200">
                <div className="flex border-b border-slate-200">
                  <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 text-slate-400">Category</div>
                  {previewPlayers.map(p => <div key={p} className="flex-1 text-center py-2 border-l border-slate-200 font-bold text-slate-500">{p}</div>)}
                </div>
                {categories.map((cat, i) => (
                  <div key={i} className="flex border-b border-slate-200 last:border-b-0">
                    <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 text-slate-500 leading-tight">{cat}</div>
                    {previewPlayers.map(p => <div key={p} className="flex-1 text-center py-2 border-l border-slate-200 text-gray-700">—</div>)}
                  </div>
                ))}
                <div className="flex border-t-2 border-slate-300 bg-white">
                  <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 font-bold text-slate-400">Total</div>
                  {previewPlayers.map(p => <div key={p} className="flex-1 text-center py-2 border-l border-slate-300 font-bold text-slate-400">0</div>)}
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl py-4 font-bold text-lg transition-colors text-white">
            {saving ? 'Saving…' : '✓ Save Game'}
          </button>

          <p className="text-center text-xs text-slate-400">
            {categories.length === 0
              ? 'Saving without categories — matches will use a round-by-round grid instead.'
              : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} will be used on every score sheet for ${name}.`}
          </p>
        </div>
      )}
    </div>
  )
}
