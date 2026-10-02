import { AUTHORED_CASES, AUTHORED_PREFIX } from './cases/registry'
import {
  CASE_OPENERS,
  CASE_TITLES,
  FIRST_UNIT,
  MEANS_POOL,
  PATHOLOGY,
  PLACE_POOL,
  REPORTED_BY,
  SCENE_NOTES,
  SUSPECT_POOL,
  VICTIM_POOL,
  WEATHER,
} from './content'
import { buildFootage, buildPlaceThread, buildThread, firstName } from './evidence'
import { makeRng, type Rng } from './rng'
import { isSolvable } from './solver'
import { CATEGORIES, type CaseFile, type Category, type Clue, type Fact, type LeadKind, type Solution } from './types'

const CAST_SIZE = 5
/** How many options a narrowing clue leaves standing. */
const NARROW_TO = 3

const PRIMARY_LEAD: Record<Category, LeadKind> = {
  suspect: 'interrogate',
  location: 'canvass',
  means: 'forensics',
}

function nextCat(cat: Category): Category {
  const i = CATEGORIES.indexOf(cat)
  return CATEGORIES[(i + 1) % CATEGORIES.length]
}

function formatList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}

/**
 * Builds one playable case from a seed. Determinism matters: both clients
 * generate the same case locally, so the network only ever carries actions.
 */
export function generateCase(seed: string): CaseFile {
  const rng = makeRng(seed)

  const suspects = rng.sample(SUSPECT_POOL, CAST_SIZE)
  const locations = rng.sample(PLACE_POOL, CAST_SIZE)
  const means = rng.sample(MEANS_POOL, CAST_SIZE)
  const victim = rng.pick(VICTIM_POOL)
  const victimFirst = firstName(victim.name)

  const solution: Solution = {
    suspect: rng.pick(suspects).id,
    location: rng.pick(locations).id,
    means: rng.pick(means).id,
  }

  const idsOf = (cat: Category): string[] =>
    cat === 'suspect' ? suspects.map((s) => s.id) : cat === 'location' ? locations.map((p) => p.id) : means.map((m) => m.id)

  const nameOf = (cat: Category, id: string): string => {
    const list = cat === 'suspect' ? suspects : cat === 'location' ? locations : means
    return list.find((e) => e.id === id)?.name ?? id
  }

  const truthOf = (cat: Category): string =>
    cat === 'suspect' ? solution.suspect : cat === 'location' ? solution.location : solution.means

  /** A shortlist that always contains the true answer plus decoys. */
  const narrowIds = (cat: Category, size: number): string[] => {
    const truth = truthOf(cat)
    const decoys = rng.sample(idsOf(cat).filter((id) => id !== truth), size - 1)
    return rng.shuffle([truth, ...decoys])
  }

  const narrowFact = (cat: Category, size = NARROW_TO): { fact: Fact; text: string } => {
    const ids = narrowIds(cat, size)
    const list = formatList(ids.map((id) => nameOf(cat, id)))
    const culprit = suspects.find((s) => s.id === solution.suspect)!
    const text =
      cat === 'suspect'
        ? rng.pick([
            `Whoever did this ${culprit.trait}. That leaves ${list}.`,
            `The profile is narrow: someone who ${culprit.trait}. ${list} — one of them.`,
          ])
        : cat === 'location'
          ? rng.pick([
              `The victim's last hour is accounted for everywhere but three rooms. It happened in the ${list}.`,
              `Blood volume says the body was moved. The scene is the ${list}.`,
            ])
          : rng.pick([
              `The coroner will not commit past a shortlist: ${list}.`,
              `Whatever killed ${victim.name} was one of these: ${list}.`,
            ])
    return { fact: { t: 'oneOf', cat, ids }, text }
  }

  const clues: Clue[] = []
  let counter = 0
  const nextId = () => `c${++counter}`

  // One primary lead per cast member. Innocents clear themselves; the guilty
  // three (culprit, real scene, real method) give up an oblique narrowing
  // instead — they are not going to hand you the answer.
  for (const cat of CATEGORIES) {
    for (const id of idsOf(cat)) {
      const lead = { kind: PRIMARY_LEAD[cat], cat, id } as const
      if (id === truthOf(cat)) {
        const narrowed = narrowFact(nextCat(cat))
        clues.push({ id: nextId(), lead, text: obliqueText(rng, cat, nameOf(cat, id), narrowed.text), facts: [narrowed.fact] })
      } else {
        clues.push({ id: nextId(), lead, text: clearText(rng, cat, id, { suspects, locations, means }), facts: [{ t: 'eliminate', cat, id }] })
      }
    }
  }

  // Message threads: each shows a suspect with no way to some method, or no
  // way into some room. The culprit's thread can never name the real one — so
  // once you know the method or the scene, any thread that rules it out clears
  // that person.
  for (const s of suspects) {
    const guilty = s.id === solution.suspect
    const lead = { kind: 'messages', cat: 'suspect', id: s.id } as const
    if (rng.next() < 0.6) {
      const m = rng.pick(guilty ? means.filter((x) => x.id !== solution.means) : means)
      clues.push({
        id: nextId(),
        lead,
        text: `Messages between ${s.name} and ${victimFirst} — ${s.name} has no access to the ${m.name}.`,
        facts: [{ t: 'notBoth', a: { cat: 'suspect', id: s.id }, b: { cat: 'means', id: m.id } }],
        evidence: buildThread(rng, s.name, victimFirst, m.name),
      })
    } else {
      const p = rng.pick(guilty ? locations.filter((x) => x.id !== solution.location) : locations)
      clues.push({
        id: nextId(),
        lead,
        text: `Messages between ${s.name} and ${victimFirst} — ${s.name} could not get into the ${p.name}.`,
        facts: [{ t: 'notBoth', a: { cat: 'suspect', id: s.id }, b: { cat: 'location', id: p.id } }],
        evidence: buildPlaceThread(rng, s.name, victimFirst, p.name),
      })
    }
  }

  // Camera logs: each puts a suspect somewhere other than the room it covers.
  // The camera on the real scene never catches the real killer.
  for (const p of locations) {
    const pool = p.id === solution.location ? suspects.filter((s) => s.id !== solution.suspect) : suspects
    const who = rng.pick(pool)
    clues.push({
      id: nextId(),
      lead: { kind: 'cctv', cat: 'location', id: p.id },
      text: `Camera on the ${p.name} — ${who.name} was not in that room.`,
      facts: [{ t: 'notBoth', a: { cat: 'suspect', id: who.id }, b: { cat: 'location', id: p.id } }],
      evidence: buildFootage(rng, who.name, p.name, p.view),
    })
  }

  // Private dossiers, dealt round-robin: player one gets suspect + location
  // intel, player two gets means + a different suspect shortlist. Neither can
  // close the case alone, which is the point.
  const dossierClueIds: string[] = []
  for (const cat of ['suspect', 'location', 'means', 'suspect'] as Category[]) {
    const narrowed = narrowFact(cat)
    const clue: Clue = { id: nextId(), lead: null, text: narrowed.text, facts: [narrowed.fact] }
    clues.push(clue)
    dossierClueIds.push(clue.id)
  }

  const file: CaseFile = {
    id: `gen-${seed}`,
    seed,
    origin: 'generated',
    title: rng.pick(CASE_TITLES),
    blurb: rng.pick(CASE_OPENERS),
    victim,
    report: {
      reference: `CR-${1000 + rng.int(9000)}`,
      calledIn: `0${rng.int(5)}:${String(rng.int(60)).padStart(2, '0')}`,
      calledBy: rng.pick(REPORTED_BY),
      firstUnit: rng.pick(FIRST_UNIT),
      weather: rng.pick(WEATHER),
      pathology: rng.pick(PATHOLOGY),
      scene: rng.sample(SCENE_NOTES, 4),
    },
    suspects,
    locations,
    means,
    solution,
    clues,
    dossierClueIds,
  }

  // Cheap enough to always check (125 triples), and a case that cannot be
  // solved is worse than a crash — it wastes a whole round.
  if (!isSolvable(file)) {
    throw new Error(`Generated case ${seed} is not uniquely solvable`)
  }
  return file
}

function obliqueText(rng: Rng, cat: Category, name: string, narrowed: string): string {
  if (cat === 'suspect') {
    return rng.pick([
      `${name} answers every question with a question. One thing slips out: ${narrowed}`,
      `${name} is too calm, and too specific about the wrong details. Worth keeping: ${narrowed}`,
    ])
  }
  if (cat === 'location') {
    return rng.pick([
      `Canvassing the ${name} turns up a witness who saw something, not someone. ${narrowed}`,
      `The ${name} has been cleaned recently — too recently. It does give you this: ${narrowed}`,
    ])
  }
  return rng.pick([
    `The ${name} gives up a partial. Not enough to name anyone, enough to narrow it. ${narrowed}`,
    `Lab work on the ${name} is inconclusive, but it rules things in. ${narrowed}`,
  ])
}

function clearText(
  rng: Rng,
  cat: Category,
  id: string,
  cast: Pick<CaseFile, 'suspects' | 'locations' | 'means'>,
): string {
  if (cat === 'suspect') {
    const s = cast.suspects.find((x) => x.id === id)!
    return rng.pick([
      `${s.name}, ${s.occupation}. ${capitalise(s.motive)} — but they were ${s.alibi}, and two people confirm it. Cleared.`,
      `${s.name} had every reason: ${s.motive}. They were also ${s.alibi} for the whole window. Cleared.`,
    ])
  }
  if (cat === 'location') {
    const p = cast.locations.find((x) => x.id === id)!
    return rng.pick([
      `The ${p.name}: ${p.note} Swept twice, nothing. Not the scene.`,
      `Nothing in the ${p.name} — no spatter, no drag marks, no disturbance. ${p.note} Not the scene.`,
    ])
  }
  const m = cast.means.find((x) => x.id === id)!
  return rng.pick([
    `The ${m.name}: ${m.note} It does not match the injuries. Ruled out.`,
    `Lab came back on the ${m.name} — no tissue, no residue, wrong profile entirely. Ruled out.`,
  ])
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const cache = new Map<string, CaseFile>()

/**
 * Memoised so the reducer can derive the case on every fold without cost.
 * A seed of `authored:<id>` loads a hand-written case instead of generating one,
 * which is how real cases enter the game.
 */
export function getCase(seed: string): CaseFile {
  let c = cache.get(seed)
  if (!c) {
    c = seed.startsWith(AUTHORED_PREFIX)
      ? (AUTHORED_CASES.find((a) => a.id === seed.slice(AUTHORED_PREFIX.length)) ?? generateCase(seed))
      : generateCase(seed)
    cache.set(seed, c)
  }
  return c
}
