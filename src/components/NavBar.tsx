'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/sessions',  label: 'Matches' },
  { href: '/games',     label: 'Games' },
  { href: '/players',   label: 'Players' },
  { href: '/stats',     label: 'Stats' },
  { href: '/friends',   label: 'Friends' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
      {/* Brand */}
      <span className="font-bold text-lg text-white shrink-0">🎲 Boardgame Squire</span>

      {/* Desktop nav links — hidden on mobile (bottom nav handles it there) */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map(item => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="text-xs text-slate-400 hover:text-white transition-colors shrink-0"
      >
        Sign out
      </button>
    </header>
  )
}
