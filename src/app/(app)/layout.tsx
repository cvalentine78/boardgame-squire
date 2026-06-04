'use client'

import NavBar from '@/components/NavBar'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Image src="/logo.jpg" alt="Boardgame Squire" width={80} height={80} className="rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-slate-900 border-b border-slate-700 flex justify-center">
        <NavBar />
      </div>
      <main className="flex-1 max-w-2xl md:max-w-5xl mx-auto w-full px-4 py-6 pb-28 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
