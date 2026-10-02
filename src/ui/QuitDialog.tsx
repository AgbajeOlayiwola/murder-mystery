import { useEffect } from 'react'
import type { RoomApi } from '../net/useRoom'
import { Button } from './bits'

/**
 * Walking away, with the two things that actually differ spelled out: closing
 * the file ends the case for both detectives, leaving the room only removes
 * you. Neither is hidden behind the accusation flow.
 */
export function QuitDialog({ room, onClose }: { room: RoomApi; onClose: () => void }) {
  const { send, state } = room
  const partnered = state.players.length > 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/85 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Leave the case"
        className="animate-rise w-full max-w-md rounded-lg border border-ink-600 bg-ink-850 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-ink-200">Give up on this one?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-300">
          Nobody gets named and nothing is scored. The killer stays out there, which is how most of them end.
        </p>

        <div className="mt-5 space-y-2">
          <button
            onClick={() => {
              send({ t: 'returnToLobby' })
              onClose()
            }}
            className="w-full rounded-md border border-ink-600 p-3 text-left transition-colors hover:border-brass-500 hover:bg-brass-500/5"
          >
            <span className="block text-sm font-medium text-ink-200">Close the case file</span>
            <span className="mt-0.5 block text-xs leading-snug text-ink-400">
              {partnered
                ? 'Back to the lobby for both of you, where you can pick another case.'
                : 'Back to the lobby, where you can pick another case.'}
            </span>
          </button>

          <button
            onClick={() => {
              room.leave()
              onClose()
            }}
            className="w-full rounded-md border border-ink-600 p-3 text-left transition-colors hover:border-blood-500 hover:bg-blood-600/10"
          >
            <span className="block text-sm font-medium text-ink-200">Leave the room</span>
            <span className="mt-0.5 block text-xs leading-snug text-ink-400">
              {partnered
                ? 'Only you walk out. Your partner stays with the case open.'
                : 'Back to the front door. The case number still works if you come back.'}
            </span>
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="quiet" onClick={onClose}>
            Keep investigating
          </Button>
        </div>
      </div>
    </div>
  )
}
