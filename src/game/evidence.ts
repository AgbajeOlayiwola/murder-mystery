import type { Rng } from './rng'
import type { CameraView, Evidence, FootageEntry, Shot, ThreadMessage } from './types'

/**
 * Builders for the two structured evidence types. Both are written so the fact
 * they carry is *readable from the evidence itself* — a player should be able
 * to work out what a thread proves without being told.
 */

const HONORIFICS = new Set([
  'chief', 'alhaji', 'alhaja', 'hajiya', 'justice', 'judge', 'pastor', 'barrister', 'engr', 'dr', 'prof',
  'mallam', 'deacon', 'rev', 'reverend', 'otunba', 'pa', 'mama', 'mr', 'mrs', 'ms',
])

/** What people call each other in a text: first name, or surname after a title. */
export function firstName(full: string): string {
  const parts = full.replace(/\./g, '').split(' ')
  return HONORIFICS.has(parts[0].toLowerCase()) && parts[1] ? parts[1] : parts[0]
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** `key` marks the line that carries the fact. A `null` text is a deleted message. */
type Line = [from: 'victim' | 'them', text: string | null, key?: boolean]

/**
 * Each template shows the suspect having no access to, or no knowledge of, the
 * named method — which is exactly `notBoth{suspect, means}`: if they did it, it
 * was not with that.
 */
const MEANS_THREADS: Array<(them: string, victim: string, means: string) => Line[]> = [
  (_t, _v, m) => [
    ['them', `Is the ${m} still in the house?`],
    ['victim', `Hidden it. You'd never find it.`, true],
    ['them', `Since when?`],
    ['victim', `Since I stopped trusting you with it.`],
  ],
  (_t, _v, m) => [
    ['victim', `I've moved the ${m}. Somewhere you can't get to.`, true],
    ['them', `You think I'd know what to do with it?`],
    ['victim', `I think you'd try.`],
    ['them', `I wouldn't know where to start.`],
  ],
  (_t, v, m) => [
    ['them', `${v}, I can't be near the ${m}. You know why.`, true],
    ['victim', `Then stay out of that part of the house.`],
    ['them', `I always do.`],
  ],
  (_t, _v, m) => [
    ['them', `Your locksmith came. He's changed everything.`],
    ['victim', `Good.`],
    ['them', `Including wherever you keep the ${m}?`],
    ['victim', `Especially that. You don't have a key to it any more.`, true],
  ],
  (t, _v, m) => [
    ['victim', `The ${m} is not yours and never was.`],
    ['them', `I've never so much as touched it.`],
    ['victim', `And you won't. It's locked up and only I know where. See that it stays that way, ${t}.`, true],
  ],
  (t, _v, m) => [
    ['victim', `Who has been asking about the ${m}?`],
    ['them', `Not me o. I don't even know where you keep it.`],
    ['victim', `Good. It stays locked, and I am the only one with that key, ${t}.`, true],
  ],
  (_t, _v, m) => [
    ['them', null],
    ['victim', `I saw that before you deleted it.`],
    ['them', `Forget it. I was angry.`],
    ['victim', `Angry enough to ask about the ${m}? It's in the safe, and you don't have the combination.`, true],
  ],
]

/**
 * Each template puts the suspect out of reach of the named room — which is
 * `notBoth{suspect, location}`, the same shape a camera gives you.
 */
const PLACE_THREADS: Array<(them: string, victim: string, place: string) => Line[]> = [
  (_t, _v, p) => [
    ['victim', `Stay out of the ${p}.`],
    ['them', `I haven't set foot in it since the funeral.`],
    ['victim', `The lock's been changed tonight. You couldn't get in if you tried.`, true],
  ],
  (_t, v, p) => [
    ['them', `${v}, I've left my key to the ${p} with the gateman.`],
    ['victim', `Received. It's the only one, and it's in my pocket.`, true],
    ['them', `Then we're done with that.`],
  ],
  (_t, _v, p) => [
    ['them', `Your dog won't let me past the ${p} door.`],
    ['victim', `Good. He sleeps in there. He'd wake the whole house for anyone but me.`, true],
    ['them', `Noted.`],
  ],
  (_t, _v, p) => [
    ['them', null],
    ['them', `Sorry. Wrong thread.`],
    ['victim', `You asked how to get into the ${p}.`],
    ['them', `And you said I can't. It's alarmed and my code doesn't cover it.`, true],
  ],
  (_t, _v, p) => [
    ['them', `Abeg, who do I beg to get into the ${p}?`],
    ['victim', `Nobody. The only key is on my body, day and night.`, true],
    ['them', `Then forget I asked.`],
  ],
  (t, _v, p) => [
    ['victim', `Meet me in the ${p} tonight?`],
    ['them', `How? My pass doesn't open that wing, and you know the ${p} is the far end of it.`, true],
    ['victim', `Tomorrow then, ${t}.`],
  ],
]

function thread(rng: Rng, lines: Line[], them: string, victim: string): Evidence {
  let t = 19 * 60 + rng.int(150)
  const out: ThreadMessage[] = lines.map(([from, text, key]) => {
    t += 1 + rng.int(6)
    const msg: ThreadMessage = { at: clock(t), from, text: text ?? '' }
    if (text === null) msg.deleted = true
    if (key) msg.key = true
    return msg
  })
  return {
    kind: 'messages',
    withName: them,
    ownerName: victim,
    when: rng.pick(['Two days before', 'The week before', 'Nine days before', 'The night before']),
    thread: out,
  }
}

export function buildThread(rng: Rng, them: string, victim: string, means: string): Evidence {
  return thread(rng, rng.pick(MEANS_THREADS)(firstName(them), victim, means), them, victim)
}

export function buildPlaceThread(rng: Rng, them: string, victim: string, place: string): Evidence {
  return thread(rng, rng.pick(PLACE_THREADS)(firstName(them), victim, place), them, victim)
}

type FrameLine = [text: string, key: boolean, shot: Shot]

/**
 * Each template puts the suspect somewhere that is not the room the camera
 * covers — `notBoth{suspect, location}`. The camera at the real scene never
 * catches the real killer, which is the whole reason the case is open.
 *
 * Every line carries a `shot`, so the still a player looks at shows exactly
 * what the log line claims — the named figure is tagged, nobody else is.
 */
const FOOTAGE: Array<(who: string, place: string, x: number) => FrameLine[]> = [
  (who, place, x) => [
    ['Motion trigger on the outer door. Nothing in frame.', false, { show: 'empty' }],
    [
      `${who} passes the ${place} entrance without stopping. This camera covers the only way in.`,
      true,
      { show: 'figure', x, heading: 'right', tag: who, match: 94 },
    ],
    ['No further movement before the call came in.', false, { show: 'empty' }],
  ],
  (who, place) => [
    ['Frame clear.', false, { show: 'empty' }],
    [
      `${who} walks out of shot, away from the ${place}, and is picked up by the gate camera leaving the compound.`,
      true,
      { show: 'figure', x: 0.14, heading: 'left', tag: who, match: 91 },
    ],
    ['A light goes on, then off again. No person in frame.', false, { show: 'light' }],
  ],
  (who, place, x) => [
    ['Two figures cross the far end. Neither resolves.', false, { show: 'figures', xs: [0.3, 0.42] }],
    [
      `${who} stops at the ${place} door, looks in, and turns back. Never crosses the threshold.`,
      true,
      { show: 'figure', x, heading: 'none', tag: who, match: 97 },
    ],
    ['Feed steady until the first unit arrives.', false, { show: 'empty' }],
  ],
  (who, place, x) => [
    ['Rain on the lens. Usable.', false, { show: 'rain' }],
    [
      `${who} in frame the whole time the ${place} was dark. They never get up.`,
      true,
      { show: 'figure', x, heading: 'none', tag: who, match: 88 },
    ],
    ['Nothing else until morning.', false, { show: 'rain' }],
  ],
  (who, place, x) => [
    ['Lights on the timer go out.', false, { show: 'light' }],
    ['One figure at the far end, back to camera.', false, { show: 'figures', xs: [0.68] }],
    [
      `The figure turns: ${who}. Door sensor on the ${place} logs no opening while they are in frame.`,
      true,
      { show: 'figure', x, heading: 'none', tag: who, match: 93 },
    ],
  ],
]

export function buildFootage(rng: Rng, who: string, place: string, view: CameraView = 'corridor'): Evidence {
  const x = 0.3 + rng.next() * 0.4
  const lines = rng.pick(FOOTAGE)(who, place, x)
  let t = 22 * 60 + rng.int(100)
  const entries: FootageEntry[] = lines.map(([text, key, shot]) => {
    t += 3 + rng.int(20)
    return { at: clock(t), text, key, shot }
  })
  return {
    kind: 'cctv',
    camera: `${place} — fixed, ${rng.pick(['east approach', 'ceiling corner', 'doorway', 'stair head'])}`,
    view,
    entries,
  }
}
