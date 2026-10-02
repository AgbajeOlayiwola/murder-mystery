/**
 * Seeded RNG. Both clients generate the identical case from the room seed, so
 * only tiny action events ever cross the wire.
 */

export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Rng {
  next(): number
  int(maxExclusive: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  sample<T>(items: readonly T[], n: number): T[]
}

export function makeRng(seed: string): Rng {
  let a = hashSeed(seed)
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (maxExclusive: number) => Math.floor(next() * maxExclusive)
  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  return {
    next,
    int,
    pick: (items) => items[int(items.length)],
    shuffle,
    sample: (items, n) => shuffle(items).slice(0, n),
  }
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Human-readable room code, ambiguous characters removed. */
export function randomRoomCode(length = 5): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('')
}
