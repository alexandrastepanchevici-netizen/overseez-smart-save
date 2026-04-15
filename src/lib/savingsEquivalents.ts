import { convertCurrency } from '@/components/CurrencySwitcher';

interface Equivalent {
  emoji: string;
  singular: string;
  plural: string;
  usdCost: number;
}

const EQUIVALENTS: Equivalent[] = [
  { emoji: '☕', singular: 'coffee',          plural: 'coffees',           usdCost: 4  },
  { emoji: '🍺', singular: 'pint at a bar',   plural: 'pints at a bar',    usdCost: 7  },
  { emoji: '🏋️', singular: 'gym session',     plural: 'gym sessions',      usdCost: 10 },
  { emoji: '🎬', singular: 'cinema ticket',   plural: 'cinema tickets',    usdCost: 12 },
  { emoji: '🍽️', singular: 'restaurant meal', plural: 'restaurant meals',  usdCost: 15 },
  { emoji: '📺', singular: 'month of Netflix', plural: 'months of Netflix', usdCost: 15 },
  { emoji: '⛽', singular: 'tank of petrol',  plural: 'tanks of petrol',   usdCost: 60 },
  { emoji: '🎮', singular: 'new game',         plural: 'new games',         usdCost: 60 },
  { emoji: '✈️', singular: 'budget flight',   plural: 'budget flights',    usdCost: 80 },
];

export interface SavingsEquivalent {
  emoji: string;
  count: number;
  label: string;
}

/**
 * Returns up to 2 real-world equivalents for a given savings amount.
 * Filters to items where count is between 1 and 30 (avoids "4000 coffees"),
 * then picks the most impressive (highest usdCost) items first.
 */
export function getEquivalents(
  totalSaved: number,
  displayCurrency: string,
): SavingsEquivalent[] {
  if (totalSaved <= 0) return [];

  return EQUIVALENTS
    .map(eq => {
      const cost = convertCurrency(eq.usdCost, 'USD', displayCurrency);
      const count = Math.floor(totalSaved / cost);
      return { emoji: eq.emoji, count, label: count === 1 ? eq.singular : eq.plural, usdCost: eq.usdCost };
    })
    .filter(r => r.count >= 1 && r.count <= 30)
    .sort((a, b) => b.usdCost - a.usdCost)
    .slice(0, 2)
    .map(({ emoji, count, label }) => ({ emoji, count, label }));
}
