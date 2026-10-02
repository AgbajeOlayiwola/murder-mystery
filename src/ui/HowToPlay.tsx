import { Button, Panel } from './bits'
import { STEPS } from './steps'

/**
 * The full guide. Every claim here is checked against what the game does — the
 * steps come from the same list the board renders, and the answers below say
 * what is true of this game rather than what a storefront would like to say.
 */

const FAQ: Array<{ q: string; a: string[] }> = [
  {
    q: 'What is this game?',
    a: [
      'Cold Open is a two-detective deduction game. Every case has one killer, one room and one method, and the pair of you have to work out all three.',
      'You are each dealt private notes the other cannot see, and there are never enough turns to check everything on the board. The deduction is real: a solver proves every case has exactly one answer before it is dealt to you.',
    ],
  },
  {
    q: 'Do I need to create an account?',
    a: [
      'No. There is no sign-up, no email and no login.',
      'Your detective name and your private notes are kept in your own browser and are never sent anywhere.',
    ],
  },
  {
    q: 'Can I play on my phone?',
    a: [
      'Yes — it runs in any modern browser and the layout adapts down to a phone screen.',
      'One honest caveat: the sync that ships connects detectives on the same machine only, using two browser tabs. Two separate phones need a different sync adapter wired in — the interface is three methods wide and the README explains how.',
    ],
  },
  {
    q: 'How many cases are there?',
    a: [
      'Effectively unlimited. Every case number generates a complete case — cast, scene, method, clues and evidence — and each one is checked for a single possible answer before you see it.',
      'The lobby also lists featured cases if you would rather start from a named one, and hand-written cases can be added to the same registry.',
    ],
  },
  {
    q: 'Can I play with friends?',
    a: [
      'That is the only way to play it properly. Open a case, send your partner the five-character case number, and you both join the same investigation.',
      'Your dossiers deliberately differ, so the case cannot be closed without talking to each other. You can also play alone, with both hands of notes, if nobody is around.',
    ],
  },
  {
    q: 'What if I guess the wrong suspect?',
    a: [
      'The case stays open and you keep investigating. A collapsed accusation costs you one lead, and the same three names cannot be put up again.',
      'You are told that at least one of the three was wrong, but never which one — the count alone would do too much of your deducing for you. When the leads run out, the next accusation is your last.',
    ],
  },
  {
    q: 'Is my payment information secure?',
    a: [
      'There is nothing to secure: the game takes no payments. There is no checkout, no card form and no billing of any kind.',
      'Nothing you type is collected or transmitted — your name, notes and progress stay in your own browser.',
    ],
  },
  {
    q: 'Can I cancel my subscription?',
    a: ['There is no subscription. The game is free, has no paid tier, and there is nothing to cancel.'],
  },
]

export function HowToPlay({ onHome, inCase }: { onHome: () => void; inCase: boolean }) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-5 py-10">
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-[0.18em] text-ink-400 uppercase">
        <button onClick={onHome} className="transition-colors hover:text-brass-400">
          Home
        </button>
        <span className="px-2 text-ink-600">/</span>
        <span className="text-ink-300">How to Play</span>
      </nav>

      <header className="animate-rise mt-5">
        <h1 className="font-display text-5xl leading-tight text-ink-200">How to Play</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">
          Your complete guide to solving murder mystery cases like a pro.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-brass-500 uppercase">The six steps</h2>
        <ol className="mt-5 space-y-7">
          {STEPS.map((step, i) => (
            <li key={step.id} className="animate-rise flex gap-4" style={{ animationDelay: `${80 + i * 70}ms` }}>
              <span className="flex flex-col items-center">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brass-500/60 bg-brass-500/10 font-display text-lg text-brass-400">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && <span className="mt-1.5 w-px flex-1 bg-ink-700" aria-hidden />}
              </span>
              <div className="pb-1">
                <h3 className="text-base font-medium text-ink-200">{step.title}</h3>
                {step.guide.map((p, k) => (
                  <p key={k} className="mt-2 text-[13px] leading-relaxed text-ink-300">
                    {p}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-brass-500 uppercase">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-ink-700 overflow-hidden rounded-lg border border-ink-700 bg-ink-850/70">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm text-ink-200 transition-colors hover:bg-ink-800/60">
                {q}
                <span
                  className="shrink-0 font-mono text-[11px] text-ink-400 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="animate-rise space-y-2 px-4 pt-0 pb-4">
                {a.map((p, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-ink-300">
                    {p}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <Panel className="mt-12 text-center">
        <h2 className="font-display text-3xl text-ink-200">Ready to start your first investigation?</h2>
        <p className="mt-2 text-sm text-ink-300">Choose a case and put your detective skills to the test.</p>
        <div className="mt-5 flex justify-center">
          <Button variant="primary" onClick={onHome}>
            {inCase ? 'Back to your case' : 'Browse cases'}
          </Button>
        </div>
      </Panel>
    </main>
  )
}
