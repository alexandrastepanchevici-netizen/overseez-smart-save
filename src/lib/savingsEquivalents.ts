import { convertCurrency } from '@/components/CurrencySwitcher';

interface Equivalent {
  icon: string;
  singular: string;
  plural: string;
  usdCost: number;
}

const EQUIVALENTS: Equivalent[] = [
  { icon: 'Coffee',          singular: 'coffee',           plural: 'coffees',            usdCost: 4  },
  { icon: 'GlassWater',      singular: 'pint at a bar',    plural: 'pints at a bar',     usdCost: 7  },
  { icon: 'Dumbbell',        singular: 'gym session',      plural: 'gym sessions',       usdCost: 10 },
  { icon: 'Film',            singular: 'cinema ticket',    plural: 'cinema tickets',     usdCost: 12 },
  { icon: 'UtensilsCrossed', singular: 'restaurant meal',  plural: 'restaurant meals',   usdCost: 15 },
  { icon: 'Tv',              singular: 'month of Netflix', plural: 'months of Netflix',  usdCost: 15 },
  { icon: 'Fuel',            singular: 'tank of petrol',   plural: 'tanks of petrol',    usdCost: 60 },
  { icon: 'Gamepad2',        singular: 'new game',         plural: 'new games',          usdCost: 60 },
  { icon: 'Plane',           singular: 'budget flight',    plural: 'budget flights',     usdCost: 80 },
];

export interface SavingsEquivalent {
  icon: string;
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
      return { icon: eq.icon, count, label: count === 1 ? eq.singular : eq.plural, usdCost: eq.usdCost };
    })
    .filter(r => r.count >= 1 && r.count <= 30)
    .sort((a, b) => b.usdCost - a.usdCost)
    .slice(0, 2)
    .map(({ icon, count, label }) => ({ icon, count, label }));
}
