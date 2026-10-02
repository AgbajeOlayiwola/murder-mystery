import { useEffect, useState } from 'react'
import { Home } from './ui/Home'
import { HowToPlay } from './ui/HowToPlay'
import { Investigation } from './ui/Investigation'
import { Lobby } from './ui/Lobby'
import { VerdictScreen } from './ui/Verdict'
import { useRoom } from './net/useRoom'

/** The guide is the only other page, so the whole router is one hash. */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash.replace(/^#/, ''))
  useEffect(() => {
    const onHash = () => setHash(window.location.hash.replace(/^#/, ''))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return hash
}

export default function App() {
  const room = useRoom()
  const route = useHashRoute()

  // Rendered instead of the game, never unmounting the room, so stepping out to
  // read the rules does not drop you out of an open case.
  if (route === 'how-to-play') {
    return <HowToPlay inCase={Boolean(room.code)} onHome={() => (window.location.hash = '')} />
  }

  if (!room.code) return <Home onEnter={room.connect} connecting={room.connecting} />
  if (room.state.phase === 'lobby') return <Lobby room={room} />
  if (room.state.phase === 'verdict') return <VerdictScreen room={room} />
  return <Investigation room={room} />
}
