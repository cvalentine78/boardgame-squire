'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      router.replace('/login')
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      router.replace('/login')
      return
    }

    // Explicitly exchange the code for a session and store it in localStorage
    createClient().auth.exchangeCodeForSession(code).then(({ data, error: err }) => {
      if (err || !data.session) {
        router.replace('/login')
      } else {
        router.replace('/dashboard')
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-4xl animate-pulse">🎲</div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-4xl animate-pulse">🎲</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
