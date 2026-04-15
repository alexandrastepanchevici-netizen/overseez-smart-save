import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { CheckCircle2, Mail, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';

// ─── Constants ───────────────────────────────────────────────────────────────

const DESTINATION_CHIPS = [
  { label: '🇬🇧 London', city: 'London', currency: 'GBP' },
  { label: '🇨🇦 Toronto', city: 'Toronto', currency: 'CAD' },
  { label: '🇦🇺 Sydney', city: 'Sydney', currency: 'AUD' },
  { label: '🇩🇪 Berlin', city: 'Berlin', currency: 'EUR' },
  { label: '🇮🇪 Dublin', city: 'Dublin', currency: 'EUR' },
  { label: '🇦🇺 Melbourne', city: 'Melbourne', currency: 'AUD' },
  { label: '🇨🇦 Vancouver', city: 'Vancouver', currency: 'CAD' },
  { label: '🇫🇷 Paris', city: 'Paris', currency: 'EUR' },
];

const CITY_CURRENCY: Record<string, string> = {
  london: 'GBP', manchester: 'GBP', birmingham: 'GBP', edinburgh: 'GBP', glasgow: 'GBP',
  toronto: 'CAD', vancouver: 'CAD', montreal: 'CAD', calgary: 'CAD',
  sydney: 'AUD', melbourne: 'AUD', brisbane: 'AUD', perth: 'AUD',
  berlin: 'EUR', munich: 'EUR', hamburg: 'EUR', frankfurt: 'EUR',
  amsterdam: 'EUR', paris: 'EUR', dublin: 'EUR', barcelona: 'EUR', madrid: 'EUR',
  'new york': 'USD', 'los angeles': 'USD', boston: 'USD', chicago: 'USD', seattle: 'USD',
  singapore: 'SGD', dubai: 'AED', 'hong kong': 'HKD', tokyo: 'JPY',
};

const CITY_AVG_SAVINGS: Record<string, number> = {
  london: 68, manchester: 55, birmingham: 52, edinburgh: 58, glasgow: 54,
  toronto: 74, vancouver: 79, montreal: 65, calgary: 70,
  sydney: 82, melbourne: 79, brisbane: 71, perth: 73,
  berlin: 52, munich: 58, hamburg: 50, frankfurt: 55,
  amsterdam: 65, paris: 63, dublin: 61, barcelona: 57, madrid: 55,
  'new york': 71, 'los angeles': 68, boston: 71, chicago: 65,
  singapore: 89, dubai: 280, 'hong kong': 650, tokyo: 8500,
};

const ORIGIN_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'ZA', name: 'S. Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'US', name: 'USA', flag: '🇺🇸', currency: 'USD' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED' },
];

const PAIN_POINTS = [
  { id: 'overcharged', icon: '😰', title: "I don't know if I'm being overcharged", sub: 'Prices feel random and confusing' },
  { id: 'disappears', icon: '💸', title: 'My money disappears faster than expected', sub: 'Exchange rates and fees eat my budget' },
  { id: 'localspots', icon: '🛒', title: "I don't know the cheap spots locals use", sub: "I'm paying tourist prices without knowing" },
  { id: 'runout', icon: '📉', title: "I'm scared of running out before term ends", sub: 'I need to track where every pound goes' },
];

const PAIN_STATS: Record<string, string> = {
  overcharged: 'Students overpay an avg of £11/week on groceries alone without knowing it',
  disappears: 'Bank fees cost the avg international student £8.40/month without them realising',
  localspots: '73% of students find a cheaper option in their first Overseez search',
  runout: '1 in 3 international students runs short of money before term ends',
};

function getEquivalence(goal: number, sym: string): string {
  if (goal <= 20) return `That's ${sym}${goal} = 4 fewer takeaway coffees a month`;
  if (goal <= 40) return `That's ${sym}${goal} = a full week of groceries`;
  if (goal <= 60) return `That's ${sym}${goal} = 4 fewer Deliveroo orders`;
  if (goal <= 80) return `That's ${sym}${goal} = a monthly gym membership`;
  if (goal <= 100) return `That's ${sym}${goal} = 2 months of streaming subscriptions`;
  if (goal <= 150) return `That's ${sym}${goal} = a weekend mini-trip`;
  return `That's ${sym}${goal} = a flight back home`;
}

function getCityAvgSavings(city: string): number {
  return CITY_AVG_SAVINGS[city.toLowerCase()] ?? 65;
}

function getCityCurrency(city: string): string {
  return CITY_CURRENCY[city.toLowerCase()] ?? 'GBP';
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingData {
  city: string;
  destCurrency: string;
  originCountry: typeof ORIGIN_COUNTRIES[0] | null;
  painPoints: string[];
  savingsGoal: number;
  firstName: string;
  email: string;
  password: string;
}

const TOTAL_STEPS = 8;

// ─── Shared UI ───────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-400 ${i < step ? 'bg-overseez-blue' : 'bg-muted'}`} />
      ))}
    </div>
  );
}

function StepWrap({ children, onBack, step }: { children: React.ReactNode; onBack?: () => void; step: number }) {
  return (
    <div className="min-h-screen overseez-gradient-hero flex flex-col items-center justify-start p-5 pt-12" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          {onBack ? (
            <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}
          <OverseezLogo size={56} color="white" />
        </div>
        <ProgressBar step={step} />
        <div key={step} className="animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}

function BigTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-display font-bold tracking-tight mb-2 leading-tight">{children}</h1>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mb-6">{children}</p>;
}

function PillBtn({ onClick, className = '', children }: { onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${className}`}>
      {children}
    </button>
  );
}

// ─── Step 1 — Destination city ───────────────────────────────────────────────

function Step1({ onNext }: { onNext: (city: string, currency: string) => void }) {
  const [city, setCity] = useState('');

  const select = (c: string, cur: string) => {
    setCity(c);
    setTimeout(() => onNext(c, cur), 300);
  };

  const submit = () => {
    if (!city.trim()) return;
    onNext(city.trim(), getCityCurrency(city.trim()));
  };

  return (
    <>
      <BigTitle>Where are you heading?</BigTitle>
      <Sub>Find the best prices. Keep more of your money.</Sub>

      <div className="flex flex-wrap gap-2 mb-6">
        {DESTINATION_CHIPS.map(c => (
          <PillBtn key={c.city} onClick={() => select(c.city, c.currency)}
            className={`${city === c.city ? 'bg-overseez-blue/20 border-overseez-blue text-overseez-blue' : 'bg-muted/30 border-border text-foreground/80 hover:border-foreground/30'}`}>
            {c.label}
          </PillBtn>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Or type your city..."
          className="flex-1 bg-muted/40 border border-border rounded-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-overseez-blue/50 transition-colors"
        />
        <button onClick={submit} disabled={!city.trim()}
          className="bg-overseez-blue text-white rounded-full px-5 py-3 text-sm font-medium disabled:opacity-40 transition-opacity">
          →
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">Used by 12,000+ students worldwide</p>
    </>
  );
}

// ─── Step 2 — Origin country ─────────────────────────────────────────────────

function Step2({ onNext, onBack }: { onNext: (country: typeof ORIGIN_COUNTRIES[0]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<typeof ORIGIN_COUNTRIES[0] | null>(null);

  const pick = (c: typeof ORIGIN_COUNTRIES[0]) => {
    setSelected(c);
    setTimeout(() => onNext(c), 300);
  };

  return (
    <>
      <BigTitle>Where are you from?</BigTitle>
      <Sub>We'll show prices in your home currency too</Sub>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {ORIGIN_COUNTRIES.map(c => (
          <button key={c.code} onClick={() => pick(c)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${selected?.code === c.code ? 'border-overseez-blue bg-overseez-blue/10 scale-105' : 'border-border bg-card/50 hover:border-foreground/20'}`}>
            <span className="text-3xl">{c.flag}</span>
            <span className="text-[11px] font-medium text-center leading-tight">{c.name}</span>
          </button>
        ))}
      </div>

      <button onClick={() => onNext({ code: 'OTHER', name: 'Other', flag: '🌍', currency: 'USD' })}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
        + My country isn't listed
      </button>
    </>
  );
}

// ─── Step 3 — Pain point ─────────────────────────────────────────────────────

function Step3({ onNext, onBack }: { onNext: (points: string[]) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 2 ? [...p, id] : p);
  };

  return (
    <>
      <BigTitle>What's your biggest money worry?</BigTitle>
      <Sub>Be honest — we've heard it all</Sub>

      <div className="space-y-3 mb-8">
        {PAIN_POINTS.map(p => (
          <button key={p.id} onClick={() => toggle(p.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selected.includes(p.id) ? 'border-overseez-blue bg-overseez-blue/10' : 'border-border bg-card/50 hover:border-foreground/20'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold leading-snug">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.sub}</p>
              </div>
              {selected.includes(p.id) && (
                <div className="ml-auto w-5 h-5 rounded-full bg-overseez-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-white">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button onClick={() => onNext(selected)} disabled={selected.length === 0}
        className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold disabled:opacity-40 transition-opacity">
        Let's fix that →
      </button>
    </>
  );
}

// ─── Step 4 — Currency theatre (auto-advance) ─────────────────────────────────

function Step4({ city, destCurrency, originCountry, onNext }: {
  city: string; destCurrency: string; originCountry: typeof ORIGIN_COUNTRIES[0] | null; onNext: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);

  const destSym = getCurrencySymbol(destCurrency);
  const homeCurrency = originCountry?.currency || 'USD';
  const homeSym = getCurrencySymbol(homeCurrency);
  const destAmount = 50;
  const homeAmount = convertCurrency(destAmount, destCurrency, homeCurrency);
  const avgSavings = getCityAvgSavings(city);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 400);
    const t2 = setTimeout(() => setBtnVisible(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <BigTitle>Here's what your money actually buys</BigTitle>

      <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              {originCountry?.flag} At home
            </p>
            <p className="text-2xl font-display font-bold">{homeSym}{homeAmount.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">equiv. {destSym}{destAmount} in {city}</p>
          </div>
          <div className="bg-overseez-blue/10 border border-overseez-blue/30 rounded-xl p-5 text-center">
            <p className="text-[11px] uppercase tracking-wider text-overseez-blue font-medium mb-2">
              🇬🇧 In {city}
            </p>
            <p className="text-2xl font-display font-bold text-overseez-blue">{destSym}{destAmount}</p>
            <p className="text-xs text-muted-foreground mt-1">for the same groceries</p>
          </div>
        </div>

        <div className="bg-overseez-green/10 border border-overseez-green/25 rounded-xl p-4 mb-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">Students like you in {city} save an average of</p>
          <p className="text-2xl font-display font-bold text-overseez-green">{destSym}{avgSavings}/month</p>
          <p className="text-xs text-muted-foreground mt-1">using Overseez to find better prices</p>
        </div>
      </div>

      <button onClick={onNext}
        className={`w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold transition-all duration-500 ${btnVisible ? 'opacity-100' : 'opacity-0'}`}>
        That's why I'm here →
      </button>
    </>
  );
}

// ─── Step 5 — Savings goal slider ────────────────────────────────────────────

function Step5({ destCurrency, onNext, onBack }: { destCurrency: string; onNext: (goal: number) => void; onBack: () => void }) {
  const [goal, setGoal] = useState(60);
  const sym = getCurrencySymbol(destCurrency);
  const presets = [30, 60, 100];

  return (
    <>
      <BigTitle>Set a monthly savings target</BigTitle>
      <Sub>Drag to your goal — we'll help you hit it every month</Sub>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="text-center mb-6">
          <p className="text-5xl font-display font-bold tracking-tight text-overseez-blue">{sym}{goal}</p>
          <p className="text-sm text-muted-foreground mt-1">per month</p>
        </div>

        <input
          type="range" min={10} max={200} step={5} value={goal}
          onChange={e => setGoal(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer mb-4"
          style={{ accentColor: 'hsl(200 80% 55%)' }}
        />

        <div className="flex justify-between mb-6">
          {presets.map(p => (
            <button key={p} onClick={() => setGoal(p)}
              className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${goal === p ? 'bg-overseez-blue/20 border-overseez-blue text-overseez-blue font-medium' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
              {sym}{p}
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground italic">{getEquivalence(goal, sym)}</p>
      </div>

      <button onClick={() => onNext(goal)}
        className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold">
        Set my goal →
      </button>
      <p className="text-center text-xs text-muted-foreground mt-3">You can change this any time</p>
    </>
  );
}

// ─── Step 6 — First name ─────────────────────────────────────────────────────

function Step6({ onNext, onBack }: { onNext: (name: string) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => { if (name.trim().length >= 1) onNext(name.trim()); };

  return (
    <>
      <BigTitle>What should we call you?</BigTitle>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Your first name"
          autoCapitalize="words"
          className="w-full bg-transparent text-3xl font-display font-semibold text-center outline-none placeholder:text-muted-foreground/40 py-4"
        />
        <p className="text-center text-xs text-muted-foreground mt-2">Just your first name is fine</p>
      </div>

      <button onClick={submit} disabled={name.trim().length < 1}
        className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold disabled:opacity-40 transition-opacity">
        {name.trim() ? `Hi ${name.trim()}, let's go →` : 'Continue →'}
      </button>
    </>
  );
}

// ─── Step 7 — Aha moment ─────────────────────────────────────────────────────

function Step7({ data, onNext, onBack }: { data: OnboardingData; onNext: () => void; onBack: () => void }) {
  const [count, setCount] = useState(0);
  const avgMonthly = getCityAvgSavings(data.city);
  const termSavings = avgMonthly * 6;
  const destSym = getCurrencySymbol(data.destCurrency);
  const homeCurrency = data.originCountry?.currency || 'USD';
  const homeSym = getCurrencySymbol(homeCurrency);
  const termInHome = convertCurrency(termSavings, data.destCurrency, homeCurrency);
  const primaryPain = data.painPoints[0];
  const painStat = primaryPain ? PAIN_STATS[primaryPain] : null;

  useEffect(() => {
    const dur = 1200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setCount(Math.round(termSavings * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [termSavings]);

  const QUICK_SEARCHES = [
    { label: '🛒 Groceries', q: 'Groceries & supermarkets' },
    { label: '☕ Coffee', q: 'Coffee shops & cafés' },
    { label: '🚌 Transport', q: 'Student transport pass & discount travel cards' },
    { label: '📱 Phone plans', q: 'Student SIM deals & phone plans' },
  ];

  return (
    <>
      <h1 className="text-2xl font-display font-bold tracking-tight mb-1">
        {data.firstName}, here's your savings forecast
      </h1>
      <p className="text-sm text-muted-foreground mb-5">Based on students like you in {data.city}</p>

      {/* Hero projection */}
      <div className="bg-gradient-to-br from-overseez-blue/20 to-overseez-green/10 border border-overseez-blue/30 rounded-2xl p-6 mb-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">If you shop smart this term</p>
        <p className="text-5xl font-display font-bold tabular-nums text-foreground">{destSym}{count}</p>
        <p className="text-sm text-muted-foreground mt-1">estimated savings over 6 months</p>
        {homeCurrency !== data.destCurrency && (
          <div className="mt-3 bg-card/40 rounded-xl px-4 py-2 inline-block">
            <p className="text-sm font-semibold text-overseez-green">
              = {homeSym}{termInHome.toFixed(0)} back home {data.originCountry?.flag}
            </p>
          </div>
        )}
      </div>

      {/* Pain point stat */}
      {painStat && (
        <div className="bg-overseez-gold/10 border border-overseez-gold/25 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-overseez-gold font-medium">⚡ Did you know?</p>
          <p className="text-sm text-foreground/85 mt-0.5">{painStat}</p>
        </div>
      )}

      {/* First search prompt */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <p className="text-xs text-muted-foreground mb-3">Try your first search right after signup:</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_SEARCHES.map(s => (
            <div key={s.q} className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-foreground/80 text-center">
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onNext}
        className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold">
        Create my free account →
      </button>
      <p className="text-center text-xs text-muted-foreground mt-3">No card needed. Free forever.</p>
    </>
  );
}

// ─── Step 8 — Account creation ───────────────────────────────────────────────

function Step8({ firstName, onSubmit, onBack, loading, error }: {
  firstName: string; onSubmit: (email: string, password: string) => void;
  onBack: () => void; loading: boolean; error: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [fieldErr, setFieldErr] = useState('');

  const submit = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setFieldErr('Please enter a valid email address'); return; }
    if (password.length < 6) { setFieldErr('Password must be at least 6 characters'); return; }
    if (!terms) { setFieldErr('Please accept the terms to continue'); return; }
    setFieldErr('');
    onSubmit(email.trim(), password);
  };

  return (
    <>
      <BigTitle>Save your progress</BigTitle>
      <Sub>One step to create your free account — no card needed</Sub>

      <div className="space-y-3 mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email address"
          autoComplete="email"
          className="w-full bg-muted/40 border border-border rounded-xl px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-overseez-blue/50 transition-colors"
        />
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Create a password (6+ characters)"
            autoComplete="new-password"
            className="w-full bg-muted/40 border border-border rounded-xl px-4 py-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-overseez-blue/50 transition-colors"
          />
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <label className="flex items-start gap-3 mb-5 cursor-pointer">
        <div onClick={() => setTerms(p => !p)}
          className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-colors ${terms ? 'bg-overseez-blue border-overseez-blue' : 'border-border'}`}>
          {terms && <span className="text-[10px] text-white font-bold">✓</span>}
        </div>
        <span className="text-xs text-muted-foreground leading-relaxed">
          I agree to the{' '}
          <Link to="/terms" className="text-overseez-blue hover:underline">Terms & Conditions</Link>
        </span>
      </label>

      {(fieldErr || error) && (
        <p className="text-xs text-overseez-red bg-overseez-red/10 rounded-lg p-3 mb-4">{fieldErr || error}</p>
      )}

      <button onClick={submit} disabled={loading}
        className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
        ) : `Create account, ${firstName} →`}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-overseez-blue hover:underline">Log in</Link>
      </p>

      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-overseez-green" />
        <p className="text-xs text-muted-foreground">🔒 No spam. No card. Unsubscribe anytime.</p>
      </div>
    </>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ email }: { email: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-5">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-overseez-green/15 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-overseez-green" />
          </div>
          <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Check your inbox</h2>
          <p className="text-sm text-muted-foreground mb-1">We've sent a verification link to</p>
          <p className="text-sm font-semibold text-foreground mb-6">{email}</p>
          <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-overseez-green flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap the link in the email to activate your account, then log in to start saving.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full bg-overseez-blue text-white rounded-full py-4 text-sm font-semibold">
            Go to login →
          </button>
          <p className="text-xs text-muted-foreground mt-4">Didn't get it? Check your spam folder.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main controller ──────────────────────────────────────────────────────────

export default function Register() {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    city: '',
    destCurrency: 'GBP',
    originCountry: null,
    painPoints: [],
    savingsGoal: 60,
    firstName: '',
    email: '',
    password: '',
  });

  const update = useCallback((patch: Partial<OnboardingData>) => setData(p => ({ ...p, ...patch })), []);
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleSignUp = async (email: string, password: string) => {
    update({ email, password });
    setLoading(true);
    setSubmitError('');

    const nickname = data.firstName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 999);
    const referredBy = localStorage.getItem('overseez_ref') || '';
    const metadata: Record<string, string> = {
      full_name: data.firstName,
      nickname,
      birth_date: '',
      currency: data.destCurrency,
      study_city: data.city,
      ...(referredBy ? { referred_by: referredBy } : {}),
    };

    const { error } = await signUp(email, password, metadata);
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      localStorage.removeItem('overseez_ref');
      setSuccess(true);
    }
  };

  if (success) return <SuccessScreen email={data.email} />;

  const stepProps = { onBack: back };

  return (
    <>
      {step === 1 && (
        <StepWrap step={step}>
          <Step1 onNext={(city, currency) => { update({ city, destCurrency: currency }); next(); }} />
        </StepWrap>
      )}
      {step === 2 && (
        <StepWrap step={step} onBack={back}>
          <Step2 onNext={(country) => { update({ originCountry: country }); next(); }} onBack={back} />
        </StepWrap>
      )}
      {step === 3 && (
        <StepWrap step={step} onBack={back}>
          <Step3 onNext={(points) => { update({ painPoints: points }); next(); }} onBack={back} />
        </StepWrap>
      )}
      {step === 4 && (
        <StepWrap step={step} onBack={back}>
          <Step4 city={data.city} destCurrency={data.destCurrency} originCountry={data.originCountry} onNext={next} />
        </StepWrap>
      )}
      {step === 5 && (
        <StepWrap step={step} onBack={back}>
          <Step5 destCurrency={data.destCurrency} onNext={(goal) => { update({ savingsGoal: goal }); next(); }} onBack={back} />
        </StepWrap>
      )}
      {step === 6 && (
        <StepWrap step={step} onBack={back}>
          <Step6 onNext={(name) => { update({ firstName: name }); next(); }} onBack={back} />
        </StepWrap>
      )}
      {step === 7 && (
        <StepWrap step={step} onBack={back}>
          <Step7 data={data} onNext={next} onBack={back} />
        </StepWrap>
      )}
      {step === 8 && (
        <StepWrap step={step} onBack={back}>
          <Step8 firstName={data.firstName} onSubmit={handleSignUp} onBack={back} loading={loading} error={submitError} />
        </StepWrap>
      )}
    </>
  );
}
