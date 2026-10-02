import { useEffect, useState } from 'react'
import type { Clue, Evidence } from '../game/types'
import { Button } from './bits'
import { CctvStill, cameraNumber } from './CctvStill'

type Thread = Extract<Evidence, { kind: 'messages' }>
type Footage = Extract<Evidence, { kind: 'cctv' }>

/** Renders a clue as whatever it actually is — a note, a thread, or footage. */
export function ClueView({ clue }: { clue: Clue }) {
  const ev = clue.evidence
  if (!ev) return <p className="text-sm leading-relaxed text-ink-200">{clue.text}</p>
  if (ev.kind === 'messages') return <MessageThread ev={ev} />
  return <FootageReel ev={ev} />
}

// ------------------------------------------------------------------ messages

function initials(name: string): string {
  return name
    .replace(/\./g, '')
    .split(' ')
    .filter((w) => w && w[0] === w[0].toUpperCase())
    .slice(-2)
    .map((w) => w[0])
    .join('')
}

function MessageThread({ ev }: { ev: Thread }) {
  const owner = ev.ownerName ?? 'Victim'
  const lastOutgoing = ev.thread.map((m) => m.from).lastIndexOf('victim')

  return (
    <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900/80">
      <div className="flex items-center gap-2.5 border-b border-ink-700 bg-ink-850 px-3 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-700 font-mono text-[10px] text-ink-200">
          {initials(ev.withName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-ink-200">{ev.withName}</span>
          <span className="block font-mono text-[9px] uppercase tracking-widest text-ink-400">
            {owner}’s phone · {ev.when}
          </span>
        </span>
      </div>

      <div className="space-y-1.5 p-2.5">
        {ev.thread.map((m, i) => {
          const mine = m.from === 'victim'
          return (
            <div key={i} className={`flex ${mine ? 'justify-end pl-8' : 'justify-start pr-8'}`}>
              <div
                className={`max-w-full rounded-2xl px-3 py-1.5 ${
                  mine ? 'rounded-br-sm bg-brass-500/20' : 'rounded-bl-sm bg-ink-700/80'
                } ${m.key ? 'ring-1 ring-brass-400/60' : ''}`}
              >
                {m.deleted ? (
                  <span className="text-[13px] italic text-ink-400">⊘ This message was deleted</span>
                ) : (
                  <span className="text-[13px] leading-snug text-ink-200">{m.text}</span>
                )}
                <span className={`mt-0.5 block font-mono text-[9px] text-ink-400 ${mine ? 'text-right' : ''}`}>
                  {m.at}
                  {i === lastOutgoing && ' · Read'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -------------------------------------------------------------------- footage

function FootageReel({ ev }: { ev: Footage }) {
  const keyIndex = Math.max(0, ev.entries.findIndex((e) => e.key))
  const [selected, setSelected] = useState(keyIndex)
  const [enlarged, setEnlarged] = useState(false)
  const entry = ev.entries[selected]

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
        CAM {cameraNumber(ev.camera)} · {ev.camera}
      </p>

      {entry?.shot && (
        <button
          className="group relative mt-2 block w-full overflow-hidden rounded-md border border-ink-700"
          onClick={() => setEnlarged(true)}
          title="Enlarge"
        >
          <CctvStill view={ev.view} shot={entry.shot} camera={ev.camera} at={entry.at} />
          <span className="absolute right-1.5 bottom-6 rounded bg-ink-950/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-ink-300 opacity-0 transition-opacity group-hover:opacity-100">
            Enlarge
          </span>
        </button>
      )}

      <ol className="mt-2 space-y-1">
        {ev.entries.map((e, i) => (
          <li key={i}>
            <button
              onClick={() => setSelected(i)}
              className={`flex w-full gap-2.5 rounded-md border p-1.5 text-left transition-colors ${
                i === selected ? 'border-ink-600 bg-ink-800' : 'border-transparent hover:bg-ink-800/60'
              }`}
            >
              {e.shot && (
                <span className="w-14 shrink-0 overflow-hidden rounded-sm">
                  <CctvStill view={ev.view} shot={e.shot} camera={ev.camera} at={e.at} compact />
                </span>
              )}
              <span className="min-w-0">
                <span className={`block font-mono text-[11px] ${e.key ? 'text-brass-400' : 'text-jade-400'}`}>{e.at}</span>
                <span className={`block text-[12px] leading-snug ${e.key ? 'text-ink-200' : 'text-ink-400'}`}>{e.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {enlarged && (
        <FootageViewer ev={ev} index={selected} onIndex={setSelected} onClose={() => setEnlarged(false)} />
      )}
    </div>
  )
}

function FootageViewer({
  ev,
  index,
  onIndex,
  onClose,
}: {
  ev: Footage
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const frames = ev.entries.length
  const entry = ev.entries[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex(Math.min(frames - 1, index + 1))
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [frames, index, onClose, onIndex])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={onClose}>
      <div
        className="animate-rise w-full max-w-4xl rounded-lg border border-ink-600 bg-ink-850 p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`CCTV footage, ${ev.camera}`}
      >
        {entry?.shot && (
          <div className="overflow-hidden rounded-md border border-ink-700">
            <CctvStill view={ev.view} shot={entry.shot} camera={ev.camera} at={entry.at} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm leading-snug text-ink-200">
            <span className={`mr-2 font-mono ${entry?.key ? 'text-brass-400' : 'text-jade-400'}`}>{entry?.at}</span>
            {entry?.text}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="quiet" disabled={index === 0} onClick={() => onIndex(index - 1)}>
              ←
            </Button>
            <span className="px-1 font-mono text-[11px] text-ink-400">
              {index + 1}/{frames}
            </span>
            <Button variant="quiet" disabled={index === frames - 1} onClick={() => onIndex(index + 1)}>
              →
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
