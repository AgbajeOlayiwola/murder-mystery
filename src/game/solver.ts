import type { CaseFile, Category, Fact, Solution } from './types'

/** Every triple the cast allows — 5×5×5 = 125, so brute force is free. */
export function allTriples(c: CaseFile): Solution[] {
  const out: Solution[] = []
  for (const s of c.suspects) {
    for (const l of c.locations) {
      for (const m of c.means) {
        out.push({ suspect: s.id, location: l.id, means: m.id })
      }
    }
  }
  return out
}

function idIn(sol: Solution, cat: Category): string {
  return cat === 'suspect' ? sol.suspect : cat === 'location' ? sol.location : sol.means
}

export function holds(sol: Solution, fact: Fact): boolean {
  switch (fact.t) {
    case 'eliminate':
      return idIn(sol, fact.cat) !== fact.id
    case 'oneOf':
      return fact.ids.includes(idIn(sol, fact.cat))
    case 'notBoth':
      return !(idIn(sol, fact.a.cat) === fact.a.id && idIn(sol, fact.b.cat) === fact.b.id)
  }
}

/** Triples still standing given a set of known facts. */
export function candidates(c: CaseFile, facts: Fact[]): Solution[] {
  return allTriples(c).filter((sol) => facts.every((f) => holds(sol, f)))
}

/** Which ids in a category are still possible — drives the deduction board. */
export function livePerCategory(c: CaseFile, facts: Fact[]): Record<Category, Set<string>> {
  const live = candidates(c, facts)
  return {
    suspect: new Set(live.map((s) => s.suspect)),
    location: new Set(live.map((s) => s.location)),
    means: new Set(live.map((s) => s.means)),
  }
}

export function isSolvable(c: CaseFile): boolean {
  const facts = c.clues.flatMap((cl) => cl.facts)
  const live = candidates(c, facts)
  return live.length === 1 && sameSolution(live[0], c.solution)
}

export function sameSolution(a: Solution, b: Solution): boolean {
  return a.suspect === b.suspect && a.location === b.location && a.means === b.means
}

export function scoreAccusation(guess: Solution, actual: Solution): number {
  let hits = 0
  if (guess.suspect === actual.suspect) hits++
  if (guess.location === actual.location) hits++
  if (guess.means === actual.means) hits++
  return hits
}
