import { createClient } from '@/lib/supabase/client'

// Each call creates a client — cheap, just reads stored session from localStorage
function db() {
  return createClient()
}

// Games
export async function getGames() {
  const { data, error } = await db()
    .from('games')
    .select('id,name,min_players,max_players,scoring_categories')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getGame(id: string) {
  const { data, error } = await db()
    .from('games')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function insertGame(body: object) {
  const { data, error } = await db()
    .from('games')
    .insert(body)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateGame(id: string, body: object) {
  const { error } = await db()
    .from('games')
    .update(body)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteGame(id: string) {
  const { error } = await db()
    .from('games')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Sessions
export async function getSessions() {
  const { data, error } = await db()
    .from('game_sessions')
    .select('*,games(name),session_players(player_name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSession(id: string) {
  const { data, error } = await db()
    .from('game_sessions')
    .select('*,games(name,rules_pdf_url,scoring_categories)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function insertSession(body: object) {
  const { data, error } = await db()
    .from('game_sessions')
    .insert(body)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSession(id: string, body: object) {
  const { error } = await db()
    .from('game_sessions')
    .update(body)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSession(id: string) {
  const { error } = await db()
    .from('game_sessions')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Session players
export async function getSessionPlayers(sessionId: string) {
  const { data, error } = await db()
    .from('session_players')
    .select('id,player_name,is_winner')
    .eq('session_id', sessionId)
    .order('turn_order')
  if (error) throw new Error(error.message)
  return data ?? []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAllSessionPlayers(): Promise<any[]> {
  const { data, error } = await db()
    .from('session_players')
    .select('player_name,session_id,game_sessions(id,status,winner_name,games(name))')
  if (error) throw new Error(error.message)
  return (data ?? []) as any[]
}

export async function insertPlayers(rows: object[]) {
  const { data, error } = await db()
    .from('session_players')
    .insert(rows)
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function updatePlayerWinner(sessionId: string, playerName: string) {
  const { error } = await db()
    .from('session_players')
    .update({ is_winner: true })
    .eq('session_id', sessionId)
    .eq('player_name', playerName)
  if (error) throw new Error(error.message)
}

// Players roster
export async function getPlayers() {
  const { data, error } = await db()
    .from('players')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertPlayer(name: string) {
  const { data, error } = await db()
    .from('players')
    .insert({ name })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePlayer(id: string) {
  const { error } = await db()
    .from('players')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Scores
export async function getScores(sessionId: string) {
  const { data, error } = await db()
    .from('scores')
    .select('player_name,points,round')
    .eq('session_id', sessionId)
    .order('round')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAllScores() {
  const { data, error } = await db()
    .from('scores')
    .select('player_name,points,session_id')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertScores(rows: object[]) {
  const { data, error } = await db()
    .from('scores')
    .insert(rows)
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteScores(sessionId: string) {
  const { error } = await db()
    .from('scores')
    .delete()
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}
