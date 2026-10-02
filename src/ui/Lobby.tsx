import { useState } from 'react'
import { FEATURED_SEEDS } from '../game/featured'
import { getCase } from '../game/generator'
import { randomRoomCode } from '../game/rng'
import { DIFFICULTY, type Difficulty } from '../game/types'
import type { RoomApi } from '../net/useRoom'
import { Button, Panel } from './bits'

const LEVELS = Object.keys(DIFFICULTY) as Difficulty[]

const FEATURED = FEATURED_SEEDS.map((seed) => {
  const c = getCase(seed)
  return { seed, title: c.title, victim: `${c.victim.name}, ${c.victim.detail}` }
})

export function Lobby({ room }: { room: RoomApi }) {
  const { state, send, code, myId } = room
  const [copied, setCopied] = useState(false)
  // null means a fresh random case; every case number generates a valid one.
  const [pick, setPick] = useState<string | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-5 px-5 py-12">
      <Panel title="Case number" action={<Button variant="quiet" onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>}>
        <p className="font-mono text-5xl tracking-[0.3em] text-brass-400">{code}</p>
        <p className="mt-3 text-xs text-ink-400">
          Your partner joins with this. On one machine, open a second tab and join from there.
        </p>
      </Panel>

      <Panel title={`Detectives (${state.players.length})`}>
        <ul className="space-y-2">
          {state.players.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-ink-400">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-ink-200">{p.name}</span>
              {p.id === myId && <span className="font-mono text-[10px] uppercase tracking-widest text-brass-500">you</span>}
            </li>
          ))}
          {state.players.length < 2 && (
            <li className="text-sm text-ink-400">Waiting for a partner… you can also start alone.</li>
          )}
        </ul>
      </Panel>

      <Panel title="Choose a case">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setPick(null)}
            className={`rounded-md border p-3 text-left transition-colors ${
              pick === null ? 'border-brass-500 bg-brass-500/10' : 'border-ink-600 hover:border-ink-400'
            }`}
          >
            <span className="block text-sm font-medium text-ink-200">A case nobody has worked</span>
            <span className="mt-1 block text-xs leading-snug text-ink-400">
              Dealt from a random number. Checked solvable before you see it.
            </span>
          </button>

          {FEATURED.map((f) => (
            <button
              key={f.seed}
              onClick={() => setPick(f.seed)}
              className={`rounded-md border p-3 text-left transition-colors ${
                pick === f.seed ? 'border-brass-500 bg-brass-500/10' : 'border-ink-600 hover:border-ink-400'
              }`}
            >
              <span className="block text-sm font-medium text-ink-200">{f.title}</span>
              <span className="mt-1 block text-xs leading-snug text-ink-400">{f.victim}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="How cold is it">
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((level) => {
            const d = DIFFICULTY[level]
            const active = state.difficulty === level
            return (
              <button
                key={level}
                onClick={() => send({ t: 'setDifficulty', difficulty: level })}
                className={`rounded-md border p-3 text-left transition-colors ${
                  active ? 'border-brass-500 bg-brass-500/10' : 'border-ink-600 hover:border-ink-400'
                }`}
              >
                <span className="block text-sm font-medium text-ink-200">{d.label}</span>
                <span className="mt-1 block font-mono text-[11px] text-brass-500">{d.actions} leads</span>
                <span className="mt-1 block text-xs text-ink-400">{d.blurb}</span>
              </button>
            )
          })}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => send({ t: 'start', seed: pick ?? randomRoomCode(8) })}>
          Open the file
        </Button>
        <Button variant="quiet" onClick={room.leave}>
          Leave
        </Button>
      </div>
    </main>
  )
}
