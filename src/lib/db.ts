const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function get(table: string, params = '') {
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, { headers })
  return res.json()
}

async function post(table: string, body: object) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function patch(table: string, params: string, body: object) {
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH', headers, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function del(table: string, params: string) {
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    method: 'DELETE', headers,
  })
  if (!res.ok) throw new Error(await res.text())
}

// Games
export const getGames = () =>
  get('games', 'select=id,name,min_players,max_players,scoring_categories&order=name')

export const getGame = (id: string) =>
  get('games', `select=*&id=eq.${id}`).then((d: unknown[]) => d[0])

export const insertGame = (data: object) => post('games', data)

export const updateGame = (id: string, data: object) =>
  patch('games', `id=eq.${id}`, data)

export const deleteGame = (id: string) =>
  del('games', `id=eq.${id}`)

// Sessions
export const getSessions = () =>
  get('game_sessions', 'select=*,games(name),session_players(player_name)&order=created_at.desc')

export const getSession = (id: string) =>
  get('game_sessions', `select=*,games(name,rules_pdf_url,scoring_categories)&id=eq.${id}&order=created_at.desc`).then((d: unknown[]) => d[0])

export const insertSession = (data: object) =>
  post('game_sessions', data).then((d: unknown[]) => d[0])

export const updateSession = (id: string, data: object) =>
  patch('game_sessions', `id=eq.${id}`, data)

export const deleteSession = (id: string) =>
  del('game_sessions', `id=eq.${id}`)

// Players
export const getSessionPlayers = (sessionId: string) =>
  get('session_players', `select=id,player_name,is_winner&session_id=eq.${sessionId}&order=turn_order`)

export const getAllSessionPlayers = () =>
  get('session_players', 'select=player_name,session_id,game_sessions(id,status,winner_name,games(name))')

export const insertPlayers = (rows: object[]) => post('session_players', rows)

export const updatePlayerWinner = (sessionId: string, playerName: string) =>
  patch('session_players', `session_id=eq.${sessionId}&player_name=eq.${encodeURIComponent(playerName)}`, { is_winner: true })

// Players
export const getPlayers = () =>
  get('players', 'select=*&order=name')

export const insertPlayer = (name: string) =>
  post('players', { name })

export const deletePlayer = (id: string) =>
  del('players', `id=eq.${id}`)

// Scores
export const getScores = (sessionId: string) =>
  get('scores', `select=player_name,points,round&session_id=eq.${sessionId}&order=round`)

export const getAllScores = () =>
  get('scores', 'select=player_name,points,session_id')

export const insertScores = (rows: object[]) => post('scores', rows)

export const deleteScores = (sessionId: string) =>
  del('scores', `session_id=eq.${sessionId}`)
