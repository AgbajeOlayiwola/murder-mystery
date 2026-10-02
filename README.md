# Cold Open

A two-detective deduction game. One killer, one scene, one method — and neither
player can solve it alone.

Cases are set in a walled house in Lagos: a gate and a gateman, a generator that
runs all night, boys' quarters out back, and a cast drawn from across the
country. The casting pools live in
[`src/game/content.ts`](src/game/content.ts) — swap them and the game moves
anywhere you like, because nothing outside that file knows where it is set.

```bash
npm install
npm run dev     # http://localhost:5180
```

## How a round plays

1. One player opens a case and gets a five-character case number.
2. The other joins with it. On one machine, **open a second browser tab** — each
   tab is a separate detective (identity lives in `sessionStorage`).
3. Each detective is dealt private dossier notes the other cannot see. They
   overlap but differ, so the only way to combine them is to talk.
4. Players alternate turns spending *leads*: interrogate a suspect or read
   their messages, canvass a room or pull its CCTV, run forensics on a method.
   Every lead reveals one clue to both players. There are 25 leads on the board
   and only 4–8 turns to spend them, depending on difficulty — so you will never
   see most of the board.
5. Either player proposes an accusation; the other has to sign off.
   Get it wrong and the case stays open: it costs a lead, and the same three
   names cannot be put up again. Run out of leads and the next accusation is
   final. Score is correctness, plus whatever leads you did not need, less what
   the collapsed accusations cost you.

Clearing an innocent suspect is the bread and butter — four cleared suspects
leaves one. The guilty three (the real killer, real room, real method) do not
incriminate themselves; interrogating them yields an oblique narrowing clue
instead, which is what makes them worth spending a turn on.

## The six steps

The board follows the order a real investigation runs in, and the step rail at
the top of the screen is the control for it, not a decoration. The list lives in
[`src/ui/steps.ts`](src/ui/steps.ts) and is rendered by both the rail and the
How to Play guide, so what the guide promises and what the game does cannot
drift apart.

1. **Open a case.** Featured case or random number; the rail shows the case
   number again whenever a partner needs it.
2. **Read the case file.** The police report: who died, who was in the house,
   what the first unit found, what the pathologist will commit to. It is
   deliberately fact-free — `pnpm check` fails if a report so much as names a
   suspect, a room or a method, because it is read before the board and must not
   narrow it.
3. **Examine evidence.** Forensics, CCTV, recovered messages and room searches.
   Clicking the step lights those leads and dims the rest.
4. **Compare notes.** Mark the board as you rule things out. Those marks are
   per-detective and never synced.
5. **Interrogate suspects.** As step three, for interviews.
6. **Submit your verdict.** Name them, with your partner's signature.

Steps three to five complete themselves as you do that kind of work, so the rail
doubles as a record of what the pair of you have actually done.

A guide at `#how-to-play` carries the long version of all six, plus the FAQ. It
is the only other page, so the whole router is one hash — and it renders instead
of the game without unmounting the room, so reading the rules mid-case does not
drop you out of it.

## Leaving a case

The **Quit** button in the header offers the two things that actually differ:

- **Close the case file** — back to the lobby for both detectives, where you can
  pick another case. Nothing is scored.
- **Leave the room** — only you walk out. Your partner keeps the case open, and
  the case number still works if you come back.

## Animation and sound

Both are synthesised, so nothing but code ships: no sprites, no audio files.

Sound lives in [`src/ui/sound.ts`](src/ui/sound.ts) — a small WebAudio synth
where each cue is built from oscillators and filtered noise. Every kind of lead
has its own: knuckles on a door for an interview, a shutter for CCTV, a phone
blip for messages. The speaker button in the header mutes it, and that choice is
remembered. A cue fired by your partner's move may arrive without a gesture
behind it, in which case the browser refuses to start the audio context and the
sound is simply skipped.

Animations are CSS keyframes in [`src/index.css`](src/index.css), all of them
disabled under `prefers-reduced-motion`, including the CCTV grain and the score
counting up on the verdict screen.

## Messages and CCTV

Interviews and searches clear one suspect, room or method outright. Messages and
cameras work differently: each one ties a *person* to a *thing*.

- **Messages** are recovered texts from the victim's phone. A thread shows a
  suspect with no way to a weapon, or no way into a room, so it rules out that
  pairing. The line that proves it is outlined, and some threads include a
  deleted message.
- **CCTV** is a camera log for a room. Each entry comes with a still frame, and
  face-matching tags a suspect who was on camera but never went in. Click a
  still to enlarge it, and use ← → to step through the frames.

The stills are drawn as SVG from the footage data in
[`src/ui/CctvStill.tsx`](src/ui/CctvStill.tsx), and a room's `view` picks its
backdrop. No image files ship, so the picture always matches its log line. The
evidence builders are in [`src/game/evidence.ts`](src/game/evidence.ts).
`pnpm check` confirms that every thread and camera names both halves of the
pairing it rules out.

## Layout

| Path | What lives there |
| --- | --- |
| `src/game/types.ts` | The case schema. `Fact` is the whole reasoning vocabulary. |
| `src/game/generator.ts` | Builds a case from a seed, deterministically. |
| `src/game/evidence.ts` | Message threads and CCTV footage, with a still per entry. |
| `src/ui/sound.ts` | Every sound effect, synthesised at the point of use. |
| `src/ui/steps.ts` | The six steps, shared by the in-game rail and the guide. |
| `src/game/featured.ts` | Seeds the lobby offers by name. Checked like any case. |
| `src/game/solver.ts` | Brute-forces the 125 triples; proves a case is solvable. |
| `src/game/engine.ts` | Pure reducer over the shared event log. |
| `src/game/cases/` | Hand-written cases — where real cases go. |
| `src/net/` | Transport. `SyncAdapter` is the seam. |
| `src/ui/` | Screens. |

Two design decisions carry most of the weight:

**The case is derived from the seed, never transmitted.** Both clients run the
same generator on the same seed and get byte-identical cases, so the network
only ever carries small action events.

**Game state is a fold over an append-only event log.** `fold(events)` is the
entire state. That makes any ordered transport sufficient.

## Deploying

It is a static site: Vercel detects Vite, runs `npm run build`, and serves
`dist`. Routing is a single hash (`#how-to-play`), so no rewrite rules are
needed and a refresh cannot 404.

What deploying does **not** do is connect two devices — see below. A deployed
build is fully playable solo, and playable as a pair in two tabs on one machine,
but two phones will each get their own private copy of the room until a real
transport is wired in.

## Playing across two devices

The shipped adapter (`src/net/localAdapter.ts`) is same-machine only —
`localStorage` plus `BroadcastChannel`. For two phones or two houses, write a
second adapter against the same three-method `SyncAdapter` interface and swap it
in `useRoom.ts`. Anything that can store an ordered list and push changes works;
Supabase Realtime, a Cloudflare Durable Object, or PartyKit are each roughly
thirty lines, because the adapter only has to append events and hand back the log.

## Adding real cases

See [`src/game/cases/README.md`](src/game/cases/README.md). Authored cases use
the same schema as generated ones and are validated by the same solver, so a
case that is not actually solvable fails loudly instead of ruining a round.
