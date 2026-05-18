'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JoinSessionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: session, error: err } = await supabase
        .from('game_sessions')
        .select('id, status')
        .eq('join_code', code.toUpperCase().trim())
        .single()

      if (err || !session) throw new Error('Session not found. Check the code and try again.')
      if (session.status === 'completed') throw new Error('This session has already ended.')

      router.push(`/sessions/${session.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">←</button>
        <h1 className="text-2xl font-bold">Join Session</h1>
      </div>

      <form onSubmit={handleJoin} className="bg-gray-900 rounded-2xl p-5 space-y-4">
        <p className="text-gray-400 text-sm">Enter the 5-letter code from the session host.</p>
        {error && <p className="text-red-400 text-sm bg-red-950 rounded-lg p-3">⚠️ {error}</p>}
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={5}
          required
          className="w-full bg-gray-800 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
          placeholder="ABCDE"
        />
        <button
          type="submit"
          disabled={loading || code.length < 4}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl py-4 font-bold text-lg transition-colors"
        >
          {loading ? 'Finding...' : 'Join Session'}
        </button>
      </form>
    </div>
  )
}
