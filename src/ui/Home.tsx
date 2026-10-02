import { useState } from 'react'
import { randomRoomCode } from '../game/rng'
import { rememberedName } from '../net/useRoom'
import { Button, Field } from './bits'
import { STEPS } from './steps'

export function Home({
  onEnter,
  connecting,
}: {
  onEnter: (code: string, name: string) => void
  connecting: boolean
}) {
  const [name, setName] = useState(rememberedName())
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'choose' | 'join'>('choose')

  const trimmed = name.trim()
  const create = () => trimmed && onEnter(randomRoomCode(), trimmed)
  const join = () => trimmed && code.trim().length >= 4 && onEnter(code, trimmed)

  return (
    <main className="relative z-10 mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-8 px-5 py-12">
      <header className="animate-rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-brass-500">A two-detective mystery</p>
        <h1 className="mt-2 font-display text-6xl leading-[0.95] text-ink-200">
          Cold
          <br />
          Open
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">
          A big house in Lagos, a body before midnight, and a compound full of people who were all somewhere else. One
          killer, one room, one method. You each hold case notes the other cannot see, and you do not have enough time
          to check everything. Talk it through, then name them.
        </p>
      </header>

      <div className="animate-rise space-y-4 rounded-lg border border-ink-700 bg-ink-850/80 p-5">
        <Field label="Your name" value={name} onChange={setName} placeholder="Det. …" maxLength={20} onEnter={create} />

        {mode === 'choose' ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" className="flex-1" disabled={!trimmed || connecting} onClick={create}>
              Open a new case
            </Button>
            <Button className="flex-1" disabled={!trimmed} onClick={() => setMode('join')}>
              Join your partner
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Field
              label="Case number"
              value={code}
              onChange={setCode}
              placeholder="ABC12"
              maxLength={5}
              uppercase
              onEnter={join}
            />
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" disabled={code.trim().length < 4 || connecting} onClick={join}>
                Join
              </Button>
              <Button variant="quiet" onClick={() => setMode('choose')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-400">
        Playing on one machine? Open the case, then open the same URL in a second browser tab and join with the case
        number — each tab is its own detective.{' '}
        <a href="#how-to-play" className="text-brass-500 underline-offset-2 hover:underline">
          Read the full guide
        </a>
        .
      </p>

      <HowItWorks />
    </main>
  )
}

function HowItWorks() {
  return (
    <section className="border-t border-ink-700 pt-8">
      <h2 className="font-display text-2xl text-ink-200">How it works</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">
        Every case follows a real investigation process. No random guessing — just detective work, and a partner who
        knows what you do not.
      </p>

      <ol className="mt-6 space-y-5">
        {STEPS.map((step, i) => (
          <li key={step.id} className="animate-rise flex gap-4" style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="relative flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brass-500/60 bg-brass-500/10 font-mono text-xs text-brass-400">
                {i + 1}
              </span>
              {i < STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-700" aria-hidden />}
            </span>
            <span className="pb-1">
              <span className="block text-sm font-medium text-ink-200">{step.title}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-ink-400">{step.guide[0]}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-xs text-ink-400">
        <a href="#how-to-play" className="text-brass-500 underline-offset-2 hover:underline">
          How to play — the complete guide
        </a>
      </p>
    </section>
  )
}
