/**
 * Sound effects, synthesised rather than shipped. Same reasoning as the CCTV
 * stills: no asset files, nothing to load, and every cue is derived from the
 * event that fired it.
 *
 * Cues are short, dry and quiet on purpose — this is a game people play while
 * talking to each other, so nothing here should ever talk over them.
 */

export type Cue =
  | 'file' // the case file opens
  | 'interview' // a suspect is interrogated
  | 'messages' // a phone thread is recovered
  | 'camera' // CCTV is pulled
  | 'canvass' // a room is searched
  | 'forensics' // lab work comes back
  | 'note' // a dossier note, or a quiet UI confirm
  | 'turn' // the board comes round to you
  | 'accuse' // an accusation is on the table
  | 'rejected' // the accusation collapsed
  | 'solved'
  | 'failed'

const MUTE_KEY = 'cold-open:muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = read()

function read(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    // Private windows refuse storage; muting still holds for this session.
  }
}

/**
 * Built on first use. A cue triggered by the *other* player arrives without a
 * gesture behind it, so the context may refuse to start — that is fine, it
 * starts on the next thing this player does.
 */
function audio(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.3
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type ToneOpts = {
  freq: number
  /** Slides to this by the end of the tone. */
  to?: number
  at?: number
  dur?: number
  gain?: number
  type?: OscillatorType
}

function tone(c: AudioContext, { freq, to, at = 0, dur = 0.12, gain = 0.5, type = 'sine' }: ToneOpts): void {
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const vol = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  // Short attack, exponential tail: a struck sound rather than a beep.
  vol.gain.setValueAtTime(0.0001, t)
  vol.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  vol.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(vol).connect(master!)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** Filtered white noise — paper, shutters, static, room tone. */
function noise(
  c: AudioContext,
  { at = 0, dur = 0.2, gain = 0.3, freq = 1800, q = 0.7, type = 'bandpass' as BiquadFilterType, sweepTo = 0 },
): void {
  const t = c.currentTime + at
  const frames = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, t)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  filter.Q.value = q
  const vol = c.createGain()
  vol.gain.setValueAtTime(gain, t)
  vol.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(vol).connect(master!)
  src.start(t)
  src.stop(t + dur + 0.02)
}

export function play(cue: Cue): void {
  const c = audio()
  if (!c) return

  switch (cue) {
    case 'file':
      // Paper: two rustles and the slap of a folder going flat.
      noise(c, { dur: 0.26, gain: 0.22, freq: 2600, q: 0.5, sweepTo: 900 })
      noise(c, { at: 0.16, dur: 0.22, gain: 0.16, freq: 1900, q: 0.5, sweepTo: 700 })
      tone(c, { freq: 120, to: 70, at: 0.3, dur: 0.1, gain: 0.25, type: 'sine' })
      break
    case 'interview':
      // Two knuckles on a door.
      tone(c, { freq: 190, to: 90, dur: 0.09, gain: 0.5, type: 'triangle' })
      noise(c, { dur: 0.06, gain: 0.18, freq: 500, q: 1.2 })
      tone(c, { freq: 180, to: 85, at: 0.14, dur: 0.09, gain: 0.42, type: 'triangle' })
      noise(c, { at: 0.14, dur: 0.06, gain: 0.15, freq: 500, q: 1.2 })
      break
    case 'messages':
      // Phone blip, two notes up.
      tone(c, { freq: 880, dur: 0.07, gain: 0.3, type: 'square' })
      tone(c, { freq: 1320, at: 0.07, dur: 0.1, gain: 0.26, type: 'square' })
      break
    case 'camera': {
      // Shutter, then the tape finding its speed.
      noise(c, { dur: 0.05, gain: 0.4, freq: 3200, q: 0.8 })
      noise(c, { at: 0.06, dur: 0.09, gain: 0.3, freq: 2200, q: 0.9 })
      tone(c, { freq: 60, to: 180, at: 0.02, dur: 0.22, gain: 0.18, type: 'sawtooth' })
      break
    }
    case 'canvass':
      // A drawer going over, low and dry.
      noise(c, { dur: 0.3, gain: 0.22, freq: 700, q: 0.4, sweepTo: 260 })
      tone(c, { freq: 150, to: 80, at: 0.22, dur: 0.12, gain: 0.3, type: 'triangle' })
      break
    case 'forensics':
      // Lab: a clean rising ping.
      tone(c, { freq: 700, to: 1500, dur: 0.18, gain: 0.26, type: 'sine' })
      tone(c, { freq: 2100, at: 0.12, dur: 0.22, gain: 0.12, type: 'sine' })
      break
    case 'note':
      tone(c, { freq: 520, to: 620, dur: 0.1, gain: 0.18, type: 'sine' })
      break
    case 'turn':
      // Your move: a soft two-note nudge.
      tone(c, { freq: 523, dur: 0.12, gain: 0.22, type: 'sine' })
      tone(c, { freq: 784, at: 0.1, dur: 0.18, gain: 0.2, type: 'sine' })
      break
    case 'accuse':
      // The room goes quiet. Low drone, no resolution.
      tone(c, { freq: 150, to: 110, dur: 0.7, gain: 0.3, type: 'sawtooth' })
      tone(c, { freq: 226, to: 150, dur: 0.7, gain: 0.12, type: 'sine' })
      break
    case 'rejected':
      // Thrown out: a flat buzz and a gavel.
      tone(c, { freq: 180, to: 90, dur: 0.3, gain: 0.35, type: 'sawtooth' })
      noise(c, { at: 0.26, dur: 0.12, gain: 0.3, freq: 420, q: 1.4 })
      break
    case 'solved':
      // Closed: a major triad, unhurried.
      tone(c, { freq: 392, dur: 0.5, gain: 0.26, type: 'triangle' })
      tone(c, { freq: 523, at: 0.13, dur: 0.5, gain: 0.24, type: 'triangle' })
      tone(c, { freq: 659, at: 0.26, dur: 0.7, gain: 0.24, type: 'triangle' })
      tone(c, { freq: 784, at: 0.4, dur: 0.9, gain: 0.18, type: 'sine' })
      break
    case 'failed':
      // Open: it falls away instead.
      tone(c, { freq: 330, dur: 0.4, gain: 0.26, type: 'triangle' })
      tone(c, { freq: 247, at: 0.2, dur: 0.5, gain: 0.24, type: 'triangle' })
      tone(c, { freq: 165, at: 0.42, dur: 0.9, gain: 0.26, type: 'sawtooth' })
      noise(c, { at: 0.42, dur: 0.6, gain: 0.1, freq: 300, q: 0.4 })
      break
  }
}

/** The cue a revealed clue should make, by the lead that surfaced it. */
export const CUE_FOR_LEAD: Record<string, Cue> = {
  interrogate: 'interview',
  messages: 'messages',
  cctv: 'camera',
  canvass: 'canvass',
  forensics: 'forensics',
}
