'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',    icon: '🏠' },
  { href: '/sessions',  label: 'Matches', icon: '🃏' },
  { href: '/games',     label: 'Games',   icon: '🎲' },
  { href: '/players',   label: 'Players', icon: '👥' },
  { href: '/stats',     label: 'Stats',   icon: '📊' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 flex items-stretch justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(item => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 min-w-0 transition-colors ${
              active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
