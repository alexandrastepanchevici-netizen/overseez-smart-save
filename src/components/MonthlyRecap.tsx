import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface Props {
  displayCurrency: string;
  profileCurrency: string;
}

interface MonthStats {
  total: number;
  topStore: string;
  activeDays: number;
  entries: number;
}

function getMonthRange(monthsAgo: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const start = d.toISOString();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
  const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return { start, end, label };
}

export default function MonthlyRecap({ displayCurrency, profileCurrency }: Props) {
  const { user } = useAuth();
  const [thisMonth, setThisMonth] = useState<MonthStats | null>(null);
  const [lastMonth, setLastMonth] = useState<MonthStats | null>(null);
  const [thisLabel, setThisLabel] = useState('');
  const [lastLabel, setLastLabel] = useState('');

  const sym = getCurrencySymbol(displayCurrency);
  const convert = useCallback(
    (amount: number) => convertCurrency(amount, profileCurrency, displayCurrency),
    [profileCurrency, displayCurrency]
  );

  useEffect(() => {
    if (!user) return;

    const fetchStats = async (monthsAgo: number): Promise<MonthStats> => {
      const { start, end } = getMonthRange(monthsAgo);
      const { data } = await supabase
        .from('savings_entries')
        .select('amount_saved, store_name, created_at')
        .eq('user_id', user.id)
        .gte('created_at', start)
        .lt('created_at', end);

      if (!data || data.length === 0) return { total: 0, topStore: '—', activeDays: 0, entries: 0 };

      const total = data.reduce((sum, e) => sum + convert(Number(e.amount_saved)), 0);
      const storeCounts: Record<string, number> = {};
      const daySet = new Set<string>();
      data.forEach(e => {
        storeCounts[e.store_name] = (storeCounts[e.store_name] || 0) + 1;
        daySet.add(e.created_at.split('T')[0]);
      });
      const topStore = Object.entries(storeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
      return { total, topStore, activeDays: daySet.size, entries: data.length };
    };

    const thisRange = getMonthRange(0);
    const lastRange = getMonthRange(1);
    setThisLabel(thisRange.label);
    setLastLabel(lastRange.label);

    fetchStats(0).then(setThisMonth);
    fetchStats(1).then(setLastMonth);
  }, [user, convert]);

  if (!thisMonth && !lastMonth) return null;

  const diff = (thisMonth?.total ?? 0) - (lastMonth?.total ?? 0);
  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? 'text-overseez-green' : diff < 0 ? 'text-overseez-red' : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-overseez-blue" />
        <h3 className="font-display font-semibold">Monthly Report Card</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* This month */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{thisLabel}</p>
          <p className="text-2xl font-display font-bold tabular-nums">{sym}{(thisMonth?.total ?? 0).toFixed(2)}</p>
          <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>
              {diff === 0 ? 'Same as last month' : `${diff > 0 ? '+' : ''}${sym}${Math.abs(diff).toFixed(2)} vs ${lastLabel}`}
            </span>
          </div>
        </div>

        {/* Last month */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{lastLabel}</p>
          <p className="text-2xl font-display font-bold tabular-nums text-muted-foreground">{sym}{(lastMonth?.total ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{lastMonth?.entries ?? 0} saves logged</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center bg-muted/20 rounded-lg p-3">
          <p className="text-lg font-display font-bold">{thisMonth?.activeDays ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Active days</p>
        </div>
        <div className="text-center bg-muted/20 rounded-lg p-3">
          <p className="text-lg font-display font-bold">{thisMonth?.entries ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Saves logged</p>
        </div>
        <div className="text-center bg-muted/20 rounded-lg p-3 min-w-0">
          <p className="text-sm font-semibold truncate">{thisMonth?.topStore ?? '—'}</p>
          <p className="text-[11px] text-muted-foreground">Top store</p>
        </div>
      </div>
    </div>
  );
}
