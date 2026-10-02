import { getCase } from './generator'
import { sameSolution, scoreAccusation } from './solver'
import { DIFFICULTY, sameLead, type CaseFile, type Clue, type Difficulty, type Lead, type Solution } from './types'

export interface Player {
  id: string
  name: string
}

export interface RevealedClue {
  clueId: string
  byPlayerId: string
}

export interface Proposal {
  byPlayerId: string
  solution: Solution
  agreed: string[]
}

export interface Verdict {
  guess: Solution
  actual: Solution
  hits: number
  solved: boolean
  actionsLeft: number
  /** How many accusations were thrown out before this one. */
  thrownOut: number
  score: number
}

export interface GameState {
  phase: 'lobby' | 'investigating' | 'verdict'
  seed: string
  difficulty: Difficulty
  players: Player[]
  actionsLeft: number
  turnIndex: number
  revealed: RevealedClue[]
  proposal: Proposal | null
  /**
   * Accusations the case collapsed under. Each one costs a lead and the case
   * stays open — but they are never told which of the three was wrong, or the
   * count alone would do their deducing for them.
   */
  thrownOut: Solution[]
  verdict: Verdict | null
}

export type GameEvent =
  | { t: 'join'; playerId: string; name: string }
  | { t: 'rename'; playerId: string; name: string }
  | { t: 'setDifficulty'; difficulty: Difficulty }
  | { t: 'start'; seed: string }
  | { t: 'investigate'; playerId: string; lead: Lead }
  | { t: 'propose'; playerId: string; solution: Solution }
  | { t: 'withdraw'; playerId: string }
  | { t: 'agree'; playerId: string }
  | { t: 'returnToLobby' }

export function initialState(): GameState {
  return {
    phase: 'lobby',
    seed: '',
    difficulty: 'detective',
    players: [],
    actionsLeft: 0,
    turnIndex: 0,
    revealed: [],
    proposal: null,
    thrownOut: [],
    verdict: null,
  }
}

/**
 * Pure fold over the shared event log. Every client applies the same events in
 * the same order and lands on the same state, so nothing but events is synced.
 */
export function reduce(state: GameState, e: GameEvent): GameState {
  switch (e.t) {
    case 'join': {
      if (state.players.some((p) => p.id === e.playerId)) return state
      return { ...state, players: [...state.players, { id: e.playerId, name: e.name }] }
    }
    case 'rename':
      return {
        ...state,
        players: state.players.map((p) => (p.id === e.playerId ? { ...p, name: e.name } : p)),
      }
    case 'setDifficulty':
      return state.phase === 'lobby' ? { ...state, difficulty: e.difficulty } : state
    case 'start':
      if (state.players.length === 0) return state
      return {
        ...state,
        phase: 'investigating',
        seed: e.seed,
        actionsLeft: DIFFICULTY[state.difficulty].actions,
        turnIndex: 0,
        revealed: [],
        proposal: null,
        thrownOut: [],
        verdict: null,
      }
    case 'investigate': {
      if (state.phase !== 'investigating' || state.actionsLeft <= 0) return state
      if (state.players[state.turnIndex]?.id !== e.playerId) return state
      const clue = findLeadClue(getCase(state.seed), state, e.lead)
      if (!clue) return state
      return {
        ...state,
        actionsLeft: state.actionsLeft - 1,
        turnIndex: (state.turnIndex + 1) % state.players.length,
        revealed: [...state.revealed, { clueId: clue.id, byPlayerId: e.playerId }],
      }
    }
    case 'propose': {
      if (state.phase !== 'investigating') return state
      if (alreadyThrownOut(state, e.solution)) return state
      // Playing solo, there is nobody to sign off — the accusation stands.
      if (state.players.length <= 1) return settle(state, e.solution)
      return { ...state, proposal: { byPlayerId: e.playerId, solution: e.solution, agreed: [e.playerId] } }
    }
    case 'withdraw':
      return state.phase === 'investigating' ? { ...state, proposal: null } : state
    case 'agree': {
      if (state.phase !== 'investigating' || !state.proposal) return state
      const agreed = state.proposal.agreed.includes(e.playerId)
        ? state.proposal.agreed
        : [...state.proposal.agreed, e.playerId]
      if (agreed.length < state.players.length) {
        return { ...state, proposal: { ...state.proposal, agreed } }
      }
      return settle(state, state.proposal.solution)
    }
    case 'returnToLobby':
      return { ...initialState(), players: state.players, difficulty: state.difficulty }
  }
}

export function fold(events: GameEvent[]): GameState {
  return events.reduce(reduce, initialState())
}

/**
 * Resolve a signed-off accusation. Right, and the case closes. Wrong, and it
 * costs a lead and stays open — you keep investigating until the leads run out,
 * which is the last accusation you get.
 */
function settle(state: GameState, guess: Solution): GameState {
  const actual = getCase(state.seed).solution
  if (sameSolution(guess, actual)) {
    return { ...state, phase: 'verdict', proposal: null, verdict: buildVerdict(state, guess) }
  }
  const thrownOut = [...state.thrownOut, guess]
  if (state.actionsLeft <= 1) {
    return { ...state, phase: 'verdict', proposal: null, thrownOut, actionsLeft: 0, verdict: buildVerdict({ ...state, thrownOut, actionsLeft: 0 }, guess) }
  }
  return { ...state, proposal: null, thrownOut, actionsLeft: state.actionsLeft - 1 }
}

export function alreadyThrownOut(state: GameState, s: Solution): boolean {
  return state.thrownOut.some((t) => sameSolution(t, s))
}

function buildVerdict(state: GameState, guess: Solution): Verdict {
  const actual = getCase(state.seed).solution
  const hits = scoreAccusation(guess, actual)
  const solved = hits === 3
  // Each collapsed accusation costs, so a scattergun run of guesses scores
  // worse than one you talked yourselves into.
  const thrownOut = state.thrownOut.filter((t) => !sameSolution(t, guess)).length
  return {
    guess,
    actual,
    hits,
    solved,
    actionsLeft: state.actionsLeft,
    thrownOut,
    score: Math.max(0, (solved ? 3000 : hits * 400) + state.actionsLeft * 120 - thrownOut * 250),
  }
}

/** The clue a lead would surface, or null if that lead is spent. */
export function findLeadClue(c: CaseFile, state: GameState, lead: Lead): Clue | null {
  const seen = new Set(state.revealed.map((r) => r.clueId))
  return c.clues.find((cl) => cl.lead && sameLead(cl.lead, lead) && !seen.has(cl.id)) ?? null
}

/** Dossier notes are dealt round-robin by seat, identically on every client. */
export function dossierFor(c: CaseFile, state: GameState, playerId: string): Clue[] {
  const seat = state.players.findIndex((p) => p.id === playerId)
  if (seat < 0 || state.players.length === 0) return []
  return c.dossierClueIds
    .filter((_, i) => i % state.players.length === seat)
    .map((id) => c.clues.find((cl) => cl.id === id))
    .filter((cl): cl is Clue => Boolean(cl))
}

/** Facts this player can reason from: public reveals plus their own dossier. */
export function knownFacts(c: CaseFile, state: GameState, playerId: string) {
  const revealed = state.revealed
    .map((r) => c.clues.find((cl) => cl.id === r.clueId))
    .filter((cl): cl is Clue => Boolean(cl))
  return [...revealed, ...dossierFor(c, state, playerId)].flatMap((cl) => cl.facts)
}
