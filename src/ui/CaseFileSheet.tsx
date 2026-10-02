import { useEffect } from 'react'
import type { CaseFile } from '../game/types'
import { Button } from './bits'
import { play } from './sound'

/**
 * Step one: the police report. Deliberately carries no deducible fact — it sets
 * out what happened, where and when, so the board means something when you get
 * to it.
 */
export function CaseFileSheet({ c, onClose }: { c: CaseFile; onClose: () => void }) {
  useEffect(() => {
    play('file')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const r = c.report
  let line = 0
  const delay = () => ({ animationDelay: `${90 + line++ * 55}ms` })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 p-4 sm:items-center">
      <div
        role="dialog"
        aria-label="Case file"
        className="animate-rise my-auto w-full max-w-2xl rounded-lg border border-ink-600 bg-ink-850 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-700 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500">
              Case file{r ? ` · ${r.reference}` : ''}
            </p>
            <h2 className="mt-1 font-display text-3xl text-ink-200">{c.title}</h2>
          </div>
          <span className="rounded border border-blood-600 px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-blood-500">
            OPEN
          </span>
        </header>

        <div className="space-y-4 px-5 py-4">
          <p className="animate-rise text-sm leading-relaxed text-ink-200" style={delay()}>
            <span className="text-brass-400">{c.victim.name}</span> — {c.victim.detail}.
          </p>
          <p className="animate-rise text-sm leading-relaxed text-ink-300" style={delay()}>
            {c.blurb}
          </p>

          {r && (
            <>
              <dl className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
                {[
                  ['Called in', `${r.calledIn} by ${r.calledBy}`],
                  ['First unit', r.firstUnit],
                  ['Conditions', r.weather],
                  ['Pathology', r.pathology],
                ].map(([k, v]) => (
                  <div key={k} className="animate-rise" style={delay()}>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-400">{k}</dt>
                    <dd className="mt-0.5 text-[13px] leading-snug text-ink-200">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="animate-rise rounded-md border border-ink-700 bg-ink-900/60 p-3" style={delay()}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">At the scene</p>
                <ul className="mt-2 space-y-1.5">
                  {r.scene.map((s, i) => (
                    <li key={i} className="animate-rise flex gap-2 text-[13px] leading-snug text-ink-300" style={delay()}>
                      <span className="text-ink-600">—</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div className="animate-rise grid gap-3 sm:grid-cols-3" style={delay()}>
            {[
              { title: 'In the house', items: c.suspects.map((s) => `${s.name}, ${s.occupation}`) },
              { title: 'Rooms in play', items: c.locations.map((p) => p.name) },
              { title: 'Possible means', items: c.means.map((m) => m.name) },
            ].map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">{col.title}</p>
                <ul className="mt-1.5 space-y-1">
                  {col.items.map((item) => (
                    <li key={item} className="text-[12px] leading-snug text-ink-300">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="animate-rise text-xs leading-relaxed text-ink-400" style={delay()}>
            Nothing in this report rules anybody in or out. That is what the leads are for — and your partner holds
            notes you will never see.
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-ink-700 px-5 py-3">
          <Button variant="primary" onClick={onClose}>
            Start the investigation
          </Button>
        </footer>
      </div>
    </div>
  )
}
