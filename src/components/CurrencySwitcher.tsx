import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira' },
  { code: 'PLN', symbol: 'zł', label: 'Polish Zloty' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar' },
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
  INR: 83.2,
  NGN: 1580,
  GHS: 12.5,
  KES: 130,
  ZAR: 18.6,
  BRL: 5.0,
  MXN: 17.2,
  KRW: 1330,
  CNY: 7.25,
  AED: 3.67,
  TRY: 32.5,
  PLN: 4.0,
  SGD: 1.34,
  HKD: 7.82,
};

const SYMBOL_OR_COUNTRY_TO_CODE: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  'CHF': 'CHF',
  'kr': 'SEK',
  'C$': 'CAD',
  'A$': 'AUD',
  '₹': 'INR',
  '₦': 'NGN',
  '₩': 'KRW',
  '₺': 'TRY',
  'S$': 'SGD',
  'HK$': 'HKD',
  'R$': 'BRL',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
  JP: 'JPY',
  CH: 'CHF',
  SE: 'SEK',
  IN: 'INR',
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  BR: 'BRL',
  MX: 'MXN',
  KR: 'KRW',
  CN: 'CNY',
  AE: 'AED',
  TR: 'TRY',
  PL: 'PLN',
  SG: 'SGD',
  HK: 'HKD',
};

export function normalizeCurrencyCode(input: string): string {
  if (!input) return 'USD';
  const cleaned = input.trim().toUpperCase();
  return RATES_TO_USD[cleaned] ? cleaned : (SYMBOL_OR_COUNTRY_TO_CODE[input] || SYMBOL_OR_COUNTRY_TO_CODE[cleaned] || 'USD');
}

export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  const from = normalizeCurrencyCode(fromCode);
  const to = normalizeCurrencyCode(toCode);
  if (from === to) return amount;
  const inUSD = amount / (RATES_TO_USD[from] || 1);
  return inUSD * (RATES_TO_USD[to] || 1);
}

export function getCurrencySymbol(code: string): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCIES.find(c => c.code === normalized)?.symbol || '$';
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
    <div ref={ref} className="relative z-[120]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-full px-3 py-1.5 text-xs hover:bg-muted/70 transition-colors"
      >
        <span className="font-semibold">{current.symbol}</span>
        {!compact && <span className="text-muted-foreground">{current.code}</span>}
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 max-h-[60vh] overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-[130] py-1 animate-fade-in">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c.code); setOpen(false); }}
              className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-muted transition-colors ${c.code === value ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              <span>{c.symbol} {c.label}</span>
              {c.code === value && <Check className="w-3.5 h-3.5 text-overseez-blue" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
