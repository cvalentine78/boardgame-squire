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

const ACTIONS = [
  { href: '/sessions/new', label: 'New Match',    icon: '🃏', desc: 'Start a new game',        primary: true  },
  { href: '/sessions',     label: 'All Matches',  icon: '📋', desc: 'View match history'                      },
  { href: '/games',        label: 'Games',        icon: '🎲', desc: 'Browse your library'                     },
  { href: '/stats',        label: 'Stats',        icon: '📊', desc: 'Scores & leaderboard'                    },
  { href: '/tools',        label: 'Dice & Tools', icon: '🎯', desc: 'Dice roller & timers'                    },
  { href: '/players',      label: 'Players',      icon: '👥', desc: 'Manage your roster'                      },
  { href: '/party',        label: 'Party',        icon: '🎉', desc: 'Share with friends'                      },
  { href: '/whats-new',    label: "What's New",   icon: '📣', desc: 'Latest updates',          dark: true     },
]

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

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-6 py-8 md:py-10 shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-6 w-56 h-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-4xl mb-3">🎲</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Boardgame Squire</h1>
          <p className="text-indigo-200 mt-1 text-sm md:text-base">Your game night companion — track scores, stats, and wins.</p>
          {!loading && activeMatches.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-white text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {activeMatches.length} match{activeMatches.length !== 1 ? 'es' : ''} in progress
            </div>
          )}
        </div>
      </div>

      {/* Desktop: two-column — actions left, in-progress right */}
      <div className="md:flex md:gap-6 md:items-start">

        {/* Action grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACTIONS.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-xl p-4 md:p-5 text-center transition-all group hover:scale-[1.02] hover:shadow-lg ${
                  action.primary
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 shadow-md'
                    : action.dark
                      ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-slate-700'
                }`}
              >
                <div className="text-2xl md:text-3xl mb-1.5">{action.icon}</div>
                <div className={`font-semibold text-sm ${action.primary ? 'text-white' : action.dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {action.label}
                </div>
                <div className={`hidden md:block text-xs mt-1 ${action.primary ? 'text-indigo-200' : action.dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {action.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* In Progress — sidebar on desktop, stacked on mobile */}
        {!loading && activeMatches.length > 0 && (
          <div className="mt-6 md:mt-0 md:w-72 shrink-0 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              In Progress
            </h2>
            {activeMatches.map(session => (
              <Link key={session.id} href={`/sessions/${session.id}`}
                className="flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 rounded-2xl px-4 py-4 transition-colors shadow-lg group">
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{session.games?.name}</div>
                  <div className="text-xs text-indigo-200 font-mono mt-0.5">{session.join_code}</div>
                </div>
                <span className="text-sm font-bold text-white bg-white/20 px-3 py-1.5 rounded-xl shrink-0 ml-3 group-hover:bg-white/30 transition-colors">
                  Resume →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
