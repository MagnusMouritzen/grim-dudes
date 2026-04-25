/**
 * Original prompt tables for on-the-fly GM improv — not setting text (see your books).
 */

export const GM_IMPROV_NAME = [
  'Annike Rott',
  'Brun the carter',
  'Dagmar Stumm',
  'Egon Wurfel',
  'Greta Halb',
  'Ivo Klett',
  'Jurgen Mauer',
  'Kora Fink',
  'Ludwik Pflug',
  'Marta Schiefer',
  'Odo Krum',
  'Rika Voss',
  'Sibbe the turner',
  'Tilo Arft',
  'Ursle Band',
] as const;

export const GM_IMPROV_COMPLICATION = [
  'A locked door is the only way through—and someone is arguing on the other side.',
  'A child repeats everything the PCs say, loudly.',
  'A dog has run off with something you need.',
  'A local thinks one PC owes a small debt; witnesses agree.',
  'A patrol will pass this street in a few minutes, torches and questions.',
  'A sudden downpour; lamps gutter and footing turns slick.',
  'An old grudge resurfaces: two NPCs will not be in the same room.',
  'Bell tolls—everyone pauses, then the crowd moves faster.',
  'Cart axle snaps; a narrow lane is blocked until it is clear.',
  'Coins found are clipped; a merchant is already shouting.',
  'Flies swarm a stall; the owner blames a curse, not the meat.',
  'Someone recognizes a face from a wanted sketch—wrongly or rightly.',
  'The well rope is cut; the bucket hits stone far too soon.',
  'Torch smoke draws eyes; someone coughs and curses a draft.',
  'Two heralds announce contradictory orders from the same gate.',
  'Watch officer asks for “papers” that no one in the party has.',
] as const;

export const GM_IMPROV_ATMOSPHERE = [
  'Ash-rain: pale grit on every sill.',
  'Bell-muffled: every voice sounds far away.',
  'Bitter smoke from wet pine—someone is burning green wood.',
  'Brassy sunset light, long shadows across cobbles.',
  'Cold that bites knuckles; breath fogs the lantern glass.',
  'Drum in the distance, wrong rhythm for a holiday.',
  'Fish-salt and river mud, stronger than usual tonight.',
  'Geese overhead, restless before a storm.',
  'Hammer-choir from a foundry, stops all at once.',
  'Iron taste in the air after lightning.',
  'Lamplight the color of old parchment.',
  'Muffled cheering from a hall; the door stays shut.',
  'Rain in the gutters like whispered gossip.',
  'Rats in a run that even cats avoid.',
  'Roof tiles shift underfoot; someone is listening.',
  'Tar smell from road repairs; traffic crawls.',
] as const;

export const GM_IMPROV_WEATHER = [
  'A bright freeze: ice in the puddles, sky painfully clear.',
  'A dank thaw; fog clings in every hollow until noon.',
  'A dry east wind; laundry stiffens and lips chap.',
  'A feint of spring—mud soft enough to slow wagons, cold enough to regret it.',
  'A lull between storms; the animals are restless, people less so.',
  'A parching wind; dust in teeth and a headache by afternoon.',
  'A thin drizzle that outlasts every cloak.',
  'After-rain: clean stone, and every smell twice as sharp.',
  'Black-bellied clouds; distant thunder, no rain yet—players feel watched.',
  'Breath fogs: cold snap without warning, pipes groan in the walls.',
  'Drifting smoke from a dozen chimneys, sun a dull coin.',
  'Frost rim on thatch; each footstep on the path rings.',
  'Heat shimmer over fields; the road ripples. Rest breaks double.',
  'Heavy sky, wrong colour; old folk mutter and shut shutters early.',
  'Sudden squall: sheets of rain, then sun—everyone’s mood swings with it.',
  'Warm rain that steams from cobbles; the river smells of rot and life.',
] as const;

export const GM_IMPROV_STREET = [
  'A beggar and a scribe argue over the same doorframe for shade.',
  'A carter curses a wheel; his load blocks half the lane.',
  'A closed shop still smells of lye; the owner eyes passersby from a shutter.',
  'A confraternity banner hangs crooked; someone will fix it before noon—or not.',
  'A docket boy runs past, wax seal flapping, late for a hearing.',
  'A public well has a new rope—who paid for it is all anyone talks about.',
  'A scribe’s stall: inkpots rattle, a queue of thumbs for seals.',
  'A strolling musician stops mid-phrase, hears a coin, does not finish the tune.',
  'An alley reeks of tannery; a shortcut saves time, costs pride.',
  'Dogs tangle; owners apologise, neither dog does.',
  'Fishwives and cloth-sellers share one corner; the insults are rehearsed.',
  'Guild mark freshly painted; wet paint still fools a drunk.',
  'Night-soil cart early; the street clears until it passes.',
  'Someone chalks a tally on a door—debts, votes, or both.',
  'Two apprentices race with identical parcels; a master will be furious.',
  'Watch boots on a schedule; sellers adjust prices before they arrive.',
] as const;

export const GM_IMPROV_RUMOUR = [
  'A barge hand swears the night watch at the weir has been cut in half for a month—no one official agrees.',
  'A clerk is selling “copies of copies” of a patent seal; a guild is looking for the stamp, not the man.',
  'A cousin of someone at court is sick—everyone is invited to the healing mass, and to bring coin.',
  'A foreign coin turned up in the poor tithe; the temple locked the strongbox and hired extra muscle.',
  'A hound pack went quiet near the same barn three nights in a row; farmers blame vermin, not wolves.',
  'A journeymen’s hostelry burned last week; the landlord is already haggling for the plot.',
  'A notary’s satchel is missing, and the watch is more interested in who benefits than who did it.',
  'A private coach left before dawn, twice, with the curtains sewn shut.',
  'A small shrine’s bell cracked; the parish committee argues whether to mend it or melt it for shot.',
  'A toll collector took ill—traffic backed up, and a few “temporary” fees may never come off the books.',
  'An officer’s new boots squeak; soldiers say it is funny until someone notices the regimental marks do not match.',
  'Ferrymen whisper the Reik is running high; barges are delayed, and the locks are “being inspected.”',
  'Hides are cheap this week, but salt is not—someone is stockpiling for a winter that has not been announced.',
  'Someone bought every rough candle in the lower market, cash, and asked for no receipt.',
  'The confraternity that runs the almshouse is hiring “watchers” with no previous charity experience.',
  'The road mill’s waterwheel creaks like bone; the miller will talk about ghosts before he talks about flour.',
] as const;

export const GM_IMPROV_MOTIVE = [
  'A clean signature on a document they can produce from a bag that is not quite dry.',
  'A drink bought for them by someone who does not look like they can afford it.',
  'A favour named out loud so witnesses will remember who owes what.',
  'A few minutes where nobody asks about the stain on their cuff.',
  'A gate left unlatched long enough to slip something through, not to be seen leaving.',
  'A name—any name—that matches the one they have been using since Tuesday.',
  'A witness to a small kindness they can point to if accused of worse later.',
  'An excuse to leave the room before the almoner starts counting heads.',
  'An introduction to the person who actually controls the back stairs.',
  'Creditors off their trail until the river trade opens again.',
  'Proof they were somewhere else, even if the when is fuzzy.',
  'Room to haggle without a spouse, partner, or priest listening in.',
  'Someone else to be the loud one while they pick the best chair.',
  'The bill settled in copper first so the change feels honest.',
  'The last piece of a map someone else already burned half of.',
  'To be believed about one small thing, so a bigger lie can wait.',
] as const;

export const GM_IMPROV_VOICE = [
  'Adds “for the record” even when there is no record, only a listener.',
  'Ask every question twice, softer the second time, as if testing which answer sticks.',
  'Breathes through the mouth when thinking; it sounds like a small bellows in a quiet room.',
  'Counts on fingers the party cannot see, under the table or inside a sleeve.',
  'Drops the title after one use; after that, uses “you” like a blade, politely.',
  'Emphasises coin words—owe, pay, keep—so money feels like weather, not a choice.',
  'Finishes a sentence, then tacks a joke that is not a joke, then watches who laughs.',
  'Hums one bar of a hymn when nervous; stops the instant someone hums back.',
  'Laughs a half-beat late, to see if others will join; treats silence as an answer.',
  'Leaves the end of a word hanging—almost a swear, always pulled back to “sir.”',
  'Prefers the passive voice: things happen, no one is named, the street is always guilty.',
  'Quotes regulations by heart, but misquotes the year on purpose, once, to be corrected.',
  'Refers to the body in parts—hands, eyes, back—as if the whole person is negotiable.',
  'Starts most replies with “Look,” and never means look at them—means look at the room.',
  'Stops mid-thought, taps a tooth, continues as if the pause never happened.',
  'Uses we for strangers in trouble and you for friends in it—reverses when angry.',
] as const;

export const GM_IMPROV_TWIST = [
  'A bell everyone ignored starts ringing—and keeps ringing long enough to matter.',
  'A chain someone trusted snaps; the sound is too clean to be an accident.',
  'A child points at the wrong person and will not un-point.',
  'A door that should be latched is not, and a draft brings a smell the room should not have.',
  'A second torch fails in the same breath as the first—darkness is a decision now.',
  'Someone calls a name; both the named and a stranger turn.',
  'Someone laughs at a joke that has not been told yet; the room goes quiet anyway.',
  'Someone the party has not been tracking has been here the whole time, watching.',
  'The animal that was calm is not; the one that was nervous is gone.',
  'The crowd thins the wrong way—toward trouble, not away from it.',
  'The last believable exit is the one a guard just stepped into, whistling.',
  'The law arrives early; the help arrives late; both are loud.',
  'The map is right and the world is wrong—stairs where there was wall.',
  'The person who was buying time stops buying; the person who was losing patience pays.',
  'The thing everyone agreed to ignore is suddenly on a table, lit, and priced.',
  'Weather, animal, or god—something outside the plan knocks on the plan’s door twice.',
] as const;

export const GM_IMPROV_TABLES = {
  name: GM_IMPROV_NAME,
  complication: GM_IMPROV_COMPLICATION,
  atmosphere: GM_IMPROV_ATMOSPHERE,
  weather: GM_IMPROV_WEATHER,
  street: GM_IMPROV_STREET,
  rumour: GM_IMPROV_RUMOUR,
  motive: GM_IMPROV_MOTIVE,
  voice: GM_IMPROV_VOICE,
  twist: GM_IMPROV_TWIST,
} as const;

export type GmImprovTableId = keyof typeof GM_IMPROV_TABLES;

export function pickGmImprov(id: GmImprovTableId): string {
  const arr = GM_IMPROV_TABLES[id] as readonly string[];
  if (arr.length === 0) return '';
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] ?? '';
}
