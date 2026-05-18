'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setErrorMsg(`OAuth error: ${error} — ${errorDescription ?? ''}`)
      return
    }

    const code = searchParams.get('code')
    if (!code) {
      setErrorMsg('No code in URL. Params: ' + window.location.search)
      return
    }

    createClient().auth.exchangeCodeForSession(code).then(({ data, error: err }) => {
      if (err) {
        setErrorMsg('Exchange failed: ' + err.message)
      } else if (!data.session) {
        setErrorMsg('No session returned after exchange.')
      } else {
        router.replace('/dashboard')
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-6 gap-4">
        <div className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-xl p-4 max-w-sm w-full">
          <p className="font-bold mb-1">Sign-in error</p>
          <p className="break-words">{errorMsg}</p>
        </div>
        <button
          onClick={() => router.replace('/login')}
          className="text-indigo-400 underline text-sm">
          Back to login
        </button>
      </div>
    )
  }

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
