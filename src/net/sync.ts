import type { GameEvent } from '../game/engine'

/**
 * The only thing multiplayer needs: an ordered, append-only log of events that
 * every participant sees. Swap the adapter to change transport — the game does
 * not know or care which one is in use.
 */
export interface SyncAdapter {
  readonly kind: string
  connect(room: string, onLog: (log: GameEvent[]) => void): Promise<void>
  append(event: GameEvent): void
  disconnect(): void
}
