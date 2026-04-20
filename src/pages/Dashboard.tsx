import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import SavingsRecap from '@/components/SavingsRecap';
import MonthlyRecap from '@/components/MonthlyRecap';
import ShareCard from '@/components/ShareCard';
import NewUserWelcome from '@/components/NewUserWelcome';
import { TrendingUp, Calendar, Wallet, Trophy, Zap, Search as SearchIcon, Coffee, GlassWater, Dumbbell, Film, UtensilsCrossed, Tv, Fuel, Gamepad2, Plane, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { getEquivalents } from '@/lib/savingsEquivalents';
import { useNavigate } from 'react-router-dom';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const EQUIV_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Coffee, GlassWater, Dumbbell, Film, UtensilsCrossed, Tv, Fuel, Gamepad2, Plane,
};

const BASE_MILESTONES = [5, 25, 50, 100, 250, 500, 1000];

function getMilestones(total: number): number[] {
  let tier = 0;
  while (total >= 1000 * Math.pow(10, tier)) { tier++; }
  if (tier === 0) return BASE_MILESTONES;
  const base = 1000 * Math.pow(10, tier - 1);
  const top = 1000 * Math.pow(10, tier);
  return [base, Math.round(base * 2.5), Math.round(base * 5), Math.round(base * 10), Math.round(base * 25), Math.round(base * 50), top];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [savings, setSavings] = useState<any[]>([]);
  const [savingsExpanded, setSavingsExpanded] = useState(false);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem('overseez_display_currency') || 'USD');
  const [leagueRank, setLeagueRank] = useState<number | null>(null);
  const [usageLeft, setUsageLeft] = useState(5);
  const [resetCountdown, setResetCountdown] = useState('');
  const [oldestUsageTime, setOldestUsageTime] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    refreshProfile();
    supabase.from('savings_entries').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { if (data) setSavings(data); });
  }, [user]);

  // Fetch AI usage for dashboard counter
  const FREE_LIMIT = 5;
  useEffect(() => {
    if (!user || (profile as any)?.subscribed) return;
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    supabase.from('ai_usage').select('id, created_at', { count: 'exact' })
      .eq('user_id', user.id).gte('created_at', since)
      .order('created_at', { ascending: true })
      .then(({ data, count }) => {
        const used = count || 0;
        setUsageLeft(Math.max(0, FREE_LIMIT - used));
        if (data && data.length > 0) setOldestUsageTime(new Date(data[0].created_at).getTime());
        else setOldestUsageTime(null);
      });
  }, [user, profile]);

  // Tiered cooldown bonus from leaderboard finish
  const bonusHours = (profile as any)?.search_cooldown_bonus_hours ?? 0;
  const hasCooldownBonus =
    (profile as any)?.search_cooldown_bonus_at != null &&
    new Date((profile as any).search_cooldown_bonus_at) > new Date() &&
    bonusHours > 0;
  const cooldownMs = hasCooldownBonus ? (24 - bonusHours) * 3600000 : 24 * 3600000;

  // Countdown until next search credit
  useEffect(() => {
    if (oldestUsageTime === null || usageLeft >= FREE_LIMIT) { setResetCountdown(''); return; }
    const resetAt = oldestUsageTime + cooldownMs;
    const fmt = (ms: number) => {
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    const tick = () => {
      const rem = resetAt - Date.now();
      if (rem <= 0) { setResetCountdown(''); setUsageLeft(prev => Math.min(FREE_LIMIT, prev + 1)); setOldestUsageTime(null); return; }
      setResetCountdown(fmt(rem));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [oldestUsageTime, usageLeft, cooldownMs]);

  // League group of 20 — rank among weekly savers, backfill with bots
  useEffect(() => {
    if (!user || !profile) return;

    const BOT_NAMES = [
      'SavvySam', 'BudgetBen', 'ThriftyTia', 'DealsDave', 'CentsCarla',
      'PennyPat', 'FrugalFred', 'BargainBea', 'SmartSue', 'WisdomWes',
      'CashCora', 'ValueVic', 'MintMike', 'SaverSol', 'CleverCleo',
      'GainGrace', 'EcoElla', 'NiftNate', 'DimeDan', 'PricePaige',
    ];
    const isoWeek = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const day = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - day);
      const y = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      return Math.ceil((((date as any) - (y as any)) / 86400000 + 1) / 7);
    };
    const weekSeed = isoWeek(new Date());

    supabase.rpc('get_savings_leaderboard', { period: 'week', lim: 50 }).then(({ data }) => {
      const entries: Array<{ user_id: string; amount_saved: number; isBot?: boolean }> = (data ?? []).map((r: any) => ({
        user_id: r.user_id, amount_saved: Number(r.amount_saved),
      }));
      const botsNeeded = Math.max(0, 20 - entries.length);
      const bots = BOT_NAMES.slice(0, botsNeeded).map((_, i) => ({
        user_id: `bot-${i}`, isBot: true,
        amount_saved: Math.round(((weekSeed * (i + 7)) % 180) + 20) / 10,
      }));
      const merged = [...entries, ...bots].sort((a, b) => b.amount_saved - a.amount_saved);
      const meIdx = merged.findIndex(e => e.user_id === user.id);
      setLeagueRank(meIdx >= 0 ? meIdx + 1 : 20);
    });
  }, [user?.id, profile?.weekly_saved]);

  const profileCurrency = profile?.currency || 'USD';
  const sym = getCurrencySymbol(displayCurrency);
  const convertAmount = (amount: number) => convertCurrency(amount, profileCurrency, displayCurrency);
  const totalSaved = convertAmount(profile?.total_saved || 0);

  useEffect(() => {
    if (totalSaved === 0) { setAnimatedTotal(0); return; }
    let start = 0; const dur = 800; const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setAnimatedTotal(start + (totalSaved - start) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [totalSaved]);

  const MILESTONES = getMilestones(totalSaved);
  const goalMax = MILESTONES[MILESTONES.length - 1];
  const pct = Math.min((totalSaved / goalMax) * 100, 100);
  const milestonesHit = MILESTONES.filter(m => totalSaved >= m).length;
  const visibleMilestones = MILESTONES.reduce<number[]>((acc, m) => {
    const pos = (m / goalMax) * 100;
    const lastPos = acc.length > 0 ? (acc[acc.length - 1] / goalMax) * 100 : -20;
    if (pos - lastPos >= 8) acc.push(m);
    return acc;
  }, []);

  const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } } as const;
  const staggerItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } } };

  const formatMilestone = (m: number): string => {
    if (m >= 1_000_000) return `${sym}${(m / 1_000_000).toFixed(m % 1_000_000 === 0 ? 0 : 1)}M`;
    if (m >= 1_000) return `${sym}${(m / 1_000).toFixed(m % 1_000 === 0 ? 0 : 1)}k`;
    return `${sym}${m}`;
  };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600000);
  const weeklySaved = savings.filter(s => new Date(s.created_at) >= weekAgo).reduce((a, s) => a + convertCurrency(Number(s.amount_saved), s.currency || profileCurrency, displayCurrency), 0);
  const monthlySaved = savings.filter(s => new Date(s.created_at) >= monthAgo).reduce((a, s) => a + convertCurrency(Number(s.amount_saved), s.currency || profileCurrency, displayCurrency), 0);

  return (
    <div className="min-h-screen bg-transparent relative pb-20 md:pb-0">
      <NewUserWelcome />
      <AppNav />
      <div className="border-b border-border bg-overseez-mid px-4 sm:px-6 py-3 relative z-[60]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
            <div data-tutorial-id="dashboard-savings">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{t('dashboard.totalSaved')}</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-display font-bold tracking-tight tabular-nums">{sym}{animatedTotal.toFixed(2)}</p>
                <button
                  onClick={() => navigate('/streak')}
                  className={`text-sm font-semibold transition-opacity hover:opacity-75 active:scale-95 ${((profile as any)?.current_streak || 0) > 0 ? 'text-orange-400' : 'text-muted-foreground'}`}
                >
                  {((profile as any)?.current_streak || 0) > 0 ? '🔥' : '🩶'} {(profile as any)?.current_streak || 0} day{((profile as any)?.current_streak || 0) !== 1 ? 's' : ''}
                </button>
                {leagueRank !== null && (
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className="text-xs font-semibold text-overseez-gold bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-2.5 py-0.5 flex items-center gap-1 hover:bg-overseez-gold/20 transition-colors"
                  >
                    <Trophy className="w-3 h-3" /> Rank #{leagueRank} of 20
                  </button>
                )}
              </div>
              {(() => {
                const equivalents = getEquivalents(totalSaved, displayCurrency);
                if (equivalents.length === 0) return null;
                const eq = equivalents[0];
                const EquivIcon = EQUIV_ICONS[eq.icon];
                return (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    That&apos;s {eq.count} {EquivIcon && <EquivIcon className="w-3 h-3 inline-block" />} {eq.label}
                  </p>
                );
              })()}
              {/* AI usage + refresh counter */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(profile as any)?.subscribed ? (
                  <span className="text-xs text-overseez-green font-semibold flex items-center gap-1"><Zap className="w-3 h-3" /> Unlimited searches</span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <SearchIcon className="w-3 h-3" /> <span className="font-semibold text-foreground">{usageLeft}</span>/{FREE_LIMIT} searches left today
                    </span>
                    {resetCountdown && (
                      <span className="text-overseez-blue font-mono text-[11px] bg-overseez-blue/10 border border-overseez-blue/20 rounded-full px-2.5 py-0.5">
                        next in {resetCountdown}
                      </span>
                    )}
                    {hasCooldownBonus && resetCountdown && (
                      <span className="text-overseez-gold text-[11px] bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {bonusHours === 12 ? 'Champion' : bonusHours === 8 ? 'Runner-up' : 'Podium'} bonus active
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CurrencySwitcher value={displayCurrency} onChange={(c) => { setDisplayCurrency(c); localStorage.setItem('overseez_display_currency', c); }} />
              <p className="text-xs text-muted-foreground">{t('dashboard.goal')}: {sym}{goalMax.toLocaleString()} · {milestonesHit}/{MILESTONES.length} {t('dashboard.milestones')}</p>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-overseez-blue to-overseez-green transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="hidden sm:block relative mt-1.5 h-6">
            {visibleMilestones.map(m => (
              <div key={m} className="absolute top-0 flex flex-col items-center gap-0.5" style={{ left: `${(m / goalMax) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${totalSaved >= m ? 'bg-overseez-green' : 'bg-muted-foreground/30'}`} />
                <span className={`text-[10px] whitespace-nowrap ${totalSaved >= m ? 'text-foreground/80' : 'text-muted-foreground/40'}`}>{formatMilestone(m)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<Wallet className="w-5 h-5" />} label={t('dashboard.totalSavedLabel')} value={`${sym}${totalSaved.toFixed(2)}`} />
          <StatCard icon={<Calendar className="w-5 h-5" />} label={t('dashboard.thisWeek')} value={`${sym}${weeklySaved.toFixed(2)}`} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label={t('dashboard.thisMonth')} value={`${sym}${monthlySaved.toFixed(2)}`} />
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end mb-4">
          <ShareCard
            totalSaved={totalSaved}
            displayCurrency={displayCurrency}
            streak={(profile as any)?.current_streak || 0}
          />
        </motion.div>

        <motion.div variants={staggerItem}><SavingsRecap displayCurrency={displayCurrency} profileCurrency={profileCurrency} /></motion.div>
        <motion.div variants={staggerItem}><MonthlyRecap displayCurrency={displayCurrency} profileCurrency={profileCurrency} /></motion.div>

        <motion.div variants={staggerItem}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">{t('dashboard.recentSavings')}</h2>
            {savings.length > 0 && (
              <span className="text-xs text-muted-foreground">{savings.length} total</span>
            )}
          </div>
          {savings.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">{t('dashboard.noSavings')}</p>
              <Button onClick={() => navigate('/search')} variant="accent" className="mt-4">{t('dashboard.startSearching')}</Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {savings.slice(0, 5).map((s, idx) => {
                const converted = convertCurrency(Number(s.amount_saved), s.currency || profileCurrency, displayCurrency);
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(s.store_name)}`;
                const isLast = idx === Math.min(savings.length, 5) - 1 && !savingsExpanded;
                return (
                  <div key={s.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${!isLast ? 'border-b border-border/50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.store_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button onClick={() => openExternalUrl(mapsUrl)} className="text-overseez-blue hover:opacity-75 transition-opacity" title="Find on Maps">
                        <MapPin className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-overseez-green tabular-nums">▼ {sym}{converted.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}

              {/* Collapsible older entries */}
              {savings.length > 5 && (
                <>
                  {savingsExpanded && savings.slice(5).map((s, idx) => {
                    const converted = convertCurrency(Number(s.amount_saved), s.currency || profileCurrency, displayCurrency);
                    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(s.store_name)}`;
                    const isLast = idx === savings.length - 6;
                    return (
                      <div key={s.id} className={`px-4 py-3 flex items-center justify-between gap-3 border-t border-border/50 ${!isLast ? 'border-b border-border/50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.store_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button onClick={() => openExternalUrl(mapsUrl)} className="text-overseez-blue hover:opacity-75 transition-opacity" title="Find on Maps">
                            <MapPin className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-semibold text-overseez-green tabular-nums">▼ {sym}{converted.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => setSavingsExpanded(v => !v)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border/50"
                  >
                    {savingsExpanded ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> {savings.length - 5} more savings</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 overseez-card-hover">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-xs uppercase tracking-wider font-medium">{label}</span></div>
      <p className="text-xl sm:text-2xl font-display font-bold tracking-tight tabular-nums truncate">{value}</p>
    </div>
  );
}
