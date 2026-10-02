/**
 * The six steps of an investigation, defined once. The rail above the board and
 * the How to Play guide render the same list, so what the guide promises and
 * what the game does cannot drift apart.
 */

export type StepId = 'open' | 'file' | 'evidence' | 'notes' | 'people' | 'verdict'
export type StepState = 'done' | 'active' | 'todo'

export interface Step {
  id: StepId
  title: string
  /** One line, for the rail. */
  blurb: string
  /** The long version, for the guide. */
  guide: string[]
}

export const STEPS: Step[] = [
  {
    id: 'open',
    title: 'Open a case',
    blurb: 'Pick one, or take a random case number.',
    guide: [
      'Open a case and you get a five-character case number. Your partner joins with it, and you are both looking at the same crime.',
      'Playing on one machine? Open the case, then open the same page in a second browser tab and join with the number — each tab is its own detective.',
      'Pick a featured case from the lobby, or take a random number: every number generates a complete case, and the solver proves it has exactly one answer before it is dealt.',
    ],
  },
  {
    id: 'file',
    title: 'Read the case file',
    blurb: 'What happened, where, and when.',
    guide: [
      'Review the police report and learn about the crime. Understand what happened, where, and when.',
      'The report gives you the victim, who was in the house, who called it in, what the first unit found and what the pathologist will commit to. It also lists the five suspects, five rooms and five methods in play.',
      'Nothing in the report rules anybody in or out — that is what the leads are for. You can reopen it at any time from the case file link above your notes.',
    ],
  },
  {
    id: 'evidence',
    title: 'Examine evidence',
    blurb: 'Forensics, footage, messages, searches.',
    guide: [
      'Analyse forensic reports, security footage, recovered phone messages, and what a search of each room turns up.',
      'Forensics and searches clear a method or a room outright. Messages and cameras do something different: they tie a person to a thing. A thread can show a suspect had no way to a weapon, or no way into a room; a camera can put them somewhere that is not the room it covers.',
      'Every lead costs a turn and reveals its clue to both detectives, so say what you are about to spend before you spend it.',
    ],
  },
  {
    id: 'notes',
    title: 'Compare notes',
    blurb: 'Mark what is out. Your partner holds what you do not.',
    guide: [
      'You are each dealt private dossier notes the other cannot see. They overlap but differ, and neither hand can close the case alone — the only way to combine them is to talk.',
      'Click any suspect, room or method to mark it: cleared, then flagged as your prime suspect, then clear the mark again. Those marks are yours alone and are never synced.',
      'If you would rather the game kept score of the logic, tick "cross off what the evidence already rules out" and it will strike through anything the revealed clues have eliminated.',
    ],
  },
  {
    id: 'people',
    title: 'Interrogate suspects',
    blurb: 'Alibis, inconsistencies, motive.',
    guide: [
      'Question each suspect. Compare their answers with the evidence. Look for contradictions, evasions, and hidden motives.',
      'An innocent suspect clears themselves: an alibi, confirmed. The guilty one will not. Interrogate the killer and you get something oblique instead — a narrowing that costs them nothing to give up, which is exactly why it is worth the turn.',
      'The same is true of the real room and the real method. Three leads on the board do not incriminate anyone, and noticing which three is most of the job.',
    ],
  },
  {
    id: 'verdict',
    title: 'Submit your verdict',
    blurb: 'Name them — and be sure.',
    guide: [
      'When you are confident, name the suspect you believe is the killer, along with the room it happened in and the method they used. Get all three right and you have solved the case.',
      'Your partner has to sign off before an accusation is official. Either of you can withdraw it.',
      'Get it wrong and the case stays open. It costs you a lead, and you are told that at least one of the three was wrong — never which one. The same three names cannot be put up twice. When the leads run out, the next accusation is final.',
    ],
  },
]

export const STEP_BY_ID: Record<StepId, Step> = Object.fromEntries(STEPS.map((s) => [s.id, s])) as Record<StepId, Step>
