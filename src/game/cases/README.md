# Hand-written cases

Generated cases are fine filler, but the interesting ones are written. A case is
a plain `CaseFile` object — same schema the generator produces, same solver
checking it.

## Adding one

Create `my-case.ts` here:

```ts
import type { CaseFile } from '../types'

export const MY_CASE: CaseFile = {
  id: 'my-case',
  seed: 'authored:my-case',
  origin: 'authored',
  title: 'The Quiet Hour',
  blurb: 'One paragraph setting the scene.',
  victim: { name: '…', detail: 'age, role, and why someone might want this' },

  suspects: [ /* 4–6 of them */ ],
  locations: [ /* 4–6 */ ],
  means: [ /* 4–6 */ ],

  solution: { suspect: 's-…', location: 'p-…', means: 'm-…' },

  clues: [
    // One per cast member, each tagged with the lead that surfaces it.
    { id: 'k1', lead: { cat: 'suspect', id: 's-…' }, text: 'Why this person is cleared.',
      facts: [{ t: 'eliminate', cat: 'suspect', id: 's-…' }] },
    // Dossier notes have `lead: null` and are listed in dossierClueIds.
    { id: 'd1', lead: null, text: 'Narrowing note dealt privately.',
      facts: [{ t: 'oneOf', cat: 'location', ids: ['p-a', 'p-b', 'p-c'] }] },
  ],

  dossierClueIds: ['d1', 'd2', 'd3', 'd4'],
}
```

Then register it in [`registry.ts`](./registry.ts) and start a game with the seed
`authored:my-case` (`authoredSeed('my-case')`).

## The three fact shapes

Everything the solver reasons about is one of these:

- `{ t: 'eliminate', cat, id }` — this suspect / room / method is out.
- `{ t: 'oneOf', cat, ids }` — the answer in this category is one of these.
- `{ t: 'notBoth', a, b }` — these two cannot both be true. Useful for authored
  cases: *if it was the wine cellar, it was not the revolver — the shot would
  have been heard.*

A clue can also carry `evidence`, which the UI shows as the evidence itself:
`{ kind: 'messages', withName, ownerName, when, thread }` for a text thread, or
`{ kind: 'cctv', camera, view, entries }` for footage. Give each footage entry a
`shot` (`empty`, `light`, `rain`, `figures`, or a `figure` with an optional
face-match `tag`) and it is drawn as a still. Give each place a `view`
(`shelves`, `stair`, `water`, …) to choose what its camera shows.

Clue prose is free-form; the `facts` are what actually constrain the answer. Keep
them honest — a clue whose text implies more than its facts encode will make
players feel cheated.

## Rules a case must satisfy

`validateCase(c)` in [`registry.ts`](./registry.ts) checks all of these and
returns a list of problems:

- Every `solution` id is in the cast.
- Every `dossierClueIds` entry names a real clue.
- **The full clue set narrows to exactly one answer, and it is the stated one.**

The last rule is the one that bites. A case where two answers survive all the
clues is unwinnable, and you will not notice by reading it. Run the validator.

## Real cases

Two things to hold to when adapting a real crime:

- Where the facts are disputed or the conviction is contested, make the case's
  "solution" the documented legal outcome and say so in the `blurb`, or build
  the case around a settled detail rather than the identity of the killer.
- Victims were people with living relatives. The `victim.detail` line is the
  place to be plain and unsensational.

A structure that sidesteps the problem entirely: set the case at a point in the
real timeline and make the answer *what investigators concluded*, not what you
think happened.
