/** Clear motivational one-liners for the admin Overview — visual only. */

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

/**
 * Rough Albania / Balkans / world reference points (EUR). Fun context only — not stats advice.
 * Albania average net monthly wage ≈ €500 (rounded); daily ≈ €17.
 */
const REFS = {
  albaniaMonth: 500,
  albaniaDay: 17,
  kosovoMonth: 450,
  italyDay: 90,
  germanyDay: 130,
  tiranaCoffee: 1.8,
  byrek: 1.2,
  tiranaLunch: 8,
  fuelLiter: 1.7,
  busTicket: 0.4,
  phoneMonth: 12,
};

type Vars = {
  eur: string;
  checks: string;
  signups: string;
  albaniaDayGap: string;
  albaniaMonthPct: string;
  daysOfWage: string;
  kosovoGap: string;
  coffees: string;
  byreks: string;
  lunches: string;
  fuel: string;
  buses: string;
  phoneMonths: string;
  perCheck: string;
  italyDays: string;
  germanyDays: string;
};

function buildVars(input: AdminMotivationInput): Vars {
  const revenue = Math.max(0, Number(input.revenue) || 0);
  const checks = Math.max(0, Math.round(Number(input.checks) || 0));
  const signups = Math.max(0, Math.round(Number(input.signups) || 0));
  const albaniaDayGap = Math.max(0, revenue - REFS.albaniaDay);
  const kosovoGap = Math.max(0, revenue - REFS.kosovoMonth / 30);
  const monthPct = Math.min(999, Math.round((revenue / REFS.albaniaMonth) * 100));

  return {
    eur: fmtMoney(revenue),
    checks: String(checks),
    signups: String(signups),
    albaniaDayGap: fmtMoney(albaniaDayGap),
    albaniaMonthPct: String(monthPct),
    daysOfWage: round1(revenue / REFS.albaniaDay),
    kosovoGap: fmtMoney(kosovoGap),
    coffees: round1(revenue / REFS.tiranaCoffee),
    byreks: round1(revenue / REFS.byrek),
    lunches: round1(revenue / REFS.tiranaLunch),
    fuel: round1(revenue / REFS.fuelLiter),
    buses: round1(revenue / REFS.busTicket),
    phoneMonths: round1(revenue / REFS.phoneMonth),
    perCheck: checks > 0 ? fmtMoney(revenue / checks) : "—",
    italyDays: round1(revenue / REFS.italyDay),
    germanyDays: round1(revenue / REFS.germanyDay),
  };
}

function fill(template: string, v: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = v[key as keyof Vars];
    return val ?? `{${key}}`;
  });
}

/**
 * Plain motivational lines by revenue bucket.
 * Placeholders: {eur} {checks} {signups} {albaniaDayGap} {albaniaMonthPct} {daysOfWage}
 * {kosovoGap} {coffees} {byreks} {lunches} {fuel} {buses} {phoneMonths} {perCheck}
 * {italyDays} {germanyDays}
 */
const LINES: Record<Bucket, string[]> = {
  quiet: [
    "Today so far: {eur}. Average Albanian daily wage is ~€17 — you’re building toward it.",
    "{eur} on the board. In Tirana that’s about {coffees} espressos of runway. Small start, real money.",
    "Quiet day: {eur}. Still {albaniaMonthPct}% of a typical Albanian monthly salary (~€500).",
    "{checks} VIN checks today. Every one is a buyer who chose trust over guessing.",
    "{signups} new signups. In Albania’s used-car market, each new account is a future report.",
    "Soft open at {eur}. One more sold report and this day looks different.",
    "You’re at {daysOfWage} days of an average Albanian wage. Early innings — keep going.",
    "{eur} ≈ {byreks} byrek. Local math, serious business.",
    "Low volume is fine. {checks} checks still mean {checks} people who didn’t buy blind.",
    "Compared to ~€17/day in Albania, you’re {albaniaDayGap} ahead (or warming up). Either way — ship.",
    "Revenue {eur} · checks {checks} · signups {signups}. Honest numbers, clear next step: one more sale.",
    "Quiet markets still need clear titles. You checked {checks} cars today.",
    "{eur} today could cover {phoneMonths} months of a typical Albanian phone plan. Momentum counts.",
    "Albania average monthly wage ~€500. Today: {eur} ({albaniaMonthPct}%). Room to grow — and you’re open.",
    "Slow day energy. {signups} people still trusted you enough to create an account.",
  ],
  warm: [
    "Nice pace: {eur} today — already more than the average Albanian daily wage (~€17) by {albaniaDayGap}.",
    "{eur} in. That’s about {lunches} Tirana lunches earned. Solid mid-gear.",
    "You’re at {daysOfWage} days of a typical Albanian salary — in one period. Keep the streak.",
    "{checks} VIN checks. Someone almost bought a mystery car — you sold them clarity instead.",
    "{signups} signups joined. Albania’s import/used market runs on trust — you just gained more of it.",
    "{eur} = {coffees} Tirana coffees. Or a serious step toward the ~€500 monthly average.",
    "Warm day: {albaniaMonthPct}% of an average Albanian monthly wage already booked.",
    "Per check average: {perCheck} across {checks} checks. Clean unit economics.",
    "Revenue {eur} · {checks} checks · {signups} signups. The trio is awake.",
    "Vs Kosovo’s ~€450/mo vibe (~€15/day), you’re ahead by about {kosovoGap} today. Balkan hustle.",
    "{eur} ≈ {fuel} liters of fuel at Albanian pump prices. Real-world value.",
    "You’re out-earning a full Albanian workday (~€17) by {albaniaDayGap}. Don’t slow down.",
    "{byreks} byrek of progress. Local fuel for a global product.",
    "Average Albanian monthly ~€500. You’ve covered {albaniaMonthPct}% today. Proud, then publish more.",
    "Warm cruise: {eur}. That’s trust turning into revenue in a market that hates surprises.",
  ],
  solid: [
    "Solid day: {eur}. That’s {daysOfWage} average Albanian workdays earned already.",
    "You’ve booked {albaniaMonthPct}% of a typical Albanian monthly salary (~€500) — in this period alone.",
    "{eur} locked. Roughly {lunches} Tirana restaurant lunches. Ops is feeding the business.",
    "{checks} checks done. That’s a supermarket parking lot of clearer buying decisions.",
    "{signups} people signed up. Your product is clearly not a rumor in this market.",
    "Per-check: {perCheck}. Spreadsheets would tip their hat — if they had one.",
    "Albania daily wage ~€17. You’re past it by {albaniaDayGap} today. Strong middle gear.",
    "Revenue {eur} · signups {signups}. The funnel is doing real work.",
    "{eur} ≈ {coffees} espressos on Rruga e Durrësit money. Celebrate briefly — then sell another report.",
    "World context: {italyDays} days of a rough Italian daily wage. Still impressive for a focused product.",
    "Solid green zone. {checks} VINs checked for buyers who want facts, not stories.",
    "You’re past ‘cute side project’ for the day. {eur} says so.",
    "{fuel} liters of fuel-equivalent revenue. Keep the tank on growth, not drama.",
    "Balkan scoreboard: beating a quiet daily wage (~€17) by {albaniaDayGap}. Execution > excuses.",
    "Trust sold {checks} times. New believers (signups): {signups}. Ledger: {eur}.",
  ],
  strong: [
    "Strong day: {eur} — {daysOfWage} average Albanian workdays in one go.",
    "That’s {albaniaMonthPct}% of a typical Albanian monthly salary (~€500) already. Serious pace.",
    "{checks} VIN checks. Not a sample — a fleet briefing for cautious buyers.",
    "{signups} signups. Your acquisition graph just did a push-up.",
    "Heat check: {eur}. More than an Albanian daily wage by {albaniaDayGap} — comfortably.",
    "Per check {perCheck} across {checks} runs. The machine is humming.",
    "You’re in ‘tell the team without shouting’ territory: {eur}.",
    "Albania ~€500/mo average. Today alone covers a big slice ({albaniaMonthPct}%). Keep shipping.",
    "World check: about {germanyDays} days of a rough German daily wage. Focused product, real pull.",
    "{lunches} Tirana lunches of revenue. Feed the roadmap, not the ego.",
    "Signup party of {signups}. Check party of {checks}. Revenue: {eur}.",
    "Strong ≠ stressful. Strong = {eur} with faster replies and clearer reports.",
    "You outpaced a full Albanian workday (~€17) by {albaniaDayGap}. Absurd in a good way.",
    "{coffees} Tirana coffees of runway. Stay hydrated. Stay shipping.",
    "Buyers in Albania and beyond paid for clarity {checks} times. That’s the business.",
  ],
  fire: [
    "Hot day: {eur}. That’s {daysOfWage} Albanian average workdays — earned, not wished.",
    "{albaniaMonthPct}% of a typical Albanian monthly wage (~€500) already. Fire with taste.",
    "{checks} checks. The servers deserve a tiny medal — and buyers deserve fast reports.",
    "{signups} new users. Don’t ghost them. Onboard them like they paid for trust (they will).",
    "Redline adjacent: {eur}. Past a daily Albanian wage by {albaniaDayGap}. Ledger is loud.",
    "Per-check {perCheck}. That’s not luck — that’s a product people in this market pay for.",
    "Today’s haul ≈ {lunches} Tirana lunches for a hungry team. Or one excellent growth day.",
    "Vs ~€17/day Albania average: +{albaniaDayGap} today. Geography is uneven. Your hustle isn’t.",
    "Fire tier: {eur}, {checks} lookups, {signups} joins. Keep quality higher than volume.",
    "World lens: ~{italyDays} Italian day-wages equivalent. Still grounded in Balkan demand.",
    "Hot streak protocol: sell clarity, publish clean, don’t break prod.",
    "This is ‘walk a little taller’ money: {eur}. Stay kind to every signup.",
    "{fuel}L fuel-equivalent. Spend it on uptime and speed — Albania’s buyers notice both.",
    "Spicy metrics: {checks} checks. Spicy ledger: {eur}. Mild manners with users: required.",
    "Average monthly wage left in the dust percentage-wise ({albaniaMonthPct}% already). Keep going.",
  ],
  legend: [
    "Full send: {eur}. That’s {daysOfWage} average Albanian workdays in a single period.",
    "Legend bracket: {albaniaMonthPct}% of a typical Albanian monthly salary (~€500) — already. Earned.",
    "{checks} VIN checks. You’ve basically inspected a small town’s worth of cars.",
    "{signups} signups. The internet — and the Albanian used-car crowd — noticed.",
    "Soft eyes, hard results: {eur}. Past daily wage (~€17) by {albaniaDayGap}.",
    "Per check {perCheck} · {checks} checks. A factory with good taste.",
    "Today clears a huge slice of the ~€500 Albania monthly benchmark. Stay humble, stay rapid.",
    "World context: ~{germanyDays} German day-wages equivalent. Still a Balkan-built trust product.",
    "Legend mode is quiet confidence. {eur} does the talking.",
    "{coffees} Tirana espressos of runway. Please still sleep.",
    "Signups {signups}. Checks {checks}. Revenue {eur}. Triple threat.",
    "This is the screenshot day — and the ‘don’t get cocky’ day. {eur}.",
    "Albania’s car market runs on fear of bad history. You sold anti-fear {checks} times.",
    "Podium day. Water bottle day. Fast support day. All three. {eur}.",
    "If luck knocked, craftsmanship answered. Craftsmanship looks like {eur}.",
  ],
};

/** Clear wildcards mixed into every bucket — always tied to real metrics. */
const WILDCARDS: string[] = [
  "{checks} checks today. Each one is someone trying not to get scammed. Nice work.",
  "{signups} new signups. Fresh accounts in a market that rewards clear vehicle history.",
  "Scoreboard: {eur} · {checks} checks · {signups} signups. Refresh for another pep talk.",
  "Average Albanian daily wage ~€17. Today: {eur} ({daysOfWage}× that day).",
  "Albania monthly average ~€500. You’ve covered about {albaniaMonthPct}% in this period.",
  "Tirana coffee math: {coffees} espressos of revenue. Real money, local scale.",
  "Byrek index: {byreks}. Silly unit. Serious business.",
  "Someone avoided a bad import because of data like yours. You ran {checks} checks.",
  "Money follows trust. Trust looks like {checks} completed VIN checks.",
  "New users ({signups}) don’t know your roadmap. They know if the report felt worth it.",
  "Your average check ({perCheck}) is a tiny story about trust. You sold {checks} stories.",
  "Signup math: {signups} new people. Product math: give them a reason to buy a report.",
  "Dealers fear mystery VINs. You sold {checks} doses of clarity.",
  "Reminder: {eur} is nice. Reliable reports are why it keeps happening.",
  "Buyers across Albania and the region paid for peace of mind {checks} times today.",
  "Competitors can copy colors. They can’t copy {signups} people who already trusted you.",
  "Phone-plan math: {phoneMonths} months of a typical Albanian mobile plan — in revenue.",
  "Bus-ticket index: {buses} urban rides of value. Destination: fewer salvage surprises.",
  "Fuel-can math: {fuel}L at local prices. Spend the energy on speed and uptime.",
  "Lunch index: {lunches} Tirana meals. Feed growth, not excuses.",
  "Every refresh is a new line. The ledger still says {eur}.",
  "If this were XP: checks = {checks}, gold = {eur}, party size = {signups}.",
  "Premium feel is a feature. {signups} new users are grading it live.",
  "You can’t A/B test hustle. You can keep selling clarity. Hustle still pays {eur}.",
  "Vs a quiet Albanian workday (~€17): you’re at {eur} — gap {albaniaDayGap}.",
  "Balkan context: even a Kosovo-style daily (~€15) is behind your {eur} pace by ~{kosovoGap}.",
  "World lens without the fluff: {italyDays}× a rough Italian day-wage equivalent.",
  "Clarity sold {checks} times. Accounts opened: {signups}. Cash: {eur}.",
  "Used cars in Albania move on WhatsApp and gut feel. You sell the opposite — {checks} times.",
  "Keep the UI soft. Keep support sharp. Keep the revenue honest: {eur}.",
];

function templateFits(template: string, input: AdminMotivationInput): boolean {
  const checks = Math.max(0, Math.round(Number(input.checks) || 0));
  const signups = Math.max(0, Math.round(Number(input.signups) || 0));
  if (checks === 0 && template.includes("{checks}")) return false;
  if (signups === 0 && template.includes("{signups}")) return false;
  if (checks === 0 && template.includes("{perCheck}")) return false;
  return true;
}

export function pickAdminMotivation(input: AdminMotivationInput, seed = Math.random()): string {
  const bucket = bucketForRevenue(input.revenue);
  const pool = [...LINES[bucket], ...WILDCARDS].filter((t) => templateFits(t, input));
  const fallback = LINES[bucket].filter((t) => !t.includes("{checks}") && !t.includes("{signups}"));
  const usePool = pool.length > 0 ? pool : fallback.length > 0 ? fallback : LINES[bucket];
  const vars = buildVars(input);
  const idx = Math.abs(Math.floor(seed * usePool.length)) % usePool.length;
  return fill(usePool[idx]!, vars);
}

export function adminMotivationPoolSize(): number {
  return (
    Object.values(LINES).reduce((n, arr) => n + arr.length, 0) + WILDCARDS.length
  );
}
