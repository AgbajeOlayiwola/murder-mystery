import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../game/types'

export type Mark = 'none' | 'cleared' | 'flagged'

const CYCLE: Record<Mark, Mark> = { none: 'cleared', cleared: 'flagged', flagged: 'none' }

/**
 * Each detective's own scratch marks. Deliberately not synced — half the game
 * is telling your partner what you think you know.
 */
export function useNotebook(room: string, seed: string) {
  const key = `cold-open:notebook:${room}:${seed}`
  const [marks, setMarks] = useState<Record<string, Mark>>({})

  useEffect(() => {
    try {
      setMarks(JSON.parse(sessionStorage.getItem(key) ?? '{}'))
    } catch {
      setMarks({})
    }
  }, [key])

  const cycle = useCallback(
    (cat: Category, id: string) => {
      setMarks((prev) => {
        const next = { ...prev, [`${cat}:${id}`]: CYCLE[prev[`${cat}:${id}`] ?? 'none'] }
        sessionStorage.setItem(key, JSON.stringify(next))
        return next
      })
    },
    [key],
  )

  const markOf = useCallback((cat: Category, id: string): Mark => marks[`${cat}:${id}`] ?? 'none', [marks])

  /** How much of the board you have actually made your mind up about. */
  const marked = Object.values(marks).filter((m) => m !== 'none').length

  return { markOf, cycle, marked }
}
