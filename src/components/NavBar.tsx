'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const isHome = pathname === '/dashboard'

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
      {/* Home button — hidden on dashboard itself */}
      {!isHome ? (
        <Link href="/dashboard"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </Link>
      ) : (
        <div className="w-16" />
      )}

      <span className="font-bold text-lg text-white">🎲 Boardgame Squire</span>

      {/* Spacer to keep title centered */}
      <div className="w-16" />
    </header>
  )
}
