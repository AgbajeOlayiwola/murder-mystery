import { useEffect, useState } from 'react'
import { getCase } from '../game/generator'
import { entityName } from '../game/types'
import type { RoomApi } from '../net/useRoom'
import { Button, Panel } from './bits'
import { play } from './sound'

export function VerdictScreen({ room }: { room: RoomApi }) {
  const { state, send } = room
  const v = state.verdict
  const solved = v?.solved ?? false

  useEffect(() => {
    if (v) play(solved ? 'solved' : 'failed')
  }, [v, solved])

  const score = useCountUp(v?.score ?? 0)
  if (!v) return null
  const c = getCase(state.seed)

  const line = (s: typeof v.guess) =>
    `${entityName(c, { cat: 'suspect', id: s.suspect })}, in the ${entityName(c, {
      cat: 'location',
      id: s.location,
    })}, with the ${entityName(c, { cat: 'means', id: s.means })}.`

  const culprit = c.suspects.find((s) => s.id === v.actual.suspect)!

  return (
    <main className="relative z-10 mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-5 px-5 py-12">
      <header className="animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-brass-500">{c.title}</p>
        <h1 className={`animate-stamp mt-2 font-display text-5xl ${v.solved ? 'text-jade-400' : 'text-blood-500'}`}>
          {v.solved ? 'Case closed.' : v.hits === 0 ? 'You let them walk.' : 'Close. Not close enough.'}
        </h1>
      </header>

      <Panel title="What actually happened">
        <p className="text-lg leading-relaxed text-ink-200">{line(v.actual)}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-300">
          {culprit.name} — {culprit.occupation}, who {culprit.motive}.
        </p>
      </Panel>

      {!v.solved && (
        <Panel title="What you said">
          <p className="text-sm leading-relaxed text-ink-300">{line(v.guess)}</p>
          <p className="mt-2 font-mono text-xs text-ink-400">{v.hits} of 3 right</p>
        </Panel>
      )}

      <Panel title="Scorecard">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-4xl text-brass-400 tabular-nums">{score}</span>
          <span className="text-sm text-ink-400">
            {v.hits}/3 correct · {v.actionsLeft} leads unspent
            {v.thrownOut > 0 && ` · ${v.thrownOut} accusation${v.thrownOut > 1 ? 's' : ''} thrown out`}
          </span>
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={() => send({ t: 'returnToLobby' })}>
          Next case
        </Button>
        <Button variant="quiet" onClick={room.leave}>
          Leave
        </Button>
      </div>
    </main>
  )
}

/** Counts the final score up from zero, unless the player asked for less motion. */
function useCountUp(target: number, ms = 900): number {
  const [n, setN] = useState(target)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(target)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      // Ease out, so it lands rather than stops.
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])

  return n
}
