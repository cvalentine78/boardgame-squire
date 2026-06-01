'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getGame, updateGame } from '@/lib/db'
import { suggestCategories } from '@/lib/bgg-categories'

type BggResult = { id: string; name: string; year: string }

type Game = {
  id: string
  name: string
  description: string | null
  min_players: number | null
  max_players: number | null
  rules_pdf_url: string | null
  scoring_categories: string[] | null
}

export default function EditGamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<1 | 2>(searchParams.get('step') === '2' ? 2 : 1)

  // Step 1 fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minPlayers, setMinPlayers] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [removePdf, setRemovePdf] = useState(false)

  // Step 2 fields
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // BGG search
  const [bggQuery, setBggQuery] = useState('')
  const [bggResults, setBggResults] = useState<BggResult[]>([])
  const [bggSearching, setBggSearching] = useState(false)
  const [bggLoadingGame, setBggLoadingGame] = useState(false)
  const [bggThumbnail, setBggThumbnail] = useState<string | null>(null)
  const [bggApplied, setBggApplied] = useState(false)
  const [bggId, setBggId] = useState<string | null>(null)
  const [bggRating, setBggRating] = useState<number | null>(null)
  const [bggWeight, setBggWeight] = useState<number | null>(null)
  const [suggestedCats, setSuggestedCats] = useState<string[]>([])
  const [previousCats, setPreviousCats] = useState<string[] | null>(null)
  const bggTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getGame(id).then((game) => {
      if (game) {
        setName(game.name)
        setDescription(game.description ?? '')
        setMinPlayers(game.min_players ? String(game.min_players) : '')
        setMaxPlayers(game.max_players ? String(game.max_players) : '')
        setExistingPdfUrl(game.rules_pdf_url)
        setCategories(game.scoring_categories ?? [])
      }
      setLoading(false)
    })
  }, [id])

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

  async function selectBggGame(selectedBggId: string, gameName: string) {
    setBggResults([])
    setBggQuery('')
    setBggLoadingGame(true)
    setBggId(selectedBggId)
    try {
      const res = await fetch(`/api/bgg/game?id=${selectedBggId}`)
      const data = await res.json()
      if (data) {
        setName(data.name || gameName)
        setDescription(data.description || '')
        setMinPlayers(data.minPlayers || '')
        setMaxPlayers(data.maxPlayers || '')
        setBggThumbnail(data.thumbnail || null)
        setBggRating(data.rating ?? null)
        setBggWeight(data.weight ?? null)
        setBggApplied(true)
        // Suggest categories from mechanics (don't auto-replace existing ones)
        if (data.mechanics?.length) {
          const suggested = suggestCategories(data.mechanics)
          setSuggestedCats(suggested)
        }
      }
    } catch { /* ignore */ }
    setBggLoadingGame(false)
  }

  function applySuggestedCategories() {
    setPreviousCats(categories) // save for undo
    setCategories(suggestedCats)
    setSuggestedCats([])
  }

  function undoApply() {
    if (previousCats !== null) {
      setCategories(previousCats)
      setPreviousCats(null)
    }
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
    if (trimmed) {
      setCategories(prev => prev.map((c, i) => i === editingIndex ? trimmed : c))
    }
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
    if (!name.trim()) { setError('Game name is required.'); return }
    setSaving(true)
    setError('')
    try {
      let pdfUrl = removePdf ? null : existingPdfUrl

      if (pdfFile) {
        const ext = pdfFile.name.split('.').pop()
        const path = `games/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('rules-pdfs')
          .upload(path, pdfFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('rules-pdfs')
          .getPublicUrl(path)
        pdfUrl = publicUrl
      }

      await updateGame(id, {
        name: name.trim(),
        description: description.trim() || null,
        min_players: minPlayers ? parseInt(minPlayers) : null,
        max_players: maxPlayers ? parseInt(maxPlayers) : null,
        rules_pdf_url: pdfUrl,
        scoring_categories: categories,
        ...(bggThumbnail ? { thumbnail_url: bggThumbnail } : {}),
        ...(bggId ? { bgg_id: bggId } : {}),
        ...(bggRating !== null ? { bgg_rating: bggRating } : {}),
        ...(bggWeight !== null ? { bgg_weight: bggWeight } : {}),
      })
      router.push('/games')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const previewPlayers = ['P1', 'P2', 'P3']

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => step === 2 ? setStep(1) : router.back()}
          className="text-slate-400 hover:text-white">←</button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Game</h1>
          <p className="text-xs text-slate-400">Step {step} of 2</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
        <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">⚠️ {error}</p>}

      {/* ── Step 1: Game Info ── */}
      {step === 1 && (
        <div className="space-y-5">

          {/* BGG Search */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Update from BoardGameGeek</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pull in fresh details or a new score sheet suggestion</p>
              </div>
              <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-600 text-white tracking-wide">BGG</span>
              </a>
            </div>
            <div className="relative">
              <input type="text" value={bggQuery} onChange={e => onBggInput(e.target.value)}
                placeholder="Search for this game on BGG…"
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400" />
              {bggSearching && <span className="absolute right-3 top-3.5 text-slate-400 text-xs">Searching…</span>}
            </div>
            {bggResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
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
            {bggApplied && !bggLoadingGame && (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                {bggThumbnail && <img src={bggThumbnail} alt="" className="w-12 h-12 object-contain rounded-lg shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium">Details updated from BGG ✓</p>
                  {suggestedCats.length > 0 && (
                    <p className="text-xs text-indigo-500 mt-0.5">Score sheet suggestions ready — choose on next step</p>
                  )}
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

          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Game Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Description <span className="text-slate-400">(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-slate-400"
                placeholder="Notes about the game..." />
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

          {/* Rules PDF */}
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold text-sm text-slate-500 uppercase tracking-wide">
              Rules PDF <span className="text-slate-400 normal-case">(optional)</span>
            </h2>

            {/* Existing PDF — not removed, no new file chosen */}
            {existingPdfUrl && !removePdf && !pdfFile && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-700">Rules PDF uploaded</p>
                  <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline">View current PDF</a>
                </div>
                <button type="button" onClick={() => setRemovePdf(true)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0">
                  Remove
                </button>
              </div>
            )}

            {/* Removed confirmation */}
            {removePdf && !pdfFile && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <span className="text-sm text-red-600 flex-1">PDF will be removed on save.</span>
                <button type="button" onClick={() => setRemovePdf(false)}
                  className="text-xs text-slate-600 hover:text-slate-800 font-medium">
                  Undo
                </button>
              </div>
            )}

            {/* Upload dropzone — show when no existing PDF, or replacing */}
            {(!existingPdfUrl || removePdf || pdfFile) && (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                  pdfFile ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-300 hover:border-slate-400'
                }`}>
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
                <input type="file" accept=".pdf"
                  onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                  className="hidden" />
              </label>
            )}

            {/* Replace existing — show when PDF exists and not being removed */}
            {existingPdfUrl && !removePdf && !pdfFile && (
              <label className="block cursor-pointer">
                <div className="border border-slate-200 rounded-xl px-4 py-2.5 text-center hover:bg-slate-50 transition-colors">
                  <p className="text-sm text-slate-500">📤 Replace with a new PDF</p>
                </div>
                <input type="file" accept=".pdf"
                  onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                  className="hidden" />
              </label>
            )}

            {pdfFile && (
              <button type="button" onClick={() => setPdfFile(null)}
                className="text-sm text-red-500 hover:text-red-700">
                Remove new file
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-lg transition-colors">
              {saving ? 'Saving…' : '✓ Save Game'}
            </button>
            <button
              onClick={() => { if (!name.trim()) { setError('Please enter a game name.'); return }; setError(''); setStep(2) }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 font-bold text-lg transition-colors">
              Score Sheet →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Score Sheet ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Score Sheet for {name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                These rows appear on every score sheet for this game. Changes apply to future matches.
              </p>
            </div>

            {/* Undo banner — shown after applying suggestions */}
            {previousCats !== null && suggestedCats.length === 0 && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-700 font-medium">BGG suggestions applied.</p>
                <button
                  type="button"
                  onClick={undoApply}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ↩ Undo
                </button>
              </div>
            )}

            {/* BGG suggested categories */}
            {suggestedCats.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-indigo-700">🎲 BGG suggested score sheet ({suggestedCats.length} rows):</p>
                <p className="text-xs text-indigo-600">{suggestedCats.join(' · ')}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={applySuggestedCategories}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                    Apply (replaces current)
                  </button>
                  <button type="button" onClick={() => {
                    setPreviousCats(categories)
                    setCategories(prev => {
                      const existing = new Set(prev)
                      return [...prev, ...suggestedCats.filter(c => !existing.has(c))]
                    })
                    setSuggestedCats([])
                  }}
                    className="flex-1 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 rounded-lg py-2 text-sm font-semibold transition-colors">
                    Add to existing
                  </button>
                  <button type="button" onClick={() => setSuggestedCats([])}
                    className="px-3 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
                placeholder="Add a scoring category..."
                className="flex-1 bg-slate-100 text-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
              <button type="button" onClick={addCategory}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-lg font-semibold transition-colors">
                Add
              </button>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2.5">
                    <span className="text-slate-400 text-xs w-5 text-right shrink-0">{i + 1}</span>
                    {editingIndex === i ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIndex(null) }}
                        className="flex-1 text-sm font-medium bg-white rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(i)}
                        className="flex-1 text-sm font-medium text-left hover:text-indigo-600 transition-colors">
                        {cat}
                      </button>
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
                No categories — matches will use a round-by-round grid.
              </div>
            )}
          </div>

          {/* Live preview */}
          {categories.length > 0 && (
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Score Sheet Preview</h3>
              <div className="bg-slate-50 rounded-xl overflow-hidden text-xs border border-slate-200">
                <div className="flex border-b border-slate-200">
                  <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 text-slate-400">Category</div>
                  {previewPlayers.map(p => (
                    <div key={p} className="flex-1 text-center py-2 border-l border-slate-200 font-bold text-slate-500">{p}</div>
                  ))}
                </div>
                {categories.map((cat, i) => (
                  <div key={i} className="flex border-b border-slate-200 last:border-b-0">
                    <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 text-slate-500 leading-tight">{cat}</div>
                    {previewPlayers.map(p => (
                      <div key={p} className="flex-1 text-center py-2 border-l border-slate-200 text-gray-700">—</div>
                    ))}
                  </div>
                ))}
                <div className="flex border-t-2 border-slate-300 bg-white">
                  <div className="w-24 shrink-0 border-r border-slate-200 py-2 px-2 font-bold text-slate-400">Total</div>
                  {previewPlayers.map(p => (
                    <div key={p} className="flex-1 text-center py-2 border-l border-slate-300 font-bold text-slate-400">0</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-lg transition-colors">
            {saving ? 'Saving...' : '✓ Save Changes'}
          </button>

          <p className="text-center text-xs text-slate-400">
            {categories.length === 0
              ? 'No categories — matches will use a round-by-round grid.'
              : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} on every score sheet for ${name}.`}
          </p>
        </div>
      )}
    </div>
  )
}
