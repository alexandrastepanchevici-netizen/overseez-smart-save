import type { LeaderboardEntry } from '@/types/leaderboard';

const TARGET  = 20;
const MINIMUM = 16;

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed  = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Bot name pool ─────────────────────────────────────────────────────────────
const BOT_NICKNAMES = [
  'Alex B.',     'Jordan M.',   'Sam K.',      'Taylor H.',   'Morgan L.',
  'Casey R.',    'Riley P.',    'Jamie W.',    'Avery C.',    'Quinn T.',
  'Dana F.',     'Blake N.',    'Reese S.',    'Skyler O.',   'Drew V.',
  'Peyton G.',   'Finley A.',   'Hayden Z.',   'Rowan E.',    'Logan D.',
  'Charlie J.',  'Parker Y.',   'River X.',    'Scout U.',    'Sage I.',
  'Elliot Q.',   'Ellis W.',    'Remy B.',     'Arlo M.',     'Zara K.',
  'Nova H.',     'Leo F.',      'Mia C.',      'Kai R.',      'Ivy T.',
  'Theo N.',     'Luna S.',     'Finn O.',     'Wren V.',     'Cole G.',
  'Nora A.',     'Max Z.',      'Iris E.',     'Jude D.',     'Piper J.',
];

// ── Core utility ─────────────────────────────────────────────────────────────
export function fillLeaderboardWithBots(
  realEntries: LeaderboardEntry[],
  weekSeed?: number,
): LeaderboardEntry[] {
  if (realEntries.length >= TARGET) return realEntries.slice(0, TARGET);

  const botsNeeded = TARGET - realEntries.length;
  const now        = new Date();
  const seed       = weekSeed ?? (getISOWeek(now) * 10000 + now.getFullYear());
  const rand       = mulberry32(seed);

  // Score range — bots are distributed within the real users' range
  const scores     = realEntries.map(e => e.saveCount ?? 0);
  const maxScore   = scores.length ? Math.max(...scores) : 30;
  const minScore   = scores.length ? Math.max(1, Math.min(...scores)) : 5;
  const range      = Math.max(maxScore - minScore, 5);

  // Shuffle the name pool deterministically, then pick the first N
  const names = [...BOT_NICKNAMES];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  // Exclude names already used by real users
  const usedNames = new Set(realEntries.map(e => e.nickname));
  const available = names.filter(n => !usedNames.has(n));

  const bots: LeaderboardEntry[] = Array.from({ length: botsNeeded }, (_, i) => {
    // Spread bots evenly across the score range with ±10 % jitter
    const t         = (i + 1) / (botsNeeded + 1);          // 0..1
    const base      = minScore + t * range;
    const jitter    = (rand() - 0.5) * range * 0.2;
    const saveCount = Math.max(1, Math.round(base + jitter));

    return {
      rank:          0,                                     // re-assigned below
      userId:        `bot-${seed}-${i}`,
      nickname:      available[i % available.length] ?? `Player${i + 1}`,
      avatarUrl:     null,
      saveCount,
      isCurrentUser: false,
      isBot:         true,
    };
  });

  const merged = [...realEntries, ...bots]
    .sort((a, b) => (b.saveCount ?? 0) - (a.saveCount ?? 0))
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return merged;
}
