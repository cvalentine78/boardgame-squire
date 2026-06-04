'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let redirected = false

    async function handleCallback() {
      const code = new URL(window.location.href).searchParams.get('code')

      if (code) {
        // PKCE flow (common on mobile) — must exchange code explicitly
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
        return
      }

      // Implicit flow — Supabase processes the hash fragment asynchronously;
      // wait for the auth state change rather than calling getSession() immediately
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session && !redirected) {
          redirected = true
          router.replace('/dashboard')
        }
      })

      const timeout = setTimeout(() => {
        if (!redirected) router.replace('/login')
      }, 10000)

      return () => {
        clearTimeout(timeout)
        subscription.unsubscribe()
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Image src="/logo.jpg" alt="Boardgame Squire" width={80} height={80} className="rounded-2xl animate-pulse" />
    </div>
  )
}
