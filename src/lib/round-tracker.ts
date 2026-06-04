export type RoundTrackerState = {
  players: string[]
  round: number
  firstIdx: number
  active: boolean
}

const KEY = 'bgs_round_tracker'

export function getRoundTracker(): RoundTrackerState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RoundTrackerState) : null
  } catch {
    return null
  }
}

export function setRoundTracker(state: RoundTrackerState) {
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new Event('round-tracker-updated'))
}

export function clearRoundTracker() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('round-tracker-updated'))
}

export function advanceRound(state: RoundTrackerState): RoundTrackerState {
  return {
    ...state,
    round: state.round + 1,
    firstIdx: (state.firstIdx + 1) % state.players.length,
  }
}
