/** Fun / motivational one-liners for the admin Overview — visual only. */

export type AdminMotivationInput = {
  revenue: number;
  checks: number;
  signups: number;
};

type Bucket = "quiet" | "warm" | "solid" | "strong" | "fire" | "legend";

function bucketForRevenue(revenue: number): Bucket {
  const r = Number.isFinite(revenue) ? Math.max(0, revenue) : 0;
  if (r < 40) return "quiet";
  if (r < 100) return "warm";
  if (r < 180) return "solid";
  if (r < 280) return "strong";
  if (r < 400) return "fire";
  return "legend";
}

function fmtMoney(n: number): string {
  const v = Math.round(n);
  return `€${v.toLocaleString("en-US")}`;
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(n % 1 === 0 ? 0 : 1);
}

/** Rough fun reference points (EUR). Not accounting advice. */
const REFS = {
  ugandaMonth: 95,
  coffee: 4.5,
  ramen: 12,
  fuelLiter: 1.6,
  movie: 14,
  pizza: 18,
  busTicket: 2.5,
  plant: 22,
  kebab: 8,
  burger: 11,
  beer: 5.5,
  gymDay: 9,
  netflixMonth: 13,
};

type Vars = {
  eur: string;
  checks: string;
  signups: string;
  ugandaGap: string;
  coffees: string;
  ramen: string;
  fuel: string;
  movies: string;
  pizzas: string;
  buses: string;
  plants: string;
  perCheck: string;
  kebabs: string;
  burgers: string;
  beers: string;
  gymDays: string;
  netflix: string;
};

function buildVars(input: AdminMotivationInput): Vars {
  const revenue = Math.max(0, Number(input.revenue) || 0);
  const checks = Math.max(0, Math.round(Number(input.checks) || 0));
  const signups = Math.max(0, Math.round(Number(input.signups) || 0));
  const ugandaGap = Math.max(0, revenue - REFS.ugandaMonth);

  return {
    eur: fmtMoney(revenue),
    checks: String(checks),
    signups: String(signups),
    ugandaGap: fmtMoney(ugandaGap),
    coffees: round1(revenue / REFS.coffee),
    ramen: round1(revenue / REFS.ramen),
    fuel: round1(revenue / REFS.fuelLiter),
    movies: round1(revenue / REFS.movie),
    pizzas: round1(revenue / REFS.pizza),
    buses: round1(revenue / REFS.busTicket),
    plants: round1(revenue / REFS.plant),
    perCheck: checks > 0 ? fmtMoney(revenue / checks) : "∞",
    kebabs: round1(revenue / REFS.kebab),
    burgers: round1(revenue / REFS.burger),
    beers: round1(revenue / REFS.beer),
    gymDays: round1(revenue / REFS.gymDay),
    netflix: round1(revenue / REFS.netflixMonth),
  };
}

function fill(template: string, v: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = v[key as keyof Vars];
    return val ?? `{${key}}`;
  });
}

/**
 * Premade pep talks by revenue bucket. Placeholders:
 * {eur} {checks} {signups} {ugandaGap} {coffees} {ramen} {fuel} {movies}
 * {pizzas} {buses} {plants} {perCheck} {kebabs} {burgers} {beers} {gymDays} {netflix}
 */
const LINES: Record<Bucket, string[]> = {
  quiet: [
    "Quiet lane today — {eur} on the board. Even engines idle before a pull.",
    "Only {eur} so far. Perfect weather for shipping one more pending report.",
    "{checks} checks and {signups} signups. Small numbers, still real humans.",
    "Today’s {eur} wouldn’t buy a yacht. It might buy momentum.",
    "Soft open: {eur}. Uganda’s average monthly salary is ~€95 — you’re warming up.",
    "{signups} new accounts. Feed them something better than a loading spinner.",
    "Revenue {eur} · checks {checks}. Not a thriller. Not a funeral either.",
    "The dashboard is whispering, not screaming. {eur} is a whisper with potential.",
    "If today were a lap, you’d still be in the pit. {checks} VINs checked.",
    "Low volume day: {eur}. Great day to clean queues and look clever later.",
    "{eur} today. Somewhere a coffee costs €4.50 — you’re at {coffees} coffees of runway.",
    "Signups: {signups}. Checks: {checks}. Plot still loading…",
    "Calm seas: {eur}. Captains still check the charts.",
    "You’re {ugandaGap} vs that ~€95 Uganda monthly vibe. Either way — move.",
    "Early numbers look shy. Shy numbers grow when pending gets published.",
    "{checks} cars investigated. That’s a driveway of curiosity.",
    "Bank said {eur}. Motivation said: one more lookup.",
    "Not every day is supercar mode. Today is bicycle mode with {signups} new riders.",
    "Soft green lights: {eur}. Don’t rear-end your own roadmap.",
    "Quiet doesn’t mean broken. Quiet means {checks} checks and room to sprint.",
    "{eur} ≈ {kebabs} street kebabs. Greasy math, clean motivation.",
    "Slow morning energy. {signups} signups still count as applause.",
    "You’re collecting breadcrumbs: {eur}. Breadcrumbs become loaves.",
    "Dashboard zen mode. {checks} checks, zero drama (hopefully).",
    "Today’s budget could buy {netflix} months of Netflix. Or one good publish streak.",
    "Quiet days invent tomorrow’s systems. Also invent {eur}. Both useful.",
    "If vibes were currency you’d be broke. Luckily euros exist: {eur}.",
    "{burgers} burgers of runway. Do not negotiate with hangry tickets.",
    "Soft open protocol: clear one pending, watch {eur} stop looking shy.",
    "The market yawned. You still logged {checks} VINs. Professionals yawn productively.",
    "{beers} beers of metaphorical revenue. Drink water. Ship reports.",
    "Low heat, high potential. {signups} new humans just walked in.",
    "Even tiny days need a caption. Today’s caption is {eur}.",
    "You’re {gymDays} gym-day passes away from a flex. Start with the queue.",
    "Silence on the chart isn’t failure — it’s {checks} quiet wins stacking.",
  ],
  warm: [
    "Nice warm-up: {eur} today — already past a typical Uganda monthly wage (~€95) by {ugandaGap}.",
    "{eur} in the till. That’s about {coffees} fancy coffees you didn’t spill on the keyboard.",
    "{checks} VIN checks. Someone out there almost bought a mystery box — you helped.",
    "{signups} signups joined the party. Don’t leave them alone with the FAQ.",
    "You’re pacing at {eur}. Respectable. Not flashy. Flashy is overrated until 3pm.",
    "Today’s haul equals ~{ramen} bowls of late-night ramen. Fuel for the ops brain.",
    "{eur} · {checks} checks · {signups} signups. The trio looks awake.",
    "Compared to ~€95/mo in Uganda, you’re up {ugandaGap} today alone. Wild planet we live on.",
    "Average per check: {perCheck}. Tiny factories love tiny unit economics.",
    "Warm cruise: {eur}. Keep the lane clear of unpaid invoices and drama.",
    "{buses} city bus tickets’ worth of revenue. Transit-core capitalism.",
    "You didn’t invent gravity today — you invented {checks} clearer titles.",
    "Signup counter says {signups}. Treat them like VIPs with shorter wait times.",
    "Mild heat: {eur}. Enough to smile. Not enough to buy a helicopter. Yet.",
    "That’s ~{movies} cinema tickets. Or one very long admin session. Your call.",
    "Warm green zone. {eur} earned while the pending queue plots against you.",
    "Solid mid-morning energy: {checks} checks already in the books.",
    "You’re out-earning a whole monthly wage benchmark by {ugandaGap} today. Stay kind, stay fast.",
    "{pizzas} pizzas of revenue. Share none with the spam bots.",
    "Gentle acceleration. {eur} on the clock, {signups} new seatbelts clicked.",
    "{kebabs} kebabs of progress. Seasoned with {checks} VIN lookups.",
    "Warm enough to brag in a whisper: {eur}. Cold enough to keep shipping.",
    "That’s {netflix} Netflix months. Reality show: ‘Will they publish the pending?’",
    "{burgers} burgers. Protein for the roadmap. Fries for the backlog.",
    "Comfortably above sleepy. Comfortably below chaos. {eur} is the vibe.",
    "Someone paid for clarity {checks} times. You’re in the clarity business.",
    "{beers} beers of budget. Toast to {signups} new accounts — then hydrate.",
    "Warm lane unlocked. Speed limit: don’t break prod. Revenue: {eur}.",
    "Your CAC is somewhere. Your vibe is here: {eur} and rising.",
    "{gymDays} day-passes of discipline. Apply them to the publish button.",
    "Not a rocket day. A reliable engine day. Engines print {eur}.",
    "The funnel yawned, stretched, and collected {signups} signups. Cute.",
    "Warm-up complete when pending shrinks. Score so far: {eur}.",
    "Geography check: +{ugandaGap} vs ~€95/mo Uganda average — today. Keep going.",
    "Mild spice. Nice aroma. Dashboard says {checks} checks. Chef’s kiss.",
  ],
  solid: [
    "Solid day shaping up: {eur}. That’s {ugandaGap} more than Uganda’s ~€95 monthly average — today.",
    "{eur} locked. Roughly {fuel} liters of fuel. Metaphorically. Please don’t drink diesel.",
    "{checks} checks done. That’s a supermarket parking lot of VINs.",
    "{signups} humans signed up. Your product is apparently not a rumor.",
    "Per-check vibe: {perCheck}. The spreadsheet would tip its hat if it had a hat.",
    "You’re in the ‘actually shipping’ bracket: {eur} with {checks} lookups.",
    "Today could buy ~{plants} sad office plants. Buy focus instead.",
    "Revenue {eur} · signups {signups}. The funnel is doing a little dance.",
    "Benchmarks are silly until they slap: +{ugandaGap} vs a ~€95/mo reference — today.",
    "Strong enough to brag softly in Slack. Soft enough to keep grinding: {eur}.",
    "{coffees} coffees of revenue. Caffeine economy endorsed.",
    "Ops mood: competent. Numbers mood: {eur}. Pending mood: staring at you.",
    "You processed curiosity {checks} times. Curiosity pays rent.",
    "Solid green. Not neon. Neon is for later. {signups} new accounts agree.",
    "If today were a playlist, it would be ‘focused indie’ — {eur} of indie.",
    "That’s ~{ramen} ramen nights. Celebrate with… more accurate odometer data.",
    "Unit story: {perCheck} per check across {checks} checks. Boring. Beautiful.",
    "You’re past ‘cute side project’ energy for the day. {eur} says so.",
    "Signups {signups} + checks {checks} = a dashboard that isn’t lying.",
    "Keep the wheels on. {eur} is a good reason to answer that support email.",
    "{kebabs} kebabs of solid revenue. No mystery meat in these reports.",
    "Solid = screenshot-worthy without needing fireworks. {eur}.",
    "{netflix} months of streaming equivalent. Plot: you shipped.",
    "Competent capitalism: {burgers} burgers of budget and {signups} new users.",
    "The middle of the mountain is where most quit. You’re at {eur}. Keep climbing.",
    "{beers} beers of runway. Celebrate after the queue is shorter.",
    "Checks {checks} feel like a factory shift that paid {eur}. Clock out proud — later.",
    "Solid days compound. Soft days apologize. Today’s compounding: {eur}.",
    "{gymDays} gym days of grit. Apply to providers, not just biceps.",
    "You outran a monthly wage benchmark by {ugandaGap} before evening. Nice.",
    "Reliability looks like this: {eur}, {checks} lookups, fewer surprises.",
    "The product is earning trust in public. Scoreboard: {signups} joins.",
    "Neither boom nor bust — boomlet. Boomlets pay rent: {eur}.",
    "Parking-lot energy: {checks} VINs. Cash-register energy: {eur}.",
    "Solid green checkmark energy. Literally. Also {pizzas} pizzas of metaphor.",
  ],
  strong: [
    "Strong pull: {eur} today — {ugandaGap} clear of a ~€95 Uganda monthly salary. In one day.",
    "{checks} VIN checks. That’s not a sample size. That’s a fleet briefing.",
    "{signups} signups. Your acquisition graph just did a little push-up.",
    "Heat check: {eur}. Sunglasses optional. Shipping mandatory.",
    "About {pizzas} pizzas of revenue. Do not eat the dashboard.",
    "Per check {perCheck} across {checks} runs. The machine is humming.",
    "You’re in ‘tell the team without shouting’ territory: {eur}.",
    "Today’s money ≈ {movies} movie nights. Plot twist: the VINs were the movie.",
    "Strong lane. {ugandaGap} above that classic ~€95/mo benchmark — today only.",
    "{fuel} liters of metaphorical fuel. Tank’s got weight.",
    "Signup party of {signups}. Check party of {checks}. Revenue DJ: {eur}.",
    "This is the part of the race where you don’t lift. {eur} proves it.",
    "Ops tip disguised as a joke: publish the pending ones while the streak is hot.",
    "Strong ≠ stressful. Strong = {eur} with a clean conscience and faster replies.",
    "You outpaced a monthly wage reference by {ugandaGap} before dinner. Absurd. Useful.",
    "{coffees} coffees. Or one very motivated founder brain. Same vibe.",
    "The charts look athletic. {checks} checks is cardio for databases.",
    "Revenue with shoulders: {eur}. Signups with pulse: {signups}.",
    "If confidence were a CSS class, you’d be `font-semibold` today.",
    "Keep it premium, keep it fast. {eur} likes both.",
    "{kebabs} kebabs of strong-day fuel. Extra sauce = extra publishes.",
    "Strong days make weak excuses look unemployed. {eur} is employed.",
    "{netflix} Netflix years… okay months. Still a lot of ‘are you still watching?’",
    "{burgers} burgers. Stack them next to {checks} clean VIN stories.",
    "You’re loud enough in the numbers. Stay soft in the UI. {eur}.",
    "{beers} beers of budget — toast the {signups} who trusted the checkout.",
    "Strong pull, soft landing: ship pending while {eur} is smiling.",
    "This is ‘reply faster than usual’ money. Demand is {checks} checks deep.",
    "{gymDays} day passes of momentum. Momentum hates idle queues.",
    "Above the Uganda ~€95/mo line by {ugandaGap} today. Geography is a plot twist.",
    "Strong isn’t lucky. Strong is {perCheck} average across {checks} paid curiosities.",
    "The funnel did push-ups. Signups {signups}. Revenue spotted it: {eur}.",
    "Call it a good problem: more interest than idle time. Interest = {eur}.",
    "Charts with posture. Posture costs nothing. Revenue today: {eur}.",
    "Strong lane unlocked. Speed cameras: don’t break prod. Go.",
  ],
  fire: [
    "Hot lap energy: {eur}. That’s {ugandaGap} beyond ~€95/mo Uganda average — and it’s just today.",
    "{checks} checks. The servers deserve a tiny medal and a bigger cache.",
    "{signups} new users. Don’t ghost them. Ghost the spam instead.",
    "Redline adjacent: {eur}. Still cool enough for the eyes. Hot enough for the ledger.",
    "≈{plants} plants of revenue. Build a jungle of reports instead.",
    "Fire tier without the headache: {eur}, {checks} lookups, {signups} joins.",
    "Per-check {perCheck}. That’s not luck. That’s a product people pay for.",
    "Today’s haul could fund ~{ramen} ramen nights for a very hungry team.",
    "You’re writing a day that future-you will screenshot. {eur}.",
    "Vs that ~€95 monthly reference: +{ugandaGap} today. Geography is wild. Your grind isn’t.",
    "{buses} bus tickets of revenue. Express lane only.",
    "Fire, but tasteful. Like a clean green accent — not a neon nightclub.",
    "The pending queue can smell success. Clear it while {eur} is loud.",
    "{coffees} coffees. Hydrate anyway. Champions hydrate.",
    "Signup velocity {signups} + check velocity {checks} = spicy dashboard.",
    "Hot streak protocol: ship, smile, don’t break prod.",
    "This is ‘walk a little taller in the office’ money: {eur}.",
    "Fuel tank: {fuel}L equivalent. Metaphor holds. Physics doesn’t. Math does.",
    "Keep the sport vibe light. Heavy ego crashes. {eur} doesn’t need ego.",
    "If the mood chip says blaze, believe it — then go fix one ticket.",
    "{kebabs} kebabs on fire (metaphorically). Extinguish pending tickets instead.",
    "Hot day, cool fonts. {eur} does the shouting so you don’t have to.",
    "{netflix} months of binge budget. Binge publishing instead.",
    "{burgers} burgers of heat. Waitstaff = your support inbox. Be nice.",
    "Fire lane: {eur}. Safety briefing: hydrate, publish, don’t deploy on vibes alone.",
    "{beers} beers of heat — celebrate after the queue looks calmer.",
    "Spicy metrics: {checks} checks. Spicy ledger: {eur}. Mild manners: required.",
    "This is the ‘don’t get cocky, do get shipping’ bracket. {signups} new witnesses.",
    "{gymDays} day-passes of fire energy. Legs day = pending day.",
    "Uganda monthly benchmark left in the dust by {ugandaGap} — today. Wild.",
    "Heat without burnout: automate the boring, enjoy the {eur}.",
    "If this were a grill, you’d be medium-rare success. Temperature: {eur}.",
    "Fire days create legends. Legends still answer tickets. {checks} checks today.",
    "Tasteful blaze. No alarm bells. Just {eur} and a cleaner queue.",
    "Hot streak insurance policy: one careful deploy, many happy reports.",
  ],
  legend: [
    "Full send: {eur} today. That’s {ugandaGap} more than Uganda’s ~€95 monthly average — absurd flex, earned.",
    "{checks} VIN checks. You’ve basically inspected a small town’s worth of cars.",
    "{signups} signups. The internet noticed. Be nice about it.",
    "Legend bracket unlocked: {eur}. Soft eyes, hard results.",
    "≈{pizzas} pizzas. Feed the team metaphors. Ship the reports.",
    "Per check {perCheck} · {checks} checks. This is a factory with good taste.",
    "Today alone clears a monthly wage benchmark by {ugandaGap}. Stay humble, stay rapid.",
    "Cinema tickets equivalent: ~{movies}. Blockbuster ops day.",
    "Legend mode is quiet confidence, not shouting fonts. {eur} does the talking.",
    "{coffees} coffees of runway. Please still sleep.",
    "Signups {signups}. Checks {checks}. Revenue {eur}. Triple threat.",
    "You could buy ~{plants} plants. Buy another reliable provider timeout budget instead.",
    "This is the screenshot day. Also the ‘don’t get cocky’ day. {eur}.",
    "Fuel metaphor overload: {fuel}L. Dashboard still loads. You’re fine.",
    "Pole position money with soft contrast UI. Peak adulting.",
    "The Uganda salary joke writes itself: +{ugandaGap} today. Reality is uneven. Your hustle isn’t.",
    "Legend days create tomorrow’s boring reliability. Protect the boring.",
    "{ramen} ramen nights. Celebrate with a clean publish queue.",
    "If this were a racing game, you’d be on the podium sipping water like a professional.",
    "Keep themes easy on the eyes. Keep revenue hard on the goals. {eur}.",
    "{kebabs} legendary kebabs of revenue. Extra chili = extra caution in deploys.",
    "Legend bracket: {eur}. Humility bracket: still reply to users.",
    "{netflix} months of content money. Your content is truth-in-VIN.",
    "{burgers} burgers. Stack them. Then stack published reports higher.",
    "This is ‘call your past self and say it worked’ money: {eur}.",
    "{beers} beers of legend — toast once, then clear the last pending.",
    "Small town of cars checked ({checks}). Big town energy in the ledger.",
    "Legends don’t ghost {signups} new users. Legends onboard them.",
    "{gymDays} day-passes of mythic grind. Myths still hit publish.",
    "Beat the ~€95/mo Uganda reference by {ugandaGap} in a single day. Stay kind.",
    "Factory mode with taste: {perCheck} avg · {checks} units · {eur} total.",
    "Podium day. Water bottle day. Ticket-triage day. All three. {eur}.",
    "If luck knocked, craftsmanship answered. Craftsmanship looks like {eur}.",
    "Legend mode soft UI / hard numbers. Numbers: {eur}. Soft: your patience.",
    "Print the dashboard for the scrapbook. Then go make tomorrow boringly good.",
  ],
};

/** Universal lines mixed into every bucket for extra variety. */
const WILDCARDS: string[] = [
  "{checks} checks today. Each one is someone trying not to get scammed. Nice work.",
  "{signups} signups. Fresh wallets, fresh VINs, fresh tickets — in a good way.",
  "Scoreboard: {eur} · {checks} checks · {signups} signups. Refresh for a new pep talk.",
  "Somewhere a dealer just got less mysterious because of your stack. {checks} times.",
  "If motivation were a feature flag, it would be on. {eur} agrees.",
  "Tiny reminder: pending reports don’t publish themselves. {signups} users are waiting on vibes.",
  "You vs yesterday is the only race that matters. Today’s car is painted {eur}.",
  "Checks {checks}. That’s a lot of 17-character poems called VINs.",
  "Signups {signups}. Onboarding is a love language.",
  "Money is a lagging indicator of trust. Trust looks like {checks} completed checks.",
  "May your cache hit rate be high and your chargebacks be folklore.",
  "Admin tip: hydrated founders ship prettier themes. Also {eur} helps.",
  "The algorithm of today: open · check · charge · delight · repeat. Currently at {eur}.",
  "You’re not chasing vanity metrics. Okay, maybe a little. {signups} signups look good.",
  "A quiet flex: people pay for clarity. Clarity sold {checks} times.",
  "If this line feels random, good — so is product-market luck. {eur} is less random.",
  "Keep the UI soft. Keep the SLA sharp. Keep the jokes coming.",
  "Report quality > report quantity. Quantity today: {checks}. Quality: your problem.",
  "New users ({signups}) don’t know your roadmap. They know if the page felt premium.",
  "This pep talk will mutate on refresh. Your revenue goals shouldn’t.",
  "{eur} today. That’s {kebabs} kebabs or {coffees} coffees — pick your coping meal.",
  "Fun fact: {buses} bus rides of revenue. Destination: fewer salvage surprises.",
  "Your average check ({perCheck}) is a tiny story about trust. You sold {checks} stories.",
  "Signup math: {signups} new people. Product math: don’t make them bounce.",
  "If the pending queue were a gym, today is leg day. Revenue watching from the treadmill: {eur}.",
  "Dealers fear mystery VINs. You sold {checks} anti-mystery potions.",
  "Reminder written in green: {eur} is nice. Reliability is nicer.",
  "Somewhere a buyer avoided a flood car because of data like yours. {checks} attempts today.",
  "Refresh again for a new joke. The ledger will still say {eur}.",
  "{burgers} burgers of budget. Mayo optional. Uptime mandatory.",
  "Your competitors can copy colors. They can’t copy {signups} people who already trusted you.",
  "Beers of metaphor: {beers}. Decisions of legend: ship the pending.",
  "{netflix} months of binge. Binge on closing tickets instead.",
  "Gym-day equivalent: {gymDays}. Sweat equity looks like published reports.",
  "Plants you could buy: {plants}. Growth you already bought: {signups} signups.",
  "Fuel-can math: {fuel}L. Please spend it on servers, not drama.",
  "Movies you could watch: {movies}. Plot you already starring in: {eur} day.",
  "Ramen nights funded: {ramen}. Soul funded: clearing the queue.",
  "Pizza count: {pizzas}. Don’t tip the spam bots.",
  "Uganda ~€95/mo benchmark gap today: {ugandaGap}. Context is wild. Execution isn’t.",
  "Every refresh is a new fortune cookie. Fortune: {eur} with {checks} checks.",
  "If this were a RPG, XP = {checks}, gold = {eur}, party members = {signups}.",
  "Support inbox is a dungeon. Revenue {eur} is the loot. Go be the hero politely.",
  "Premium feel is a feature. {signups} new users are grading it live.",
  "You can’t A/B test hustle. You can refresh this line. Hustle still pays {eur}.",
];

export function pickAdminMotivation(input: AdminMotivationInput, seed = Math.random()): string {
  const bucket = bucketForRevenue(input.revenue);
  const pool = [...LINES[bucket], ...WILDCARDS];
  const vars = buildVars(input);
  const idx = Math.abs(Math.floor(seed * pool.length)) % pool.length;
  return fill(pool[idx]!, vars);
}

export function adminMotivationPoolSize(): number {
  return (
    Object.values(LINES).reduce((n, arr) => n + arr.length, 0) + WILDCARDS.length
  );
}
