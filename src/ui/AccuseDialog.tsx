import { useEffect, useState } from 'react'
import { alreadyThrownOut } from '../game/engine'
import { getCase } from '../game/generator'
import type { Category, Solution } from '../game/types'
import type { RoomApi } from '../net/useRoom'
import { Button } from './bits'
import { play } from './sound'

export function AccuseDialog({ room, onClose }: { room: RoomApi; onClose: () => void }) {
  const { state, send, myId } = room
  const c = getCase(state.seed)
  const [pick, setPick] = useState<Partial<Solution>>({})

  const columns: Array<{ cat: Category; key: keyof Solution; title: string; items: Array<{ id: string; name: string }> }> = [
    { cat: 'suspect', key: 'suspect', title: 'Who', items: c.suspects },
    { cat: 'location', key: 'location', title: 'Where', items: c.locations },
    { cat: 'means', key: 'means', title: 'How', items: c.means },
  ]

  const complete = Boolean(pick.suspect && pick.location && pick.means)
  // A triple that has already collapsed cannot be put up again.
  const repeat = complete && alreadyThrownOut(state, pick as Solution)
  const lastShot = state.actionsLeft <= 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-4 sm:items-center">
      <div className="animate-rise w-full max-w-3xl rounded-lg border border-blood-600 bg-ink-850 p-5 shadow-2xl">
        <h2 className="font-display text-2xl text-ink-200">Make the accusation</h2>
        <p className="mt-1 text-sm text-ink-300">
          {state.players.length > 1
            ? 'Your partner has to sign off before it is official.'
            : 'There is nobody to talk you out of it.'}{' '}
          {lastShot
            ? 'You have no leads left to spend, so this one is final.'
            : 'Get it wrong and it costs a lead — the case stays open and you keep going.'}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.cat}>
              <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">{col.title}</h3>
              <ul className="space-y-1.5">
                {col.items.map((item) => {
                  const active = pick[col.key] === item.id
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          play('note')
                          setPick((p) => ({ ...p, [col.key]: item.id }))
                        }}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'border-blood-500 bg-blood-600/20 text-ink-200' : 'border-ink-600 text-ink-300 hover:border-ink-400'
                        }`}
                      >
                        {item.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {repeat && (
          <p className="animate-shake mt-4 rounded-md border border-blood-600 bg-blood-600/10 px-3 py-2 text-sm text-ink-200">
            You have already put that exact accusation up and it was thrown out. Change at least one of the three.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="quiet" onClick={onClose}>
            Back to the file
          </Button>
          <Button
            variant="danger"
            disabled={!complete || repeat}
            onClick={() => {
              send({ t: 'propose', playerId: myId, solution: pick as Solution })
              onClose()
            }}
          >
            Name them
          </Button>
        </div>
      </div>
    </div>
  )
}
