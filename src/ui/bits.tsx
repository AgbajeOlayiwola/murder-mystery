import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'quiet'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brass-500 text-ink-950 hover:bg-brass-400 border-brass-500',
  ghost: 'bg-ink-800 text-ink-200 hover:bg-ink-700 border-ink-600',
  danger: 'bg-blood-600 text-white hover:bg-blood-500 border-blood-600',
  quiet: 'bg-transparent text-ink-300 hover:text-ink-200 hover:bg-ink-800 border-transparent',
}

export function Button({
  variant = 'ghost',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-ink-700 bg-ink-850/80 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-ink-700 px-4 py-2.5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-400">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'warn' | 'good' }) {
  const tones = {
    default: 'border-ink-600 text-ink-300',
    warn: 'border-blood-600 text-blood-500',
    good: 'border-jade-500 text-jade-400',
  }
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  uppercase,
  onEnter,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  uppercase?: boolean
  onEnter?: () => void
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.()
        }}
        className={`w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2.5 text-ink-200 outline-none placeholder:text-ink-400/60 focus:border-brass-500 ${
          uppercase ? 'font-mono text-lg tracking-[0.3em]' : ''
        }`}
      />
    </label>
  )
}
