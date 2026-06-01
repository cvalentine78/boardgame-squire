'use client'

import { useState, useRef, useCallback } from 'react'
import { AVATAR_CATEGORIES } from '@/lib/avatar-categories'

export default function AvatarPicker({ selected, onSelect }: {
  selected: string
  onSelect: (a: string) => void
}) {
  const [activeCat, setActiveCat] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  const emojis = AVATAR_CATEGORIES[activeCat].emojis

  const scroll = useCallback((dir: -1 | 1) => {
    tabsRef.current?.scrollBy({ left: dir * 120, behavior: 'smooth' })
  }, [])

  function handleWheel(e: React.WheelEvent) {
    if (tabsRef.current) {
      e.preventDefault()
      tabsRef.current.scrollLeft += e.deltaY + e.deltaX
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => scroll(-1)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm">
          ‹
        </button>
        <div ref={tabsRef} onWheel={handleWheel}
          className="flex gap-1.5 flex-1 pb-1"
          style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {AVATAR_CATEGORIES.map((cat, i) => (
            <button key={cat.label} type="button" onClick={() => setActiveCat(i)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0 transition-colors text-xs font-medium ${
                activeCat === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              <span className="text-lg leading-none">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => scroll(1)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors text-sm">
          ›
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2 p-1">
        {emojis.map(a => (
          <button key={a} type="button" onClick={() => onSelect(a)}
            className={`text-3xl rounded-xl p-2 transition-colors aspect-square flex items-center justify-center ${
              selected === a ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100'
            }`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
