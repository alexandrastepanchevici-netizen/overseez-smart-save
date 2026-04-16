import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import FloatingOvals from '@/components/FloatingOvals';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol, normalizeCurrencyCode } from '@/components/CurrencySwitcher';
import { Search, MapPin, Building2, X, ThumbsUp, ThumbsDown } from 'lucide-react';
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
  const [voteEntryId, setVoteEntryId] = useState<string | null>(null);
  const [voteStoreName, setVoteStoreName] = useState('');

  // Linger CTA: show "Did you shop here?" after 3 s on a result card
  const [lingerPlace, setLingerPlace] = useState<Place | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Restore last search results from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('overseez:search_state');
      if (!saved) return;
      const { query: q, result: r, bankInfo: b, combinedPlaces: p } = JSON.parse(saved);
      if (q) setQuery(q);
      if (r) setResult(r);
      if (b) setBankInfo(b);
      if (p?.length) setCombinedPlaces(p);
    } catch {}
  }, []);

  // Persist results to sessionStorage whenever a completed search is in state
  useEffect(() => {
    if (!result || !combinedPlaces.length) return;
    try {
      sessionStorage.setItem('overseez:search_state', JSON.stringify({ query, result, bankInfo, combinedPlaces }));
    } catch {}
  }, [result, combinedPlaces, bankInfo, query]);

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

  // Check for 24h price accuracy follow-ups on mount
  useEffect(() => {
    if (!user) return;
    const pending: { entryId: string; savedAt: number; storeName: string }[] = JSON.parse(
      localStorage.getItem('overseez_vote_pending') || '[]'
    );
    const now = Date.now();
    const due = pending.find(p => now - p.savedAt >= 24 * 3600000);
    if (due) {
      toast('Was the price accurate?', {
        description: `You saved at ${due.storeName} yesterday. Rate the price to help others.`,
        action: {
          label: '👍 Rate now',
          onClick: () => setVoteEntryId(due.entryId),
        },
        duration: 8000,
      });
    }
  }, [user]);

  const submitVote = async (entryId: string, vote: 'accurate' | 'inaccurate') => {
    if (!user) return;
    await supabase.from('price_votes' as any).upsert(
      { user_id: user.id, entry_id: entryId, vote },
      { onConflict: 'user_id,entry_id' }
    );
    // Remove from pending
    const pending: { entryId: string; savedAt: number; storeName: string }[] = JSON.parse(
      localStorage.getItem('overseez_vote_pending') || '[]'
    );
    localStorage.setItem('overseez_vote_pending', JSON.stringify(pending.filter(p => p.entryId !== entryId)));
    setVoteEntryId(null);
    toast.success(vote === 'accurate' ? '👍 Thanks for confirming!' : '👎 Got it — we\'ll flag this price.');
  };

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
    sessionStorage.removeItem('overseez:search_state');

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
      // Show top 3 fully; indices 3-4 are blurred paywall teasers

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

    const { data: entryData } = await supabase.from('savings_entries').insert({
      user_id: user.id,
      store_name: spendModal.place.name,
      amount_saved: Math.max(0, saved),
      amount_spent: spent,
      average_price: spendModal.avgVal,
      currency: displayCurrency,
      search_query: query,
      ...(selectedGoalId ? { goal_id: selectedGoalId } : {}),
    } as any).select('id').single();

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
      // Store for 24h accuracy follow-up
      if (entryData?.id) {
        const pending: { entryId: string; savedAt: number; storeName: string }[] = JSON.parse(
          localStorage.getItem('overseez_vote_pending') || '[]'
        );
        pending.push({ entryId: entryData.id, savedAt: Date.now(), storeName: spendModal.place!.name });
        localStorage.setItem('overseez_vote_pending', JSON.stringify(pending));
        setVoteEntryId(entryData.id);
        setVoteStoreName(spendModal.place!.name);
      }
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
              <button onClick={() => { setQuery(''); setResult(null); setCombinedPlaces([]); sessionStorage.removeItem('overseez:search_state'); }}>
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
          <div className="flex items-center">
            <CurrencySwitcher value={displayCurrency} onChange={setDisplayCurrency} compact />
          </div>
        </div>

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
                <span className="text-xs bg-overseez-green/10 text-overseez-green border border-overseez-green/25 rounded-full px-3 py-1">
                  🏷 {t('search.salesFound', { count: result.sales.length })}
                </span>
              )}
            </div>

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

                // Blur results 4-5 (indices 3-4) for free users as paywall teasers
                const isBlurred = !subscribed && i >= 3;

                if (isBlurred) {
                  return (
                    <div key={i} className="relative animate-card-in" style={{ animationDelay: `${i * 0.06}s` }}>
                      {/* Blurred card beneath */}
                      <div className={`bg-card border rounded-xl p-4 pointer-events-none select-none blur-sm opacity-50 ${
                        place.isSale ? 'border-overseez-green/30' : 'border-border'
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
                        <p className="text-sm font-semibold text-overseez-gold">🔒 {combinedPlaces.length - 3} cheaper result{combinedPlaces.length - 3 !== 1 ? 's' : ''} hidden</p>
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
                      place.isSale ? 'border-overseez-green/30 bg-gradient-to-br from-card to-overseez-green/5' : 'border-border'
                    }`}
                    style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${i === 0 ? 'bg-foreground/15 text-foreground border border-foreground/30' : 'bg-muted text-muted-foreground border border-border'}
                        ${place.isSale ? 'bg-overseez-green/15 text-overseez-green border-overseez-green/30' : ''}`}>
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
                            <span className="text-[10px] bg-overseez-green/15 text-overseez-green border border-overseez-green/30 px-2 py-0.5 rounded-full font-bold">
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
                          <p className="text-xs text-overseez-green font-semibold mt-1">{place.saleLabel}</p>
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
                        {saving > 0 && <p className="text-xs font-semibold mt-0.5 text-overseez-green">▼ {currencySymbol}{saving.toFixed(2)}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/50">
                      <button onClick={() => openExternalUrl(mapsUrl)}
                        className="text-xs text-overseez-blue hover:underline flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {loc ? '📍 Get Directions' : t('search.viewOnMaps')}
                      </button>
                      <button onClick={() => {
                        setSpendModal({ open: true, place, avgVal: displayedAverage });
                        setSpendInput(displayedPrice.toFixed(2));
                      }}
                        className="text-sm font-semibold bg-overseez-green/20 border border-overseez-green/40 text-overseez-green rounded-lg px-5 py-2 hover:bg-overseez-green/30 transition-colors active:scale-95">
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

      {/* Price accuracy vote prompt */}
      {voteEntryId && !spendModal.open && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-30 animate-fade-in-up">
          <div className="bg-card border border-overseez-green/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="min-w-0 mr-3">
              <p className="text-[11px] text-muted-foreground">Was the price accurate?</p>
              <p className="text-sm font-semibold truncate">{voteStoreName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => submitVote(voteEntryId, 'inaccurate')}
                className="flex items-center gap-1.5 text-xs text-overseez-red bg-overseez-red/10 border border-overseez-red/30 rounded-full px-3 py-1.5 hover:bg-overseez-red/20 transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" /> No
              </button>
              <button onClick={() => submitVote(voteEntryId, 'accurate')}
                className="flex items-center gap-1.5 text-xs text-overseez-green bg-overseez-green/10 border border-overseez-green/30 rounded-full px-3 py-1.5 hover:bg-overseez-green/20 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" /> Yes
              </button>
              <button onClick={() => setVoteEntryId(null)} className="text-xs text-muted-foreground px-2 hover:text-foreground">✕</button>
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
