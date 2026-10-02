import { STEPS, type StepId, type StepState } from './steps'

/**
 * The six steps of an investigation, as a working control rather than a
 * decoration: each one says where you are, and clicking it takes you there.
 */
export function StepRail({
  states,
  focus,
  onPick,
}: {
  states: Record<StepId, StepState>
  focus: StepId | null
  onPick: (id: StepId) => void
}) {
  const done = STEPS.filter((s) => states[s.id] === 'done').length

  return (
    <nav aria-label="Investigation steps" className="relative mb-5">
      {/* The line the steps sit on, filled as far as you have got. */}
      <div className="absolute top-[18px] right-0 left-0 hidden h-px bg-ink-700 lg:block" aria-hidden>
        <div
          className="h-px bg-brass-500/70 transition-[width] duration-700 ease-out"
          style={{ width: `${(done / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((step, i) => {
          const st = states[step.id]
          const focused = focus === step.id
          return (
            <li key={step.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <button
                onClick={() => onPick(step.id)}
                aria-current={st === 'active' ? 'step' : undefined}
                className={`group relative h-full w-full rounded-lg border p-2.5 text-left transition-colors ${
                  focused
                    ? 'border-brass-500 bg-brass-500/10'
                    : st === 'active'
                      ? 'border-ink-600 bg-ink-850/80'
                      : 'border-ink-700 bg-ink-850/40 hover:border-ink-600'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors ${
                      st === 'done'
                        ? 'border-jade-500 bg-jade-500/20 text-jade-400'
                        : st === 'active'
                          ? 'animate-pulse-soft border-brass-500 bg-brass-500/20 text-brass-400'
                          : 'border-ink-600 bg-ink-900 text-ink-400'
                    }`}
                  >
                    {st === 'done' ? '✓' : i + 1}
                  </span>
                  <span className={`text-[12px] leading-tight font-medium ${st === 'todo' ? 'text-ink-400' : 'text-ink-200'}`}>
                    {step.title}
                  </span>
                </span>
                <span className="mt-1.5 block text-[11px] leading-snug text-ink-400">{step.blurb}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
