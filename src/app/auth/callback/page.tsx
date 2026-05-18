'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let redirected = false

    // supabase-js automatically detects the session from the URL hash or code
    // and fires an auth state change. We just wait for a session to appear.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !redirected) {
        redirected = true
        router.replace('/dashboard')
      }
    })

    // Fallback: if no session appears within 10s, go back to login
    const timeout = setTimeout(() => {
      if (!redirected) router.replace('/login')
    }, 10000)

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-4xl animate-pulse">🎲</div>
    </div>
  )
}
