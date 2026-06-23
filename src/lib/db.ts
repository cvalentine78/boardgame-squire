import { createClient } from '@/lib/supabase/client'

// Fresh client each call — reads session from localStorage on every use
function db() {
  return createClient()
}

// Games
export async function getGames() {
  const { data, error } = await db()
    .from('games')
    .select('id,name,min_players,max_players,scoring_categories,is_shared,created_by,thumbnail_url,image_url,bgg_id,bgg_rating,bgg_weight,bgg_rank,min_playtime,max_playtime,best_players')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function copyGame(gameId: string) {
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const userId = session?.user?.id ?? null
  if (!userId) throw new Error('Not signed in')

  const { data: original, error: fetchErr } = await client
    .from('games')
    .select('name,description,min_players,max_players,rules_pdf_url,scoring_categories,thumbnail_url,image_url,bgg_id,bgg_rating,bgg_weight,bgg_rank,min_playtime,max_playtime,best_players')
    .eq('id', gameId)
    .single()
  if (fetchErr || !original) throw new Error('Game not found')

  const { data, error } = await client
    .from('games')
    .insert({ ...original, created_by: userId, is_shared: false })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
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
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const userId = session?.user?.id ?? null
  const { data, error } = await client
    .from('games')
    .insert({ ...body, created_by: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function toggleGameShared(id: string, isShared: boolean) {
  const { error } = await db()
    .from('games')
    .update({ is_shared: isShared })
    .eq('id', id)
  if (error) throw new Error(error.message)
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
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const userId = session?.user?.id ?? null
  const { data, error } = await client
    .from('game_sessions')
    .insert({ ...body, user_id: userId })
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
  const client = db()
  // Delete related records first (foreign keys may not have CASCADE)
  await client.from('messages').delete().eq('session_id', id)
  await client.from('scores').delete().eq('session_id', id)
  await client.from('session_players').delete().eq('session_id', id)
  const { error } = await client.from('game_sessions').delete().eq('id', id)
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
    .range(0, 9999)
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
    .select('id,name,avatar')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function insertPlayer(name: string, avatar?: string | null) {
  const { data, error } = await db()
    .from('players')
    .insert({ name, avatar: avatar ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updatePlayerAvatar(id: string, avatar: string | null) {
  const { error } = await db()
    .from('players')
    .update({ avatar })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deletePlayer(id: string) {
  const { error } = await db()
    .from('players')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// Friends

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0 or I/1
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function getMyInviteCode(): Promise<string> {
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not signed in')

  const displayName = (user.user_metadata?.full_name as string) ?? user.email ?? 'Player'

  const { data: existing } = await client
    .from('invite_codes')
    .select('code')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Keep the same code but refresh display_name in case it changed
    await client.from('invite_codes').update({ display_name: displayName }).eq('user_id', user.id)
    return existing.code
  }

  const code = generateCode()
  await client.from('invite_codes').insert({ user_id: user.id, code, display_name: displayName })
  return code
}

export async function getFriends() {
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const user = session?.user
  if (!user) return []

  const { data, error } = await client
    .from('friends')
    .select('id, requester_id, addressee_id, requester_name, addressee_name, created_at')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('created_at')

  if (error) throw new Error(error.message)

  return (data ?? []).map(f => ({
    id: f.id,
    friendUserId: f.requester_id === user.id ? f.addressee_id : f.requester_id,
    friendName: f.requester_id === user.id ? f.addressee_name : f.requester_name,
    since: f.created_at as string,
  }))
}

export async function addFriendByCode(code: string): Promise<string> {
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not signed in')

  const { data: invite, error: findErr } = await client
    .from('invite_codes')
    .select('user_id, display_name')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (findErr || !invite) throw new Error('Code not found. Check the code and try again.')
  if (invite.user_id === user.id) throw new Error("That's your own code!")

  const myName = (user.user_metadata?.full_name as string) ?? user.email ?? 'Player'

  const { error } = await client.from('friends').insert({
    requester_id: user.id,
    addressee_id: invite.user_id,
    requester_name: myName,
    addressee_name: invite.display_name,
  })

  if (error) {
    if (error.code === '23505') throw new Error("You're already friends!")
    throw new Error(error.message)
  }

  return invite.display_name as string
}

export async function removeFriend(friendshipId: string) {
  const { error } = await db()
    .from('friends')
    .delete()
    .eq('id', friendshipId)
  if (error) throw new Error(error.message)
}

// Messages
export async function getMessages(sessionId: string) {
  const { data, error } = await db()
    .from('messages')
    .select('id,user_id,display_name,content,created_at')
    .eq('session_id', sessionId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function sendMessage(sessionId: string, content: string) {
  const client = db()
  const { data: { session } } = await client.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not signed in')
  const displayName = (user.user_metadata?.full_name as string) ?? user.email ?? 'Player'
  const { error } = await client
    .from('messages')
    .insert({ session_id: sessionId, user_id: user.id, display_name: displayName, content })
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
    .range(0, 9999)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getScoresForSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) return []
  const client = db()
  const PAGE = 1000
  const all: { player_name: string; points: number; session_id: string }[] = []
  let from = 0
  while (true) {
    const { data, error } = await client
      .from('scores')
      .select('player_name,points,session_id')
      .in('session_id', sessionIds)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

export async function insertScores(rows: object[]) {
  const { data, error } = await db()
    .from('scores')
    .insert(rows)
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertScore(row: {
  session_id: string; player_name: string; points: number; round: number
}) {
  const { error } = await db()
    .from('scores')
    .upsert(row, { onConflict: 'session_id,player_name,round' })
  if (error) throw new Error(error.message)
}

export async function deleteSingleScore(sessionId: string, playerName: string, round: number) {
  const { error } = await db()
    .from('scores')
    .delete()
    .eq('session_id', sessionId)
    .eq('player_name', playerName)
    .eq('round', round)
  if (error) throw new Error(error.message)
}

export async function deleteScores(sessionId: string) {
  const { error } = await db()
    .from('scores')
    .delete()
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}
