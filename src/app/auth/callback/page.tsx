'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    // supabase-js automatically detects the ?code= in the URL and exchanges
    // it for a session, storing it in localStorage
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-4xl animate-pulse">🎲</div>
    </div>
  )
}
