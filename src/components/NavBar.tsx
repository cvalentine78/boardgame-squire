'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === '/dashboard'
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
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

      <button
        onClick={handleSignOut}
        className="text-xs text-slate-400 hover:text-white transition-colors w-16 text-right"
      >
        Sign out
      </button>
    </header>
  )
}
