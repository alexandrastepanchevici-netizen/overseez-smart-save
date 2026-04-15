import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import FloatingOvals from '@/components/FloatingOvals';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol, normalizeCurrencyCode } from '@/components/CurrencySwitcher';
import { Search, MapPin, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStreak } from '@/hooks/useStreak';
import { useAchievements } from '@/hooks/useAchievements';
import { useHaptics } from '@/hooks/useHaptics';
import { useXP, XP_EVENTS } from '@/hooks/useXP';
import { openExternalUrl } from '@/lib/openExternalUrl';

interface Place {
  rank: number;
  name: string;
  type: string;
  price: string;
  priceValue: number;
  distance: string;
  tip: string;
  searchQuery: string;
  isSale?: boolean;
  saleLabel?: string;
  originalPrice?: string;
  originalPriceValue?: number;
  expires?: string;
}

interface SearchResult {
  category: string;
  averagePrice: string;
  averageValue: number;
  currency: string;
  unit: string;
  insight: string;
  places: Place[];
  sales: any[];
}

function getCategoryEmoji(type: string): string {
  if (!type) return '📍';
  const t = type.toLowerCase();
  if (t.includes('grocer') || t.includes('supermarket')) return '🛒';
  if (t.includes('petrol') || t.includes('fuel')) return '⛽';
  if (t.includes('coffee') || t.includes('café')) return '☕';
  if (t.includes('hotel')) return '🏨';
  if (t.includes('pharmacy')) return '💊';
  if (t.includes('takeaway') || t.includes('fast food')) return '🍔';
  if (t.includes('gym')) return '🏋';
  return '📍';
}

const FREE_LIMIT = 5;

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SearchPage() {
  const { user, subscribed, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { recordActivity } = useStreak();
  const { checkAchievements } = useAchievements();
  const { tapMedium, tapSuccess } = useHaptics();
  const { addXP } = useXP();
  const [query, setQuery] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [combinedPlaces, setCombinedPlaces] = useState<Place[]>([]);
  const [error, setError] = useState('');
  const [loc, setLoc] = useState<{ lat: number; lng: number; city: string; cc: string } | null>(null);
  const [locStatus, setLocStatus] = useState(t('search.locationNotSet'));
  const [customLocation, setCustomLocation] = useState('');
  const [useCustomLoc, setUseCustomLoc] = useState(false);
  const [usageLeft, setUsageLeft] = useState(FREE_LIMIT);
  const [resetCountdown, setResetCountdown] = useState('');
  const [oldestUsageTime, setOldestUsageTime] = useState<number | null>(null);
  const [spendModal, setSpendModal] = useState<{ open: boolean; place: Place | null; avgVal: number }>({
    open: false, place: null, avgVal: 0,
  });
  const [spendInput, setSpendInput] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [userGoals, setUserGoals] = useState<{ id: string; name: string; emoji: string }[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  // Linger CTA: show "Did you shop here?" after 3 s on a result card
  const [lingerPlace, setLingerPlace] = useState<Place | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const profileCurrency = normalizeCurrencyCode(profile?.currency || 'USD');
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem('overseez_display_currency') || profileCurrency);

  useEffect(() => {
    setDisplayCurrency(profileCurrency);
  }, [profileCurrency]);

  const resultCurrencyCode = normalizeCurrencyCode(result?.currency || profileCurrency);
  const currencySymbol = getCurrencySymbol(displayCurrency);

  const toDisplay = (amount: number, fromCode: string = resultCurrencyCode) =>
    convertCurrency(amount, fromCode, displayCurrency);

  const formatDisplay = (amount: number, fromCode: string = resultCurrencyCode) =>
    `${currencySymbol}${toDisplay(amount, fromCode).toFixed(2)}`;

  const QUICK_SEARCHES = [
    { label: t('search.groceries'), q: 'Groceries & supermarkets' },
    { label: t('search.petrol'), q: 'Petrol & fuel stations' },
    { label: t('search.coffee'), q: 'Coffee shops & cafés' },
    { label: t('search.hotels'), q: 'Budget hotels & accommodation' },
    { label: t('search.pharmacy'), q: 'Pharmacies & medicines' },
    { label: t('search.takeaway'), q: 'Takeaway & fast food' },
  ];

  // Check usage and get oldest usage timestamp for timer
  useEffect(() => {
    if (!user || subscribed) return;
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    supabase.from('ai_usage').select('id, created_at', { count: 'exact' })
      .eq('user_id', user.id).gte('created_at', since)
      .order('created_at', { ascending: true })
      .then(({ data, count }) => {
        const used = count || 0;
        setUsageLeft(Math.max(0, FREE_LIMIT - used));
        if (data && data.length > 0) {
          setOldestUsageTime(new Date(data[0].created_at).getTime());
        } else {
          setOldestUsageTime(null);
        }
      });
  }, [user, result, subscribed]);

  // Live countdown timer
  useEffect(() => {
    if (subscribed || oldestUsageTime === null || usageLeft >= FREE_LIMIT) {
      setResetCountdown('');
      return;
    }
    const resetAt = oldestUsageTime + 24 * 3600000;
    const tick = () => {
      const remaining = resetAt - Date.now();
      if (remaining <= 0) {
        setResetCountdown('');
        setUsageLeft(prev => Math.min(FREE_LIMIT, prev + 1));
        setOldestUsageTime(null);
        return;
      }
      setResetCountdown(formatCountdown(remaining));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [oldestUsageTime, subscribed, usageLeft]);

  // Load user goals when spend modal opens
  useEffect(() => {
    if (!spendModal.open || !user) return;
    setSelectedGoalId(null);
    supabase
      .from('savings_goals' as any)
      .select('id, name, emoji')
      .eq('user_id', user.id)
      .order('created_at')
      .then(({ data }) => setUserGoals((data as any[]) ?? []));
  }, [spendModal.open, user]);

  // Linger detection via IntersectionObserver (works on mobile touch)
  useEffect(() => {
    if (!combinedPlaces.length) { setLingerPlace(null); return; }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = parseInt((entry.target as HTMLElement).dataset.idx ?? '-1', 10);
          if (idx < 0) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
            lingerTimerRef.current = setTimeout(() => {
              setLingerPlace(combinedPlaces[idx]);
            }, 3000);
          } else {
            if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
          }
        }
      },
      { threshold: 0.75 },
    );

    cardRefs.current.forEach(el => { if (el) observer.observe(el); });

    return () => {
      observer.disconnect();
      if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
    };
  }, [combinedPlaces]);

  // Cycle loading step messages while search is in progress
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 1200);
    const t2 = setTimeout(() => setLoadingStep(2), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

  // Request location — uses Capacitor plugin on Android, browser API on web
  const requestLocation = useCallback(async () => {
    setLocStatus(t('search.detecting'));
    try {
      let lat: number, lng: number;
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        if (!navigator.geolocation) { setLocStatus(t('search.locationUnavailable')); return; }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const city = d.address?.city || d.address?.town || d.address?.village || 'your area';
        const cc = (d.address?.country_code || 'GB').toUpperCase();
        setLoc({ lat, lng, city, cc });
        setLocStatus(city);
      } catch {
        setLoc({ lat, lng, city: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, cc: 'GB' });
        setLocStatus(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      }
    } catch {
      setLocStatus(t('search.locationUnavailable'));
    }
  }, [t]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Geolocation.checkPermissions().then(p => {
        if (p.location === 'granted') requestLocation();
      }).catch(() => {});
    } else {
      navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then(p => {
        if (p.state === 'granted') requestLocation();
      }).catch(() => {});
    }
  }, [requestLocation]);

  const doSearch = async (q?: string) => {
    const searchQ = q || query;
    if (!searchQ.trim()) return;
    if (!subscribed && usageLeft <= 0) {
      toast.error(t('search.usedUp'), {
        action: { label: t('search.upgrade'), onClick: () => navigate('/subscription') },
      });
      return;
    }
    setQuery(searchQ);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (user) {
        await supabase.from('ai_usage').insert({
          user_id: user.id,
          question: searchQ,
          ...(loc ? { city: loc.city, country_code: loc.cc } : {}),
        } as any);
      }

      const searchBody: any = {
        query: searchQ,
        bankName: bankName || undefined,
        userCurrency: displayCurrency,
      };
      if (useCustomLoc && customLocation.trim()) {
        searchBody.customCity = customLocation.trim();
      } else {
        searchBody.lat = loc?.lat;
        searchBody.lng = loc?.lng;
        searchBody.city = loc?.city;
        searchBody.countryCode = loc?.cc;
      }
      const { data, error: fnErr } = await supabase.functions.invoke('search', {
        body: searchBody,
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      const r = data.result as SearchResult;
      setResult(r);
      setBankInfo(data.bankInfo);

      const salesAsPlaces: Place[] = (r.sales || []).map((s: any) => ({
        rank: 0, name: s.name, type: s.type,
        price: s.salePrice, priceValue: s.salePriceValue,
        distance: s.distance, tip: s.tip, searchQuery: s.searchQuery,
        isSale: true, saleLabel: s.saleLabel,
        originalPrice: s.originalPrice, originalPriceValue: s.originalPriceValue,
        expires: s.expires,
      }));

      const combined = [...(r.places || []), ...salesAsPlaces]
        .filter(p => p.priceValue != null)
        .sort((a, b) => a.priceValue - b.priceValue)
        .slice(0, 5)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      setCombinedPlaces(combined);
      if (!subscribed) setUsageLeft(prev => Math.max(0, prev - 1));
      tapMedium();

      // Record streak, XP, and check achievements after successful search
      if (user) {
        recordActivity();
        addXP(XP_EVENTS.SEARCH);
        const isStudentSearch = searchQ.toLowerCase().includes('student');
        const isAfterMidnight = new Date().getHours() === 0 || new Date().getHours() < 4;
        const { count: searchCountData } = await supabase
          .from('ai_usage')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        checkAchievements({
          totalSavedUSD: profile?.total_saved || 0,
          searchCount: searchCountData || 0,
          streakDays: (profile as any)?.current_streak || 0,
          isStudentSearch,
          isSubscribed: subscribed,
          isAfterMidnight,
        });
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const logSaving = async () => {
    if (!spendModal.place || !user) return;
    const spent = parseFloat(spendInput);
    if (isNaN(spent) || spent < 0) return;
    const saved = spendModal.avgVal - spent;

    await supabase.from('savings_entries').insert({
      user_id: user.id,
      store_name: spendModal.place.name,
      amount_saved: Math.max(0, saved),
      amount_spent: spent,
      average_price: spendModal.avgVal,
      currency: displayCurrency,
      search_query: query,
      ...(selectedGoalId ? { goal_id: selectedGoalId } : {}),
    } as any);

    if (saved > 0) {
      const { data: prof } = await supabase.from('profiles').select('total_saved')
        .eq('user_id', user.id).single();
      if (prof) {
        const savedInProfileCurrency = convertCurrency(Math.max(0, saved), displayCurrency, profileCurrency);
        await supabase.from('profiles').update({
          total_saved: Number(prof.total_saved) + savedInProfileCurrency,
        }).eq('user_id', user.id);
      }
      addXP(XP_EVENTS.SAVE);
      tapSuccess();
      toast.success(t('search.youSaved', { amount: `${currencySymbol}${saved.toFixed(2)}` }));
    } else {
      toast.info(t('search.logged'));
    }

    setSpendModal({ open: false, place: null, avgVal: 0 });
    setSpendInput('');
    setSelectedGoalId(null);
  };

  const bankFeeRate = bankInfo ? (bankInfo.overseasFeePercent || 0) / 100 : 0;

  return (
    <div className="min-h-screen bg-background relative pb-20 md:pb-0">
      <FloatingOvals />
      <AppNav />

      {/* Search Header */}
      <div className="sticky top-14 z-40 border-b border-border bg-overseez-mid px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-muted/50 border border-border rounded-full px-4 py-2 focus-within:border-foreground/30 focus-within:bg-muted/80 transition-all">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={t('search.placeholder')}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1" />
            {query && (
              <button onClick={() => { setQuery(''); setResult(null); setCombinedPlaces([]); }}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-full px-3 py-2 min-w-[130px]">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
              placeholder={t('search.yourBank')}
              className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground w-20" />
          </div>
          <Button onClick={() => doSearch()} variant="hero" size="sm" disabled={loading || !query.trim()}>
            {t('search.searchBtn')}
          </Button>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="border-b border-border bg-overseez-mid px-4 py-2">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
          {QUICK_SEARCHES.map(c => (
            <button key={c.q} onClick={() => doSearch(c.q)}
              className="text-xs text-foreground/80 bg-muted/30 border border-border rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-muted/60 transition-colors flex-shrink-0">
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Discount Chips */}
      <div className="border-b border-border bg-overseez-mid/60 px-4 py-2">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto items-center">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex-shrink-0">🎓 Student</span>
          {[
            { label: 'Transport pass', q: 'Student transport pass & discount travel cards' },
            { label: 'Meal deals', q: 'Student meal deals & cheap restaurants near campus' },
            { label: 'Gym', q: 'Student gym membership & fitness centres' },
            { label: 'Phone plans', q: 'Student phone plans & SIM deals' },
            { label: 'Software & tech', q: 'Student software deals & tech discounts' },
            { label: 'Textbooks', q: 'Cheap textbooks & second-hand books' },
          ].map(c => (
            <button key={c.q} onClick={() => doSearch(c.q)}
              className="text-xs text-overseez-blue bg-overseez-blue/10 border border-overseez-blue/30 rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-overseez-blue/20 transition-colors flex-shrink-0">
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Location + Usage */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {!useCustomLoc ? (
              <>
                <div className={`w-2 h-2 rounded-full ${loc ? 'bg-foreground' : 'bg-muted-foreground/30'}`} />
                <span>{locStatus}</span>
                <button onClick={requestLocation} className="text-overseez-blue hover:underline">
                  📍 {loc ? t('search.refresh') : t('search.enableLocation')}
                </button>
                <button onClick={() => setUseCustomLoc(true)} className="text-overseez-blue hover:underline ml-1">
                  🌍 {t('search.searchCity')}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span>🌍</span>
                <input
                  type="text"
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  placeholder={t('search.cityPlaceholder')}
                  className="bg-muted/50 border border-border rounded-md px-2 py-1 text-xs text-foreground outline-none w-40 focus:border-foreground/30"
                />
                <button onClick={() => { setUseCustomLoc(false); setCustomLocation(''); }} className="text-overseez-blue hover:underline">
                  📍 {t('search.useMyLocation')}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 text-xs text-muted-foreground">
            <div className="mb-1 sm:mb-0 sm:mr-2">
              <CurrencySwitcher value={displayCurrency} onChange={setDisplayCurrency} compact />
            </div>
            {subscribed ? (
              <span className="text-overseez-green font-semibold">{t('search.unlimited')}</span>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span>
                  {t('search.freeLeft')} <span className="font-semibold text-foreground">{usageLeft}</span> / {FREE_LIMIT}
                </span>
                {resetCountdown && (
                  <span className="text-overseez-blue font-mono text-[11px] bg-overseez-blue/10 border border-overseez-blue/20 rounded-full px-2.5 py-0.5">
                    {t('search.nextCredit')} {resetCountdown}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        {!subscribed && (
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-all duration-500 ${usageLeft <= 1 ? 'bg-overseez-red' : usageLeft <= 2 ? 'bg-overseez-gold' : 'bg-overseez-blue'}`}
              style={{ width: `${(usageLeft / FREE_LIMIT) * 100}%` }} />
          </div>
        )}

        {/* Bank Notice */}
        {bankInfo && (
          <div className="bg-overseez-gold/10 border border-overseez-gold/25 rounded-lg px-4 py-2.5 mb-4 text-xs text-overseez-gold">
            🏦 <strong>{bankInfo.bankName}</strong> {t('search.overseasFee')}: <strong>{bankInfo.overseasFeePercent}%</strong> — {bankInfo.feeDescription}
          </div>
        )}

        {/* Welcome State */}
        {!loading && !result && !error && (
          <div className="text-center py-16 animate-fade-in-up">
            <h2 className="text-4xl font-display font-bold tracking-tight mb-3 overseez-text-gradient">{t('search.overseezAI')}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t('search.welcomeDesc', { currency: displayCurrency })}
            </p>
            <div className="inline-flex items-center gap-2 bg-muted/30 border border-border rounded-full px-4 py-2 mt-4 text-xs text-muted-foreground">
              {t('search.bankSalesNote')}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="flex justify-center gap-1.5 mb-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i}
                  className="w-2.5 h-2.5 rounded-full animate-pulse-dot"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    backgroundColor: ['#fff', '#60a5fa', '#fbbf24', '#f87171'][i],
                  }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground transition-all duration-300">
              {[t('search.loadingStep0'), t('search.loadingStep1'), t('search.loadingStep2')][loadingStep]}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-overseez-red/10 border border-overseez-red/25 rounded-lg p-4 text-sm text-overseez-red mb-4">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && combinedPlaces.length > 0 && (
          <div className="animate-fade-in-up">
            <p className="text-xs text-muted-foreground mb-3">
              {t('search.results', { count: combinedPlaces.length, query })}
              {loc ? t('search.nearCity', { city: loc.city }) : ''}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs bg-overseez-gold/10 text-overseez-gold border border-overseez-gold/25 rounded-full px-3 py-1">
                📊 {t('search.areaAverage')} {formatDisplay(result.averageValue)}
              </span>
              {result.sales?.length > 0 && (
                <span className="text-xs bg-overseez-red/10 text-overseez-red border border-overseez-red/25 rounded-full px-3 py-1">
                  🏷 {t('search.salesFound', { count: result.sales.length })}
                </span>
              )}
            </div>

            {result.insight && (
              <div className="bg-overseez-blue/10 border border-overseez-blue/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-[11px] font-bold text-overseez-blue uppercase tracking-wider mb-1">⚡ {t('search.aiInsight')}</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{result.insight}</p>
              </div>
            )}

            <div className="space-y-3">
              {combinedPlaces.map((place, i) => {
                const displayedAverage = toDisplay(result.averageValue);
                const displayedPrice = toDisplay(place.priceValue);
                const displayedOriginalPrice = place.originalPriceValue != null ? toDisplay(place.originalPriceValue) : null;
                const feeAmount = bankFeeRate > 0 ? displayedPrice * bankFeeRate : 0;
                const effectivePrice = displayedPrice + feeAmount;
                const saving = displayedAverage - effectivePrice;
                const mapsQuery = place.searchQuery || place.name;
                const mapsUrl = loc
                  ? `https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${encodeURIComponent(mapsQuery + (loc.city ? ' ' + loc.city : ''))}&travelmode=walking`
                  : `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;

                // Blur the last result for free users when there are 5 results
                const isBlurred = !subscribed && combinedPlaces.length === 5 && i === combinedPlaces.length - 1;

                if (isBlurred) {
                  return (
                    <div key={i} className="relative animate-card-in" style={{ animationDelay: `${i * 0.06}s` }}>
                      {/* Blurred card beneath */}
                      <div className={`bg-card border rounded-xl p-4 pointer-events-none select-none blur-sm opacity-50 ${
                        place.isSale ? 'border-overseez-red/30' : 'border-border'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold">#{place.rank}</div>
                          <div className="w-14 h-14 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-2xl">{getCategoryEmoji(place.type)}</div>
                          <div className="flex-1"><p className="text-sm font-semibold">{place.name}</p><p className="text-xs text-muted-foreground mt-1">{place.type} · ~{place.distance}</p></div>
                          <div className="text-right flex-shrink-0"><p className="text-lg font-bold">{currencySymbol}{displayedPrice.toFixed(2)}</p></div>
                        </div>
                      </div>
                      {/* Upgrade overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-xl border border-overseez-gold/30">
                        <p className="text-sm font-semibold text-overseez-gold">🔒 1 cheaper result hidden</p>
                        <p className="text-xs text-muted-foreground mt-1">Upgrade to Premium to unlock</p>
                        <button
                          onClick={() => navigate('/subscription')}
                          className="mt-3 text-xs bg-overseez-gold/20 border border-overseez-gold/40 text-overseez-gold rounded-full px-4 py-1.5 hover:bg-overseez-gold/30 transition-colors font-medium"
                        >
                          Unlock Now →
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i}
                    ref={el => { cardRefs.current[i] = el; }}
                    data-idx={i}
                    className={`bg-card border rounded-xl p-4 animate-card-in overseez-card-hover ${
                      place.isSale ? 'border-overseez-red/30 bg-gradient-to-br from-card to-overseez-red/5' : 'border-border'
                    }`}
                    style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-foreground/15 text-foreground border border-foreground/30' : 'bg-muted text-muted-foreground border border-border'}
                        ${place.isSale ? 'bg-overseez-red/15 text-overseez-red border-overseez-red/30' : ''}`}>
                        #{place.rank}
                      </div>

                      <div className="w-14 h-14 rounded-lg bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 text-2xl">
                        {getCategoryEmoji(place.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{place.name}</span>
                          {i === 0 && <span className="text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-semibold">{t('search.cheapest')}</span>}
                          {place.isSale && (
                            <span className="text-[10px] bg-overseez-red/15 text-overseez-red border border-overseez-red/30 px-2 py-0.5 rounded-full font-bold">
                              🏷 {t('search.sale')}
                            </span>
                          )}
                        </div>
                        {(place as any).websiteUrl && (
                          <a href={(place as any).websiteUrl} target="_blank" rel="noopener" className="text-xs text-overseez-blue/70 hover:underline mt-0.5 block truncate max-w-[250px]">
                            {(place as any).websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                          </a>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span>{place.type}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>~{place.distance}</span>
                          {saving > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="font-semibold text-foreground">{t('search.saveVsAvg', { amount: `${currencySymbol}${saving.toFixed(2)}` })}</span>
                            </>
                          )}
                        </div>
                        {place.isSale && place.saleLabel && (
                          <p className="text-xs text-overseez-red font-semibold mt-1">{place.saleLabel}</p>
                        )}
                        <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{place.tip}</p>
                        {place.expires && (
                          <p className="text-[11px] text-overseez-gold/80 italic mt-1">⏱ {place.expires}</p>
                        )}
                        {bankFeeRate > 0 && (
                          <div className="text-[11px] text-overseez-gold bg-overseez-gold/8 rounded px-2 py-1 mt-1.5 border border-overseez-gold/15">
                            + {currencySymbol}{feeAmount.toFixed(2)} {t('search.overseasFee')} = <strong>{currencySymbol}{effectivePrice.toFixed(2)} {t('search.trueCost')}</strong>
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-lg font-bold">{currencySymbol}{displayedPrice.toFixed(2)}</p>
                        {place.isSale && displayedOriginalPrice != null && (
                          <p className="text-xs text-muted-foreground/40 line-through">{currencySymbol}{displayedOriginalPrice.toFixed(2)}</p>
                        )}
                        {bankFeeRate > 0 && (
                          <p className="text-xs text-overseez-gold font-semibold">{t('search.bankFee')} {currencySymbol}{effectivePrice.toFixed(2)}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">{t('search.avg')} {currencySymbol}{displayedAverage.toFixed(2)}</p>
                        {saving > 0 && <p className="text-xs font-semibold mt-0.5">▼ {currencySymbol}{saving.toFixed(2)}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border/50">
                      <button onClick={() => openExternalUrl(mapsUrl)}
                        className="text-xs text-overseez-blue hover:underline flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {loc ? '📍 Get Directions' : t('search.viewOnMaps')}
                      </button>
                      <button onClick={() => {
                        setSpendModal({ open: true, place, avgVal: displayedAverage });
                        setSpendInput(displayedPrice.toFixed(2));
                      }}
                        className="text-xs bg-muted/50 border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors">
                        🏷 {t('search.iSavedHere')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Linger CTA — shown after 3 s on a result card, hidden when keyboard is up */}
      {lingerPlace && !spendModal.open && !searchFocused && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-30 animate-fade-in-up">
          <div className="bg-card border border-overseez-blue/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="min-w-0 mr-3">
              <p className="text-[11px] text-muted-foreground">Did you shop here?</p>
              <p className="text-sm font-semibold truncate">{lingerPlace.name}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setLingerPlace(null)}
                className="text-xs text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
              >
                Not now
              </button>
              <Button variant="hero" size="sm" onClick={() => {
                const avg = toDisplay(result!.averageValue);
                setSpendModal({ open: true, place: lingerPlace, avgVal: avg });
                setSpendInput(toDisplay(lingerPlace.priceValue).toFixed(2));
                setLingerPlace(null);
              }}>
                Log Saving
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spend Modal */}
      {spendModal.open && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setSpendModal({ open: false, place: null, avgVal: 0 }); setSelectedGoalId(null); }}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-semibold mb-1">{t('search.spendTitle')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('search.spendDesc', { name: spendModal.place?.name })}
            </p>
            <input type="number" min="0" step="0.01" value={spendInput}
              onChange={e => setSpendInput(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-foreground/30 mb-3" />
            {userGoals.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1.5">Count toward a goal? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {userGoals.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGoalId(selectedGoalId === g.id ? null : g.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selectedGoalId === g.id
                          ? 'bg-overseez-blue/20 border-overseez-blue/50 text-overseez-blue font-medium'
                          : 'bg-muted/40 border-border text-foreground/70 hover:bg-muted/70'
                      }`}
                    >
                      {g.emoji} {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setSpendModal({ open: false, place: null, avgVal: 0 }); setSelectedGoalId(null); }}>
                {t('search.cancel')}
              </Button>
              <Button variant="hero" size="sm" onClick={logSaving}>{t('search.logSaving')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
