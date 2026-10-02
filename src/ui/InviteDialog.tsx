import { useEffect, useState } from 'react'
import type { RoomApi } from '../net/useRoom'
import { Button } from './bits'

/** Step one, after the fact: the number a partner needs to join this case. */
export function InviteDialog({ room, onClose }: { room: RoomApi; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.code ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/85 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Case number"
        className="animate-rise w-full max-w-sm rounded-lg border border-ink-600 bg-ink-850 p-5 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[10px] tracking-[0.3em] text-ink-400 uppercase">Case number</p>
        <p className="mt-2 font-mono text-5xl tracking-[0.3em] text-brass-400">{room.code}</p>
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          Your partner joins with this. On one machine, open the same page in a second tab and join from there — each
          tab is its own detective.
        </p>
        <ul className="mt-4 space-y-1">
          {room.state.players.map((p) => (
            <li key={p.id} className="text-sm text-ink-300">
              {p.name}
              {p.id === room.myId && <span className="ml-2 font-mono text-[10px] tracking-widest text-brass-500 uppercase">you</span>}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="primary" onClick={copy}>
            {copied ? 'Copied' : 'Copy number'}
          </Button>
          <Button variant="quiet" onClick={onClose}>
            Back to the case
          </Button>
        </div>
      </div>
    </div>
  )
}
