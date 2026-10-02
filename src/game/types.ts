export type Category = 'suspect' | 'location' | 'means'

export const CATEGORIES: readonly Category[] = ['suspect', 'location', 'means'] as const

/** What the player does to chase a lead. Each cast member offers one or two. */
export type LeadKind = 'interrogate' | 'messages' | 'canvass' | 'cctv' | 'forensics'

export interface Lead {
  kind: LeadKind
  cat: Category
  id: string
}

/**
 * Talking to people and searching rooms clears them outright. Messages and
 * cameras do something different: they tie a *person* to a *thing*, which is
 * why they are worth a turn even when you already have a shortlist.
 */
export const LEAD_KINDS: Record<Category, readonly LeadKind[]> = {
  suspect: ['interrogate', 'messages'],
  location: ['canvass', 'cctv'],
  means: ['forensics'],
}

export const LEAD_LABEL: Record<LeadKind, string> = {
  interrogate: 'Interrogate',
  messages: 'Read messages',
  canvass: 'Canvass',
  cctv: 'Pull CCTV',
  forensics: 'Run forensics',
}

export const LEAD_SHORT: Record<LeadKind, string> = {
  interrogate: 'Interview',
  messages: 'Messages',
  canvass: 'Search',
  cctv: 'CCTV',
  forensics: 'Forensics',
}

export function sameLead(a: Lead, b: Lead): boolean {
  return a.kind === b.kind && a.cat === b.cat && a.id === b.id
}

export interface Suspect {
  id: string
  name: string
  occupation: string
  motive: string
  /** Where they claim they were — used to flavour elimination clues. */
  alibi: string
  /** A distinguishing trait, used to flavour narrowing clues. */
  trait: string
}

export interface Place {
  id: string
  name: string
  note: string
  /** What its camera sees. Falls back to a plain corridor. */
  view?: CameraView
}

export interface Means {
  id: string
  name: string
  note: string
}

export interface Solution {
  suspect: string
  location: string
  means: string
}

export interface Ref {
  cat: Category
  id: string
}

/**
 * The machine-readable content of a clue. Everything the solver reasons about
 * reduces to these three shapes, which keeps authored true-crime cases as
 * checkable as generated ones.
 */
export type Fact =
  | { t: 'eliminate'; cat: Category; id: string }
  | { t: 'oneOf'; cat: Category; ids: string[] }
  | { t: 'notBoth'; a: Ref; b: Ref }

export interface ThreadMessage {
  at: string
  from: 'victim' | 'them'
  text: string
  /** Unsent or deleted before the phone was recovered — shown, but unreadable. */
  deleted?: boolean
  /** The line that actually carries the fact, highlighted in the UI. */
  key?: boolean
}

/**
 * What a camera is pointed at. The UI draws a backdrop for each, so stills can
 * be rendered from the seed instead of shipped as images.
 */
export type CameraView =
  | 'corridor'
  | 'doorway'
  | 'shelves'
  | 'glass'
  | 'racks'
  | 'stair'
  | 'vehicles'
  | 'water'
  | 'arches'
  | 'garden'

/** What is in frame at the moment a footage entry was logged. */
export type Shot =
  | { show: 'empty' }
  | { show: 'light' }
  | { show: 'rain' }
  /** Figures too far or too dark to identify. `xs` are horizontal positions, 0–1. */
  | { show: 'figures'; xs: number[] }
  /** One figure, optionally matched to a name by the face-match overlay. */
  | { show: 'figure'; x: number; heading: 'left' | 'right' | 'none'; tag?: string; match?: number }

export interface FootageEntry {
  at: string
  text: string
  /** The line that actually carries the fact, highlighted in the UI. */
  key?: boolean
  /** Rendered as a still. Entries without one show as log lines only. */
  shot?: Shot
}

/** Structured evidence, rendered as itself rather than as a paragraph. */
export type Evidence =
  | {
      kind: 'messages'
      /** The other party. The recovered phone is always the victim's. */
      withName: string
      /** Victim's first name, for the outgoing side of the thread. */
      ownerName?: string
      when: string
      thread: ThreadMessage[]
    }
  | { kind: 'cctv'; camera: string; view?: CameraView; entries: FootageEntry[] }

export interface Clue {
  id: string
  /** Plain-prose summary. Always present — it is the fallback and the log line. */
  text: string
  facts: Fact[]
  /** Which lead surfaces this clue. `null` means it is dealt as a private dossier note. */
  lead: Lead | null
  evidence?: Evidence
}

/**
 * The opening police report — step one of the investigation. Atmosphere only:
 * it says what happened, where and when, and deliberately carries no `Fact`, so
 * reading it can never give the answer away or contradict a clue.
 */
export interface PoliceReport {
  reference: string
  calledIn: string
  calledBy: string
  firstUnit: string
  weather: string
  pathology: string
  scene: string[]
}

export interface CaseFile {
  id: string
  seed: string
  origin: 'generated' | 'authored'
  title: string
  blurb: string
  victim: { name: string; detail: string }
  /** Optional so authored cases can skip it; the UI falls back to the blurb. */
  report?: PoliceReport
  suspects: Suspect[]
  locations: Place[]
  means: Means[]
  solution: Solution
  clues: Clue[]
  /** Dealt round-robin to players by index, so both clients agree without syncing them. */
  dossierClueIds: string[]
}

export type Difficulty = 'rookie' | 'detective' | 'coldcase'

/**
 * Budgets are tuned against the measured floor: a perfect team pooling both
 * dossiers needs a median of 5 leads and never more than 6 (see `pnpm check`).
 * Rookie and Detective sit at or above that floor; Cold case sits below it on
 * purpose, so the last step has to be a guess you talk yourselves into.
 */
export const DIFFICULTY: Record<Difficulty, { label: string; actions: number; blurb: string }> = {
  rookie: { label: 'Rookie', actions: 8, blurb: 'Room to be thorough.' },
  detective: { label: 'Detective', actions: 6, blurb: 'Enough, if you pool everything.' },
  coldcase: { label: 'Cold case', actions: 4, blurb: 'Not enough. You will have to gamble.' },
}

export function entityName(c: CaseFile, ref: Ref): string {
  const list = listFor(c, ref.cat)
  return list.find((e) => e.id === ref.id)?.name ?? ref.id
}

export function listFor(c: CaseFile, cat: Category): Array<Suspect | Place | Means> {
  if (cat === 'suspect') return c.suspects
  if (cat === 'location') return c.locations
  return c.means
}
