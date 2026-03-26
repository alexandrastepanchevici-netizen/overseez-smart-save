import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona' },
];

// Simple exchange rates relative to USD (approximate)
const RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  CHF: 0.88,
  SEK: 10.45,
};

export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  if (fromCode === toCode) return amount;
  const inUSD = amount / (RATES_TO_USD[fromCode] || 1);
  return inUSD * (RATES_TO_USD[toCode] || 1);
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || '$';
}

interface CurrencySwitcherProps {
  value: string;
  onChange: (code: string) => void;
  compact?: boolean;
}

export default function CurrencySwitcher({ value, onChange, compact = false }: CurrencySwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-full px-3 py-1.5 text-xs hover:bg-muted/70 transition-colors"
      >
        <span className="font-semibold">{current.symbol}</span>
        {!compact && <span className="text-muted-foreground">{current.code}</span>}
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-lg py-1 animate-fade-in" style={{ zIndex: 9999 }}>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c.code); setOpen(false); }}
              className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-muted transition-colors ${c.code === value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              <span>{c.symbol} {c.label}</span>
              {c.code === value && <span className="text-overseez-blue text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
