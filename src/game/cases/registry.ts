import { isSolvable } from '../solver'
import type { CaseFile } from '../types'

/** Seeds beginning with this load a hand-written case instead of generating one. */
export const AUTHORED_PREFIX = 'authored:'

/**
 * Hand-written cases — this is where real cases go. Add a file next to this
 * one exporting a `CaseFile` and register it below. See ./README.md for the
 * shape and the rules a case has to satisfy to be playable.
 */
export const AUTHORED_CASES: CaseFile[] = []

export function authoredSeed(id: string): string {
  return `${AUTHORED_PREFIX}${id}`
}

/**
 * Checks an authored case is actually winnable: the clue set must leave exactly
 * one possible answer, and it must be the stated one. Run this in a test or a
 * dev-time assert before shipping a case.
 */
export function validateCase(c: CaseFile): string[] {
  const problems: string[] = []
  const counts = { suspect: c.suspects.length, location: c.locations.length, means: c.means.length }
  for (const [cat, n] of Object.entries(counts)) {
    if (n < 2) problems.push(`Needs at least two options in "${cat}"`)
  }
  if (!c.suspects.some((s) => s.id === c.solution.suspect)) problems.push('solution.suspect is not in the cast')
  if (!c.locations.some((l) => l.id === c.solution.location)) problems.push('solution.location is not in the cast')
  if (!c.means.some((m) => m.id === c.solution.means)) problems.push('solution.means is not in the cast')
  for (const id of c.dossierClueIds) {
    if (!c.clues.some((cl) => cl.id === id)) problems.push(`dossierClueIds references unknown clue "${id}"`)
  }
  if (problems.length === 0 && !isSolvable(c)) {
    problems.push('The clues do not narrow to exactly one answer — add or tighten clues')
  }
  return problems
}
