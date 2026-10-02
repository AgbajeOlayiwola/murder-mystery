import { useEffect, useMemo, useRef, useState } from 'react'
import { dossierFor, findLeadClue, knownFacts } from '../game/engine'
import { getCase } from '../game/generator'
import { livePerCategory } from '../game/solver'
import { LEAD_KINDS, LEAD_SHORT, type Category, type Clue, type LeadKind } from '../game/types'
import type { RoomApi } from '../net/useRoom'
import { AccuseDialog } from './AccuseDialog'
import { Button, Panel, Pill } from './bits'
import { CaseFileSheet } from './CaseFileSheet'
import { ClueView } from './ClueView'
import { InviteDialog } from './InviteDialog'
import { QuitDialog } from './QuitDialog'
import { StepRail } from './StepRail'
import { STEPS, type StepId, type StepState } from './steps'
import { CUE_FOR_LEAD, isMuted, play, setMuted } from './sound'
import { useNotebook, type Mark } from './useNotebook'

const MARK_STYLE: Record<Mark, string> = {
  none: 'border-ink-700 bg-ink-850/70',
  cleared: 'border-ink-700 bg-ink-900/60 opacity-45',
  flagged: 'border-brass-500 bg-brass-500/10',
}

/** Step two is everything but talking to people; step three is talking to people. */
const EVIDENCE_KINDS: LeadKind[] = ['messages', 'cctv', 'canvass', 'forensics']

export function Investigation({ room }: { room: RoomApi }) {
  const { state, send, myId, code } = room
  const c = getCase(state.seed)
  const notebook = useNotebook(code ?? '', state.seed)
  const [tab, setTab] = useState<'dossier' | 'log'>('dossier')
  const [autoCross, setAutoCross] = useState(false)
  const [accusing, setAccusing] = useState(false)
  const [focus, setFocus] = useState<StepId | null>(null)
  const [muted, setMutedState] = useState(isMuted)
  const [quitting, setQuitting] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Step one is per detective and per case, not shared: your partner reading
  // the file does not mean you have.
  const fileKey = `cold-open:file-read:${code}:${state.seed}`
  const [fileRead, setFileRead] = useState(() => sessionStorage.getItem(fileKey) === '1')
  const [sheetOpen, setSheetOpen] = useState(!fileRead)

  const dossier = dossierFor(c, state, myId)
  const facts = useMemo(() => knownFacts(c, state, myId), [c, state, myId])
  const live = useMemo(() => livePerCategory(c, facts), [c, facts])

  const revealed: Array<{ clue: Clue; by: string }> = state.revealed
    .map((r) => ({
      clue: c.clues.find((cl) => cl.id === r.clueId),
      by: state.players.find((p) => p.id === r.byPlayerId)?.name ?? '?',
    }))
    .filter((x): x is { clue: Clue; by: string } => Boolean(x.clue))

  const myTurn = state.players[state.turnIndex]?.id === myId
  const onTheClock = state.players[state.turnIndex]?.name ?? '—'
  const outOfTime = state.actionsLeft <= 0
  const proposal = state.proposal
  const iAgreed = proposal?.agreed.includes(myId) ?? false
  const newestClueId = revealed[revealed.length - 1]?.clue.id

  // A new clue is worth looking at — messages and footage especially — so
  // surface it for both detectives, and let each kind of lead make its own noise.
  const seenCount = useRef(state.revealed.length)
  useEffect(() => {
    if (state.revealed.length > seenCount.current) {
      setTab('log')
      const last = state.revealed[state.revealed.length - 1]
      const clue = c.clues.find((cl) => cl.id === last?.clueId)
      play(clue?.lead ? (CUE_FOR_LEAD[clue.lead.kind] ?? 'note') : 'note')
    }
    seenCount.current = state.revealed.length
  }, [state.revealed, c])

  const wasMyTurn = useRef(myTurn)
  useEffect(() => {
    if (myTurn && !wasMyTurn.current && state.players.length > 1) play('turn')
    wasMyTurn.current = myTurn
  }, [myTurn, state.players.length])

  const hadProposal = useRef(Boolean(proposal))
  useEffect(() => {
    if (proposal && !hadProposal.current) play('accuse')
    hadProposal.current = Boolean(proposal)
  }, [proposal])

  const thrownOutCount = useRef(state.thrownOut.length)
  useEffect(() => {
    if (state.thrownOut.length > thrownOutCount.current) play('rejected')
    thrownOutCount.current = state.thrownOut.length
  }, [state.thrownOut.length])

  const readFile = () => {
    setSheetOpen(false)
    setFileRead(true)
    sessionStorage.setItem(fileKey, '1')
    setFocus('evidence')
  }

  const kindsRevealed = new Set(revealed.map(({ clue }) => clue.lead?.kind).filter((k): k is LeadKind => Boolean(k)))
  const stepStates: Record<StepId, StepState> = {
    open: 'done',
    file: fileRead ? 'done' : 'active',
    evidence: EVIDENCE_KINDS.some((k) => kindsRevealed.has(k)) ? 'done' : fileRead ? 'active' : 'todo',
    notes: notebook.marked > 0 ? 'done' : fileRead ? 'active' : 'todo',
    people: kindsRevealed.has('interrogate') ? 'done' : fileRead ? 'active' : 'todo',
    verdict: proposal || outOfTime ? 'active' : 'todo',
  }

  const pickStep = (id: StepId) => {
    if (id === 'open') return setInviting(true)
    if (id === 'file') return setSheetOpen(true)
    if (id === 'verdict') return setAccusing(true)
    if (id === 'notes') setTab('dossier')
    setFocus((f) => (f === id ? null : id))
  }

  const stepNumber = (id: StepId) => STEPS.findIndex((s) => s.id === id) + 1
  const hint =
    focus === 'evidence'
      ? 'Forensics, footage, messages and room searches are lit up below.'
      : focus === 'people'
        ? 'Interviews are lit up below. Everything else is dimmed.'
        : focus === 'notes'
          ? 'Click any name, room or method to mark it cleared, then flagged. Your partner never sees these marks.'
          : null

  const columns: Array<{ cat: Category; title: string; items: Array<{ id: string; name: string; sub: string }> }> = [
    { cat: 'suspect', title: 'Suspects', items: c.suspects.map((s) => ({ id: s.id, name: s.name, sub: s.occupation })) },
    { cat: 'location', title: 'Scene', items: c.locations.map((p) => ({ id: p.id, name: p.name, sub: p.note })) },
    { cat: 'means', title: 'Method', items: c.means.map((m) => ({ id: m.id, name: m.name, sub: m.note })) },
  ]

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-200">{c.title}</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-300">
            <span className="text-ink-200">{c.victim.name}</span>, {c.victim.detail}. {c.blurb}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={state.actionsLeft <= 2 ? 'warn' : 'default'}>{state.actionsLeft} leads left</Pill>
          <span className={myTurn ? 'animate-pulse-soft' : ''}>
            <Pill tone={myTurn ? 'good' : 'default'}>{myTurn ? 'Your move' : `${onTheClock}'s move`}</Pill>
          </span>
          <Button
            variant="quiet"
            aria-pressed={!muted}
            title={muted ? 'Sound off' : 'Sound on'}
            className="!px-2"
            onClick={() => {
              const next = !muted
              setMuted(next)
              setMutedState(next)
              if (!next) play('note')
            }}
          >
            {muted ? '🔇' : '🔊'}
          </Button>
          <Button variant="quiet" title="How to play" className="!px-2" onClick={() => (window.location.hash = 'how-to-play')}>
            ?
          </Button>
          <Button variant="quiet" onClick={() => setQuitting(true)}>
            Quit
          </Button>
          <Button variant="danger" onClick={() => setAccusing(true)}>
            Name them
          </Button>
        </div>
      </header>

      <StepRail states={stepStates} focus={focus} onPick={pickStep} />

      {focus && hint ? (
        <p className="animate-rise mb-4 flex items-center justify-between gap-3 rounded-lg border border-brass-500/40 bg-brass-500/5 px-4 py-2 text-sm text-ink-300">
          <span>
            <span className="text-brass-400">Step {stepNumber(focus)}.</span> {hint}
          </span>
          <button
            className="shrink-0 font-mono text-[11px] text-ink-400 hover:text-ink-200"
            onClick={() => setFocus(null)}
          >
            Show all
          </button>
        </p>
      ) : null}

      {proposal && (
        <div className="animate-rise mb-5 rounded-lg border border-blood-600 bg-blood-600/10 p-4">
          <p className="text-sm text-ink-200">
            <span className="font-medium">{state.players.find((p) => p.id === proposal.byPlayerId)?.name}</span> wants to
            close the case:{' '}
            <span className="text-brass-400">
              {name(c, 'suspect', proposal.solution.suspect)}, in the {name(c, 'location', proposal.solution.location)},
              with the {name(c, 'means', proposal.solution.means)}.
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" disabled={iAgreed} onClick={() => send({ t: 'agree', playerId: myId })}>
              {iAgreed ? 'Waiting for your partner' : 'Sign off on it'}
            </Button>
            <Button variant="quiet" onClick={() => send({ t: 'withdraw', playerId: myId })}>
              Not yet
            </Button>
          </div>
        </div>
      )}

      {state.thrownOut.length > 0 && !proposal && (
        <div className="animate-shake mb-5 rounded-lg border border-blood-600 bg-blood-600/10 px-4 py-3">
          <p className="text-sm text-ink-200">
            {state.thrownOut.length === 1 ? 'That accusation' : 'Those accusations'} did not hold. At least one of the
            three was wrong — nobody will tell you which. The case stays open, and it cost you a lead.
          </p>
          <ul className="mt-2 space-y-1">
            {state.thrownOut.map((t, i) => (
              <li key={i} className="font-mono text-[11px] text-ink-400 line-through">
                {name(c, 'suspect', t.suspect)} · {name(c, 'location', t.location)} · {name(c, 'means', t.means)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {outOfTime && !proposal && (
        <p className="animate-rise mb-5 rounded-lg border border-blood-600 bg-blood-600/10 px-4 py-3 text-sm text-ink-200">
          The trail has gone cold. No leads left — you have to name someone, and this one is final.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-4 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.cat}>
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">{col.title}</h2>
              <ul className="space-y-2">
                {col.items.map((item, i) => {
                  const mark = notebook.markOf(col.cat, item.id)
                  const ruledOut = autoCross && !live[col.cat].has(item.id)
                  return (
                    <li
                      key={item.id}
                      className={`animate-rise rounded-lg border p-3 transition-colors ${MARK_STYLE[mark]} ${
                        ruledOut ? 'opacity-35' : ''
                      }`}
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => notebook.cycle(col.cat, item.id)}
                        title="Click to mark: cleared → suspect → clear mark"
                      >
                        <span
                          className={`block text-sm font-medium text-ink-200 ${
                            mark === 'cleared' || ruledOut ? 'line-through decoration-blood-500/70' : ''
                          }`}
                        >
                          {mark === 'flagged' && <span className="mr-1 text-brass-400">★</span>}
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-400">{item.sub}</span>
                      </button>

                      <div className="mt-2 flex gap-1">
                        {LEAD_KINDS[col.cat].map((kind) => {
                          const lead = { kind, cat: col.cat, id: item.id }
                          const spent = findLeadClue(c, state, lead) === null
                          const inStep =
                            !focus || (focus === 'people' ? kind === 'interrogate' : EVIDENCE_KINDS.includes(kind))
                          return (
                            <Button
                              key={kind}
                              variant="quiet"
                              className={`min-w-0 flex-1 !px-1.5 !py-1 text-[11px] transition-transform active:scale-95 ${
                                inStep ? '' : 'opacity-30'
                              } ${inStep && focus && !spent ? 'bg-brass-500/10 text-brass-400' : ''}`}
                              disabled={!myTurn || outOfTime || spent || Boolean(proposal)}
                              onClick={() => send({ t: 'investigate', playerId: myId, lead })}
                            >
                              {spent ? `${LEAD_SHORT[kind]} ✓` : LEAD_SHORT[kind]}
                            </Button>
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Panel
            title={
              <span className="flex gap-3">
                <button onClick={() => setTab('dossier')} className={tab === 'dossier' ? 'text-brass-400' : ''}>
                  Your notes
                </button>
                <button onClick={() => setTab('log')} className={tab === 'log' ? 'text-brass-400' : ''}>
                  Evidence ({revealed.length})
                </button>
              </span>
            }
            action={
              <button
                onClick={() => setSheetOpen(true)}
                className="font-mono text-[10px] uppercase tracking-widest text-ink-400 transition-colors hover:text-brass-400"
              >
                Case file
              </button>
            }
          >
            {tab === 'dossier' ? (
              <div className="space-y-3">
                <p className="text-[11px] text-ink-400">Only you can see these. Your partner has different ones.</p>
                {dossier.map((cl) => (
                  <p key={cl.id} className="border-l-2 border-brass-500 pl-3 text-sm leading-relaxed text-ink-200">
                    {cl.text}
                  </p>
                ))}
              </div>
            ) : revealed.length === 0 ? (
              <p className="text-sm text-ink-400">Nothing chased down yet.</p>
            ) : (
              <ol className="space-y-4">
                {revealed
                  .slice()
                  .reverse()
                  .map(({ clue, by }) => (
                    <li
                      key={clue.id}
                      className={`animate-rise border-l-2 pl-3 ${
                        clue.id === newestClueId ? 'animate-flash border-brass-500' : 'border-ink-600'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-brass-500">
                          {clue.lead ? LEAD_SHORT[clue.lead.kind] : 'Note'}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">{by}</span>
                      </div>
                      <ClueView clue={clue} />
                    </li>
                  ))}
              </ol>
            )}
          </Panel>

          <label className="flex cursor-pointer items-center gap-2 px-1 text-xs text-ink-400">
            <input
              type="checkbox"
              checked={autoCross}
              onChange={(e) => setAutoCross(e.target.checked)}
              className="accent-brass-500"
            />
            Cross off what the evidence already rules out
          </label>
        </div>
      </div>

      {sheetOpen && <CaseFileSheet c={c} onClose={readFile} />}
      {inviting && <InviteDialog room={room} onClose={() => setInviting(false)} />}
      {quitting && <QuitDialog room={room} onClose={() => setQuitting(false)} />}
      {accusing && <AccuseDialog room={room} onClose={() => setAccusing(false)} />}
    </main>
  )
}

function name(c: ReturnType<typeof getCase>, cat: Category, id: string): string {
  const list = cat === 'suspect' ? c.suspects : cat === 'location' ? c.locations : c.means
  return list.find((e) => e.id === id)?.name ?? id
}
