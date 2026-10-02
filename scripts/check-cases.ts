/**
 * Soundness checks. Three things are verified here:
 *
 *   1. Every generated case is structurally sane and uniquely solvable.
 *   2. A full two-player game runs through the reducer and reaches a verdict,
 *      with the turn, lead and accusation rules actually enforced.
 *   3. The action budgets in DIFFICULTY are winnable by a perfect player.
 *
 * Run with `pnpm check`.
 */
import { AUTHORED_CASES, validateCase } from '../src/game/cases/registry'
import { FEATURED_SEEDS } from '../src/game/featured'
import { dossierFor, findLeadClue, initialState, knownFacts, reduce, type GameEvent } from '../src/game/engine'
import { generateCase, getCase } from '../src/game/generator'
import { candidates, isSolvable } from '../src/game/solver'
import { CATEGORIES, DIFFICULTY, LEAD_KINDS, entityName, type CaseFile, type Category, type Clue, type Lead, type Solution } from '../src/game/types'

const SAMPLE = 2000
const PLAY_SAMPLE = 400
const problems: string[] = []

function idsOf(c: CaseFile, cat: Category): string[] {
  return cat === 'suspect'
    ? c.suspects.map((s) => s.id)
    : cat === 'location'
      ? c.locations.map((p) => p.id)
      : c.means.map((m) => m.id)
}

function allLeads(c: CaseFile): Lead[] {
  return CATEGORIES.flatMap((cat) => idsOf(c, cat).flatMap((id) => LEAD_KINDS[cat].map((kind) => ({ kind, cat, id }))))
}

/**
 * Evidence has to show what its fact claims. A thread or a camera that encodes
 * `notBoth{A, B}` must name both A and B in what the player actually reads, and
 * every CCTV entry must have a still to look at.
 */
function evidenceIssues(c: CaseFile, cl: Clue): string[] {
  const issues: string[] = []
  if (cl.lead && (cl.lead.kind === 'messages' || cl.lead.kind === 'cctv')) {
    const ev = cl.evidence
    if (!ev || ev.kind !== cl.lead.kind) return [`${cl.id}: ${cl.lead.kind} lead has no ${cl.lead.kind} evidence`]
    const readable =
      ev.kind === 'messages'
        ? [ev.withName, ...ev.thread.map((m) => m.text)].join(' ')
        : [ev.camera, ...ev.entries.map((e) => `${e.text} ${e.shot?.show === 'figure' ? (e.shot.tag ?? '') : ''}`)].join(' ')
    for (const f of cl.facts) {
      if (f.t !== 'notBoth') continue
      for (const ref of [f.a, f.b]) {
        if (!readable.includes(entityName(c, ref))) issues.push(`${cl.id}: evidence never names ${entityName(c, ref)}`)
      }
    }
    if (ev.kind === 'messages' && !ev.thread.some((m) => m.key)) issues.push(`${cl.id}: thread has no key message`)
    if (ev.kind === 'cctv') {
      if (!ev.entries.some((e) => e.key)) issues.push(`${cl.id}: footage has no key entry`)
      if (ev.entries.some((e) => !e.shot)) issues.push(`${cl.id}: footage entry with no still`)
      const tagged = ev.entries.filter((e) => e.shot?.show === 'figure' && e.shot.tag)
      if (tagged.some((e) => !e.key)) issues.push(`${cl.id}: a figure is identified outside the key entry`)
    }
  }
  return issues
}

// ---------------------------------------------------------------- structure

let dossierOnlyWins = 0

for (let i = 0; i < SAMPLE; i++) {
  const seed = `seed-${i}`
  let c: CaseFile
  try {
    c = generateCase(seed)
  } catch (err) {
    problems.push(`${seed}: threw — ${(err as Error).message}`)
    continue
  }

  if (!isSolvable(c)) problems.push(`${seed}: not uniquely solvable`)

  // Every lead on the board must surface exactly one clue, or it is a dead end.
  for (const lead of allLeads(c)) {
    const n = c.clues.filter((cl) => cl.lead && cl.lead.kind === lead.kind && cl.lead.cat === lead.cat && cl.lead.id === lead.id).length
    if (n !== 1) problems.push(`${seed}: ${lead.kind} ${lead.cat}/${lead.id} surfaces ${n} clues, expected 1`)
  }
  for (const cl of c.clues) for (const issue of evidenceIssues(c, cl)) problems.push(`${seed}: ${issue}`)

  // The report is read before the board, so it must not name anyone or
  // anything in the cast — it can set the scene, never narrow it.
  if (!c.report) {
    problems.push(`${seed}: no police report`)
  } else {
    const prose = [c.report.calledBy, c.report.firstUnit, c.report.weather, c.report.pathology, ...c.report.scene]
      .join(' ')
      .toLowerCase()
    for (const cat of CATEGORIES) {
      for (const id of idsOf(c, cat)) {
        const label = entityName(c, { cat, id }).toLowerCase()
        if (prose.includes(label)) problems.push(`${seed}: report names ${label}, which the board has to establish`)
      }
    }
    if (c.report.scene.length !== 4) problems.push(`${seed}: report has ${c.report.scene.length} scene notes, expected 4`)
  }

  if (c.dossierClueIds.length !== 4) problems.push(`${seed}: ${c.dossierClueIds.length} dossier notes, expected 4`)
  for (const id of c.dossierClueIds) {
    if (!c.clues.some((cl) => cl.id === id)) problems.push(`${seed}: dossier references missing clue ${id}`)
  }

  // The private notes alone must not give the game away.
  const dossierFacts = c.dossierClueIds.flatMap((id) => c.clues.find((cl) => cl.id === id)?.facts ?? [])
  if (candidates(c, dossierFacts).length === 1) dossierOnlyWins++
}

// --------------------------------------------------------------- game rules

function playthrough(seed: string): string[] {
  const issues: string[] = []
  let s = initialState()
  const apply = (e: GameEvent) => {
    s = reduce(s, e)
  }

  apply({ t: 'join', playerId: 'a', name: 'A' })
  apply({ t: 'join', playerId: 'a', name: 'A' })
  if (s.players.length !== 1) issues.push('a duplicate join seated the same player twice')

  apply({ t: 'join', playerId: 'b', name: 'B' })
  apply({ t: 'setDifficulty', difficulty: 'detective' })
  apply({ t: 'start', seed })

  if (s.phase !== 'investigating') issues.push('start did not open the case')
  if (s.actionsLeft !== DIFFICULTY.detective.actions) issues.push(`wrong action budget: ${s.actionsLeft}`)

  const c = getCase(seed)
  const leads = allLeads(c)

  const da = dossierFor(c, s, 'a').map((cl) => cl.id)
  const db = dossierFor(c, s, 'b').map((cl) => cl.id)
  if (da.length !== 2 || db.length !== 2) issues.push(`dossiers split ${da.length}/${db.length}, expected 2/2`)
  if (da.some((id) => db.includes(id))) issues.push('both detectives were dealt the same note')

  // Acting out of turn must be refused.
  const offTurn = s.players[(s.turnIndex + 1) % 2].id
  const before = s.actionsLeft
  apply({ t: 'investigate', playerId: offTurn, lead: leads[0] })
  if (s.actionsLeft !== before) issues.push('a player moved out of turn')

  let guard = 0
  while (s.actionsLeft > 0 && guard++ < 50) {
    const onTurn = s.players[s.turnIndex].id
    const lead = leads.find((l) => findLeadClue(c, s, l) !== null)
    if (!lead) {
      issues.push('leads ran out before the action budget did')
      break
    }
    const budget = s.actionsLeft
    apply({ t: 'investigate', playerId: onTurn, lead })
    if (s.actionsLeft !== budget - 1) {
      issues.push('investigating did not consume an action')
      break
    }
    // Re-chasing a spent lead must be free and must reveal nothing new.
    const after = s.actionsLeft
    const revealedCount = s.revealed.length
    apply({ t: 'investigate', playerId: s.players[s.turnIndex].id, lead })
    if (s.actionsLeft !== after || s.revealed.length !== revealedCount) {
      issues.push('a spent lead could be chased again')
    }
  }
  if (s.revealed.length !== DIFFICULTY.detective.actions) {
    issues.push(`revealed ${s.revealed.length} clues for ${DIFFICULTY.detective.actions} actions`)
  }

  // Investigating past the budget must be refused.
  apply({ t: 'investigate', playerId: s.players[s.turnIndex].id, lead: leads[0] })
  if (s.revealed.length !== DIFFICULTY.detective.actions) issues.push('investigated with no actions left')

  // An accusation needs both signatures.
  apply({ t: 'propose', playerId: 'a', solution: c.solution })
  if (s.phase !== 'investigating') issues.push('accusation resolved without the partner')
  apply({ t: 'agree', playerId: 'a' })
  if (s.phase !== 'investigating') issues.push('the proposer alone closed the case')
  apply({ t: 'agree', playerId: 'b' })
  if (s.phase !== 'verdict') issues.push('a signed-off accusation did not reach a verdict')
  if (!s.verdict?.solved) issues.push('a correct accusation was not scored as solved')

  // A wrong accusation costs a lead and leaves the case open, until the leads
  // run out — then it is final.
  {
    let w = initialState()
    const applyW = (e: GameEvent) => {
      w = reduce(w, e)
    }
    applyW({ t: 'join', playerId: 'a', name: 'A' })
    applyW({ t: 'join', playerId: 'b', name: 'B' })
    applyW({ t: 'setDifficulty', difficulty: 'detective' })
    applyW({ t: 'start', seed })

    const wrong = wrongSolution(c)
    const budget = w.actionsLeft
    applyW({ t: 'propose', playerId: 'a', solution: wrong })
    applyW({ t: 'agree', playerId: 'a' })
    applyW({ t: 'agree', playerId: 'b' })
    if (w.phase !== 'investigating') issues.push('a wrong accusation ended the case while leads remained')
    if (w.actionsLeft !== budget - 1) issues.push('a wrong accusation did not cost a lead')
    if (w.thrownOut.length !== 1) issues.push('a wrong accusation was not recorded')
    if (w.proposal) issues.push('the collapsed accusation stayed on the table')

    // The same triple must not be put up twice.
    applyW({ t: 'propose', playerId: 'a', solution: wrong })
    if (w.proposal) issues.push('a thrown-out accusation could be proposed again')

    // Burn the rest of the budget, then a wrong accusation has to be final.
    let guard2 = 0
    while (w.actionsLeft > 0 && guard2++ < 50) {
      const next = leads.find((l) => findLeadClue(c, w, l) !== null)
      if (!next) break
      w = reduce(w, { t: 'investigate', playerId: w.players[w.turnIndex].id, lead: next })
    }
    const wrong2 = wrongSolution(c, wrong)
    applyW({ t: 'propose', playerId: 'a', solution: wrong2 })
    applyW({ t: 'agree', playerId: 'a' })
    applyW({ t: 'agree', playerId: 'b' })
    if (w.phase !== 'verdict') issues.push('a wrong accusation with no leads left did not end the case')
    if (w.verdict?.solved) issues.push('a wrong accusation was scored as solved')
    if (w.verdict?.thrownOut !== 1) issues.push(`verdict counted ${w.verdict?.thrownOut} earlier collapses, expected 1`)
  }

  // Solo play has nobody to sign off, so it must resolve immediately.
  let solo = initialState()
  solo = reduce(solo, { t: 'join', playerId: 'a', name: 'A' })
  solo = reduce(solo, { t: 'start', seed })
  solo = reduce(solo, { t: 'propose', playerId: 'a', solution: c.solution })
  if (solo.phase !== 'verdict') issues.push('a solo accusation did not resolve')

  return issues
}

/** Any triple that is not the answer, and not one already used. */
function wrongSolution(c: CaseFile, avoid?: Solution): Solution {
  for (const s of c.suspects) {
    const guess = { suspect: s.id, location: c.solution.location, means: c.solution.means }
    const same = (a: Solution, b: Solution) => a.suspect === b.suspect && a.location === b.location && a.means === b.means
    if (!same(guess, c.solution) && (!avoid || !same(guess, avoid))) return guess
  }
  throw new Error('no wrong solution available')
}

// --------------------------------------------------- is the budget winnable?

/**
 * How many leads a perfect team needs: both dossiers pooled, then greedily
 * chase whichever lead cuts the candidate list hardest. This is the floor, so
 * a difficulty budget below it is unwinnable no matter how well you play.
 */
function leadsNeeded(seed: string): number {
  const c = getCase(seed)
  let s = reduce(reduce(reduce(initialState(), { t: 'join', playerId: 'a', name: 'A' }), { t: 'join', playerId: 'b', name: 'B' }), {
    t: 'start',
    seed,
  })
  const pooled = () => [...knownFacts(c, s, 'a'), ...dossierFor(c, s, 'b').flatMap((cl) => cl.facts)]
  const leads = allLeads(c)

  for (let spent = 0; spent <= leads.length; spent++) {
    if (candidates(c, pooled()).length === 1) return spent
    let best: { lead: Lead; left: number } | null = null
    for (const lead of leads) {
      const clue = findLeadClue(c, s, lead)
      if (!clue) continue
      const left = candidates(c, [...pooled(), ...clue.facts]).length
      if (!best || left < best.left) best = { lead, left }
    }
    if (!best) break
    s = reduce(s, { t: 'investigate', playerId: s.players[s.turnIndex].id, lead: best.lead })
  }
  return Infinity
}

const needed: number[] = []
for (let i = 0; i < PLAY_SAMPLE; i++) {
  const seed = `seed-${i}`
  for (const issue of playthrough(seed)) problems.push(`${seed}: ${issue}`)
  needed.push(leadsNeeded(seed))
}
needed.sort((a, b) => a - b)
const median = needed[Math.floor(needed.length / 2)]
const worst = needed[needed.length - 1]

/**
 * Rookie and Detective promise a solvable case, so perfect play must almost
 * always get there. Cold case promises the opposite — it is meant to be short
 * of the floor — but it should still be winnable often enough to be worth
 * playing rather than a coin flip.
 */
const MIN_WINNABLE: Record<keyof typeof DIFFICULTY, number> = { rookie: 0.98, detective: 0.95, coldcase: 0.15 }

for (const level of Object.keys(DIFFICULTY) as Array<keyof typeof DIFFICULTY>) {
  const budget = DIFFICULTY[level].actions
  const winnable = needed.filter((n) => n <= budget).length / needed.length
  if (winnable < MIN_WINNABLE[level]) {
    problems.push(
      `difficulty "${level}" (${budget} leads) is winnable in only ${(winnable * 100).toFixed(0)}% of cases, want ${(MIN_WINNABLE[level] * 100).toFixed(0)}%`,
    )
  }
}

// The lobby offers these by name, so they must generate, be solvable, and be
// told apart at a glance.
{
  const titles = new Set<string>()
  const victims = new Set<string>()
  for (const seed of FEATURED_SEEDS) {
    try {
      const c = getCase(seed)
      if (!isSolvable(c)) problems.push(`featured/${seed}: not uniquely solvable`)
      if (titles.has(c.title)) problems.push(`featured/${seed}: duplicate title "${c.title}"`)
      if (victims.has(c.victim.name)) problems.push(`featured/${seed}: duplicate victim "${c.victim.name}"`)
      titles.add(c.title)
      victims.add(c.victim.name)
    } catch (err) {
      problems.push(`featured/${seed}: threw — ${(err as Error).message}`)
    }
  }
}

for (const c of AUTHORED_CASES) {
  for (const p of validateCase(c)) problems.push(`authored/${c.id}: ${p}`)
}

// ------------------------------------------------------------------- report

console.log(`generated cases checked  : ${SAMPLE}`)
console.log(`full playthroughs        : ${PLAY_SAMPLE}`)
console.log(`featured cases checked   : ${FEATURED_SEEDS.length}`)
console.log(`authored cases checked   : ${AUTHORED_CASES.length}`)
console.log(`solvable from notes only : ${dossierOnlyWins} (want 0)`)
console.log(`leads a perfect team needs: best ${needed[0]}, median ${median}, worst ${worst}`)
for (const level of Object.keys(DIFFICULTY) as Array<keyof typeof DIFFICULTY>) {
  const budget = DIFFICULTY[level].actions
  const pct = ((needed.filter((n) => n <= budget).length / needed.length) * 100).toFixed(0)
  console.log(`  ${level.padEnd(10)} ${String(budget).padStart(2)} leads → winnable in ${pct}% of cases`)
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`)
  for (const p of problems.slice(0, 25)) console.error(`  - ${p}`)
  process.exit(1)
}
console.log('\nAll checks passed.')
