import type { GameEvent } from '../game/engine'
import type { SyncAdapter } from './sync'

const key = (room: string) => `cold-open:room:${room.toUpperCase()}`
const channelName = (room: string) => `cold-open:${room.toUpperCase()}`

function readLog(room: string): GameEvent[] {
  try {
    const raw = localStorage.getItem(key(room))
    return raw ? (JSON.parse(raw) as GameEvent[]) : []
  } catch {
    return []
  }
}

/**
 * Same-device transport: the log lives in localStorage and BroadcastChannel
 * wakes the other tabs. Good for two players on one machine, or one player
 * testing both seats. For two devices, drop in a remote adapter with the same
 * interface — see README.
 */
export function createLocalAdapter(): SyncAdapter {
  let room = ''
  let channel: BroadcastChannel | null = null
  let emit: (log: GameEvent[]) => void = () => {}

  const push = () => emit(readLog(room))
  const onStorage = (e: StorageEvent) => {
    if (e.key === key(room)) push()
  }

  return {
    kind: 'local',
    async connect(nextRoom, onLog) {
      this.disconnect()
      room = nextRoom.toUpperCase()
      emit = onLog
      channel = new BroadcastChannel(channelName(room))
      channel.onmessage = push
      window.addEventListener('storage', onStorage)
      push()
    },
    append(event) {
      if (!room) return
      const log = [...readLog(room), event]
      localStorage.setItem(key(room), JSON.stringify(log))
      emit(log)
      channel?.postMessage('changed')
    },
    disconnect() {
      channel?.close()
      channel = null
      window.removeEventListener('storage', onStorage)
      room = ''
    },
  }
}

export function roomExists(room: string): boolean {
  return localStorage.getItem(key(room)) !== null
}
