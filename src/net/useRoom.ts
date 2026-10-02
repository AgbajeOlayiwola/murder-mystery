import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fold, type GameEvent, type GameState } from '../game/engine'
import { createLocalAdapter } from './localAdapter'
import type { SyncAdapter } from './sync'

const ROOM_KEY = 'cold-open:room'
const PLAYER_KEY = 'cold-open:player'
const NAME_KEY = 'cold-open:name'

/**
 * Identity lives in sessionStorage, not localStorage, so two tabs on one
 * machine are two different detectives.
 */
function seatId(): string {
  let id = sessionStorage.getItem(PLAYER_KEY)
  if (!id) {
    id = `p-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(PLAYER_KEY, id)
  }
  return id
}

export function rememberedName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

export interface RoomApi {
  code: string | null
  myId: string
  state: GameState
  connecting: boolean
  connect(code: string, name: string): Promise<void>
  send(event: GameEvent): void
  leave(): void
}

export function useRoom(): RoomApi {
  const [code, setCode] = useState<string | null>(null)
  const [log, setLog] = useState<GameEvent[]>([])
  const [connecting, setConnecting] = useState(false)
  const adapter = useRef<SyncAdapter | null>(null)
  const myId = useMemo(seatId, [])
  const state = useMemo(() => fold(log), [log])

  const connect = useCallback(
    async (raw: string, name: string) => {
      const room = raw.trim().toUpperCase()
      if (!room) return
      setConnecting(true)
      const a = adapter.current ?? createLocalAdapter()
      adapter.current = a

      let latest: GameEvent[] = []
      await a.connect(room, (next) => {
        latest = next
        setLog(next)
      })

      const alreadySeated = fold(latest).players.some((p) => p.id === myId)
      a.append(alreadySeated ? { t: 'rename', playerId: myId, name } : { t: 'join', playerId: myId, name })

      sessionStorage.setItem(ROOM_KEY, room)
      localStorage.setItem(NAME_KEY, name)
      setCode(room)
      setConnecting(false)
    },
    [myId],
  )

  const send = useCallback((event: GameEvent) => adapter.current?.append(event), [])

  const leave = useCallback(() => {
    adapter.current?.disconnect()
    adapter.current = null
    sessionStorage.removeItem(ROOM_KEY)
    setCode(null)
    setLog([])
  }, [])

  // Rejoin the room after a refresh rather than dropping the player home.
  useEffect(() => {
    const saved = sessionStorage.getItem(ROOM_KEY)
    const name = rememberedName()
    if (saved && name) void connect(saved, name)
    return () => adapter.current?.disconnect()
  }, [connect])

  return { code, myId, state, connecting, connect, send, leave }
}
