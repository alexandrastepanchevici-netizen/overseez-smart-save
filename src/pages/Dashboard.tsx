import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import FloatingOvals from '@/components/FloatingOvals';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { TrendingUp, Calendar, Wallet, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

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
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState(() => localStorage.getItem('overseez_display_currency') || 'USD');

  useEffect(() => {
    if (!user) return;
    refreshProfile();
    supabase.from('savings_entries').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setSavings(data); });
  }, [user]);

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
    <div className="min-h-screen bg-background relative">
      <FloatingOvals />
      <AppNav />
      <div className="border-b border-border bg-overseez-mid px-4 sm:px-6 py-3 relative z-[60]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{t('dashboard.totalSaved')}</p>
              <p className="text-2xl font-display font-bold tracking-tight tabular-nums">{sym}{animatedTotal.toFixed(2)}</p>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Wallet className="w-5 h-5" />} label={t('dashboard.totalSavedLabel')} value={`${sym}${totalSaved.toFixed(2)}`} />
          <StatCard icon={<Calendar className="w-5 h-5" />} label={t('dashboard.thisWeek')} value={`${sym}${weeklySaved.toFixed(2)}`} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label={t('dashboard.thisMonth')} value={`${sym}${monthlySaved.toFixed(2)}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate('/search')} className="bg-card border border-border rounded-xl p-5 text-left overseez-card-hover group relative overflow-hidden">
            <svg className="absolute -bottom-6 -right-6 w-24 h-24 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500" viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(200 80% 55%)" strokeWidth="4" /></svg>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-overseez-blue/15 flex items-center justify-center"><Target className="w-5 h-5 text-overseez-blue" /></div>
              <h3 className="font-display font-semibold">{t('dashboard.tryAI')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.tryAIDesc')}</p>
          </button>
          <button onClick={() => navigate('/subscription')} className="bg-card border border-border rounded-xl p-5 text-left overseez-card-hover group relative overflow-hidden">
            <svg className="absolute -bottom-6 -right-6 w-24 h-24 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500" viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(43 96% 56%)" strokeWidth="4" /></svg>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-overseez-gold/15 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-overseez-gold" /></div>
              <h3 className="font-display font-semibold">{t('dashboard.subscription')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t('dashboard.subscriptionDesc')}</p>
          </button>
        </div>

        <h2 className="font-display text-lg font-semibold mb-3">{t('dashboard.recentSavings')}</h2>
        {savings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">{t('dashboard.noSavings')}</p>
            <Button onClick={() => navigate('/search')} variant="accent" className="mt-4">{t('dashboard.startSearching')}</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {savings.slice(0, 10).map(s => {
              const converted = convertCurrency(Number(s.amount_saved), s.currency || profileCurrency, displayCurrency);
              return (
                <div key={s.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between overseez-card-hover">
                  <div><p className="text-sm font-medium">{s.store_name}</p><p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p></div>
                  <span className="text-sm font-semibold text-overseez-green tabular-nums">▼ {sym}{converted.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
