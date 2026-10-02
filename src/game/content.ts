import type { Means, Place, Suspect } from './types'

/**
 * Casting pools for procedurally generated cases. Five of each are drawn per
 * case. Authored cases (see ./cases) supply their own cast instead.
 *
 * The setting is a big house in Lagos — a walled compound with a gate, a
 * generator, boys' quarters out back and more staff than anyone admits to.
 * Names are drawn across the country rather than from one group, and nobody
 * here is a real person.
 */

export const SUSPECT_POOL: Suspect[] = [
  { id: 's-adeleke', name: 'Chief Bisi Adeleke', occupation: 'property lawyer', motive: 'stood to lose a share of the will', alibi: 'at the office on Broad Street until past midnight', trait: 'had a key to the gate' },
  { id: 's-danjuma', name: 'Alhaji Musa Danjuma', occupation: 'transport contractor', motive: 'was being leaned on over a debt nobody wrote down', alibi: 'at the mosque for night prayers', trait: 'knew the alarm code' },
  { id: 's-okonkwo', name: 'Adaeze Okonkwo', occupation: 'antiques dealer', motive: 'had been selling the victim fakes for years', alibi: 'on a call with a buyer in Onitsha', trait: 'left no fingerprints anywhere' },
  { id: 's-eze', name: 'Barrister Ngozi Eze', occupation: 'former business partner', motive: 'was cut out of the company six weeks ago', alibi: 'at an owambe in Ikeja with two hundred witnesses', trait: 'is left-handed' },
  { id: 's-ogundipe', name: 'Funmilayo Ogundipe', occupation: 'private nurse', motive: 'had been altering the medication log', alibi: 'doing rounds on the floor above', trait: 'is strong enough to move dead weight alone' },
  { id: 's-olatunji', name: 'Pastor Gbenga Olatunji', occupation: 'the family pastor', motive: 'knew a secret worth more unspoken', alibi: 'locking up after the vigil', trait: 'was seen with red dust on their shoes' },
  { id: 's-essien', name: 'Ubong Essien', occupation: 'reporter with a Lagos daily', motive: 'was three days from publishing', alibi: 'filing copy from a hotel lobby on the Island', trait: 'knew the house better than its owner did' },
  { id: 's-nwosu', name: 'Emeka Nwosu', occupation: 'the cook', motive: 'had been selling the household’s supplies for years', alibi: 'shutting down the kitchen for the night', trait: 'never once asked how the victim died' },
  { id: 's-dasilva', name: 'Mrs Remi Da Silva', occupation: 'the victim’s sister', motive: 'never forgave the way their mother’s house was sold', alibi: 'asleep at the far end of the house', trait: 'had access to the medicine cabinet' },
  { id: 's-lawal', name: 'Zainab Lawal', occupation: 'security consultant', motive: 'had just been told the contract was ending', alibi: 'reviewing footage in the security room', trait: 'knew exactly where the cameras did not reach' },
  { id: 's-martins', name: 'Sade Martins', occupation: 'gallery owner in Ikoyi', motive: 'had sold the same painting twice', alibi: 'at a preview across the bridge', trait: 'wore gloves indoors all evening' },
  { id: 's-bello', name: 'Yusuf Bello', occupation: 'accountant', motive: 'had been moving money that was not theirs', alibi: 'closing the quarter’s books', trait: 'was the last person to sign the visitors’ book' },
  { id: 's-oghenekaro', name: 'Efe Oghenekaro', occupation: 'gardener', motive: 'had been told that morning to pack and go', alibi: 'burning cuttings at the back fence', trait: 'owns a set of keys nobody remembers cutting' },
  { id: 's-nwachukwu', name: 'Dr Amaka Nwachukwu', occupation: 'records officer', motive: 'had found a document that should not exist', alibi: 'sorting files downstairs', trait: 'smelled of kerosene all evening' },
]

export const PLACE_POOL: Place[] = [
  { id: 'p-parlour', name: 'parlour', note: 'Glass doors onto the veranda. Anyone inside is visible from the compound.', view: 'glass' },
  { id: 'p-bq', name: 'boys’ quarters', note: 'Behind the main house, past the generator. Staff only, in theory.', view: 'corridor' },
  { id: 'p-gen-house', name: 'generator house', note: 'Nobody goes in while it is running, and it ran all night.', view: 'racks' },
  { id: 'p-gatehouse', name: 'gatehouse', note: 'Every visitor signs the book. The page for that night is missing.', view: 'doorway' },
  { id: 'p-back-stair', name: 'back staircase', note: 'Runs the height of the house. The bulb has been dead for months.', view: 'stair' },
  { id: 'p-study', name: 'study', note: 'The safe was standing open when the body was found.', view: 'shelves' },
  { id: 'p-backyard', name: 'backyard', note: 'Soft ground after rain. It keeps a footprint for days.', view: 'garden' },
  { id: 'p-car-park', name: 'car park', note: 'Four cars, three sets of keys.', view: 'vehicles' },
  { id: 'p-chapel', name: 'prayer room', note: 'Used every morning. Still locked at night out of habit.', view: 'arches' },
  { id: 'p-storeroom', name: 'storeroom', note: 'Bags of rice to the ceiling and no window.', view: 'racks' },
  { id: 'p-kitchen', name: 'back kitchen', note: 'Opens onto the service lane. No gate there, just a gap in the fence.', view: 'doorway' },
  { id: 'p-terrace', name: 'roof terrace', note: 'Under a camera that has been dead since the rains.', view: 'garden' },
  { id: 'p-guest-wing', name: 'guest wing', note: 'Made up that week for a visitor nobody can name.', view: 'doorway' },
  { id: 'p-jetty', name: 'jetty', note: 'Lagoon-front, unlit, and twelve minutes from the main house.', view: 'water' },
]

export const MEANS_POOL: Means[] = [
  { id: 'm-letter-opener', name: 'brass letter opener', note: 'Kept on the desk. Sharpened, which is unusual.' },
  { id: 'm-pestle', name: 'kitchen pestle', note: 'Heavy, seamless, and impossible to lift by accident.' },
  { id: 'm-sedative', name: 'sedative vials', note: 'Three signed out of the clinic, two accounted for.' },
  { id: 'm-cord', name: 'curtain cord', note: 'Cut from a window that no longer opens.' },
  { id: 'm-fall', name: 'staged fall', note: 'The injuries are consistent. The position of the body is not.' },
  { id: 'm-rat-poison', name: 'rat poison', note: 'Bought at the market. Nobody remembers who was sent for it.' },
  { id: 'm-exhaust', name: 'generator exhaust', note: 'The pipe had been turned to face the house.' },
  { id: 'm-insulin', name: 'insulin', note: 'Nobody in the house is diabetic.' },
  { id: 'm-palm-wine', name: 'palm wine', note: 'Two calabashes poured. One was washed, one was not.' },
  { id: 'm-agbo', name: 'agbo flask', note: 'Herbal mixture, from a seller nobody can name.' },
  { id: 'm-pistol', name: 'service pistol', note: 'An heirloom from the war. Recently, and badly, reloaded.' },
  { id: 'm-iron-bar', name: 'iron bar', note: 'Taken off the gate. Cleaned, then put back the wrong way round.' },
  { id: 'm-pillow', name: 'pillow', note: 'Laundered the same night. Nobody admits to doing it.' },
  { id: 'm-cable', name: 'live cable', note: 'Run where nobody walks barefoot by accident.' },
]

export const VICTIM_POOL: Array<{ name: string; detail: string }> = [
  { name: 'Chief Olusegun Ariyo', detail: 'seventy-one, owner of the house, disliked by everyone who depended on him' },
  { name: 'Mrs Dorcas Ekpo', detail: 'forty-four, a collector who had just changed her will and told the wrong person' },
  { name: 'Justice Emmanuel Sowande', detail: 'sixty-eight, retired, with a cabinet full of reasons to be hated' },
  { name: 'Kelechi Obidike', detail: 'thirty-three, heir to nothing yet, which was the whole problem' },
  { name: 'Dr Ifeoma Balogun', detail: 'fifty-six, a physician who kept records she was not supposed to keep' },
  { name: 'Alhaji Musa Garba', detail: 'forty-nine, a developer who had bought half the waterfront and all of its enemies' },
]

export const CASE_TITLES: string[] = [
  'The Light Went at Nine',
  'Nobody Heard the Gate',
  'A Clean Glass',
  'The Last Signature',
  'Twelve Minutes of Rain',
  'The House Says Nothing',
  'Harmattan',
  'The Missing Page',
]

/**
 * Report furniture. Every line here is deliberately fact-free — it sets the
 * scene without ruling anybody in or out, so the report can be read before the
 * board without changing what is deducible. `pnpm check` fails if any of it
 * names a suspect, a room or a method.
 */
export const REPORTED_BY: string[] = [
  'the gateman, on the phone by the front gate',
  'a neighbour who saw the lights still on',
  'the cook, on arriving before dawn',
  'an anonymous caller, from a phone two streets over',
  'the nurse, who could not raise anyone inside',
]

export const FIRST_UNIT: string[] = [
  'Two officers from the division, ninety minutes in traffic.',
  'A single patrol, already on the street for another call.',
  'The DPO, who sealed the ground floor and waited.',
  'An ambulance first, then uniform eleven minutes later.',
]

export const WEATHER: string[] = [
  'Rain from the afternoon until eleven, then still and warm.',
  'Harmattan. Dust on every surface and a haze that never lifted.',
  'Humid, no breeze, mosquitoes bad enough to keep everyone indoors.',
  'Wind off the lagoon all evening, strong enough to move unlatched doors.',
]

export const PATHOLOGY: string[] = [
  'Death between 22:40 and 00:10. The window is firm; the cause is not.',
  'Time of death put at 23:00, give or take forty minutes.',
  'Pathologist will commit to the hour of eleven and nothing else yet.',
  'Death late in the evening. The body was found cold, which narrows the window less than you would like.',
]

export const SCENE_NOTES: string[] = [
  'No forced entry at any door or window.',
  'Nothing taken that anyone can name.',
  'The light went at nine. The generator ran until morning.',
  'Every interior door was closed, which is not how this house is usually left.',
  'Five people were in the compound that night and all five are still here.',
  'The visitors’ book shows no name written after seven.',
  'Two glasses were out. The household say that is normal.',
  'Red dust on the back steps, dry by the time the first unit arrived.',
  'The dogs did not bark, or nobody will admit to hearing them.',
]

export const CASE_OPENERS: string[] = [
  'The call came in at 4:12. By the time the patrol arrived, someone had already swept the floor.',
  'Five people in the house, five accounts of the evening, and not one of them fits the others.',
  'No forced entry. Nobody screamed. Whoever did this was let in, and knew where to stand.',
  'The rain stopped at eleven. Everything that matters happened in the twenty minutes after that.',
  'The light went at nine. Whatever happened after that happened under the hum of the generator.',
]
