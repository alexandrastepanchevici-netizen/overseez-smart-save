import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

interface ChartPoint {
  date: string;
  value: number;
}

function getDayKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateLabel(key: string, period: Period): string {
  if (period === '1W' || period === '1M') {
    const d = new Date(key);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (period === '3M' || period === '6M') {
    // key is like "2026-W12"
    const parts = key.split('-W');
    return `W${parts[1]}`;
  }
  // 1Y — key is "2026-04"
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short' });
}

const PERIOD_DAYS: Record<Period, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

interface Props {
  displayCurrency: string;
  profileCurrency: string;
}

function CustomTooltip({ active, payload, label, sym }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none">
      <p className="font-semibold text-foreground">{sym}{Number(payload[0].value).toFixed(2)}</p>
      <p className="text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function TrendIcon({ diff }: { diff: number }) {
  if (diff > 0) return <TrendingUp className="w-3.5 h-3.5 text-overseez-green" />;
  if (diff < 0) return <TrendingDown className="w-3.5 h-3.5 text-overseez-red" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function SavingsRecap({ displayCurrency, profileCurrency }: Props) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('1M');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [thisWeek, setThisWeek] = useState(0);
  const [lastWeek, setLastWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);

  const sym = getCurrencySymbol(displayCurrency);
  const convert = useCallback(
    (amount: number) => convertCurrency(amount, profileCurrency, displayCurrency),
    [profileCurrency, displayCurrency]
  );

  // Fetch trend data (always last 60 days for week/month cards)
  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
    supabase
      .from('savings_entries')
      .select('amount_saved, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const byWeek: Record<string, number> = {};
        const byMonth: Record<string, number> = {};
        data.forEach(entry => {
          const d = new Date(entry.created_at);
          const wk = getISOWeek(d);
          const mo = getMonthKey(d);
          byWeek[wk] = (byWeek[wk] || 0) + (entry.amount_saved as number);
          byMonth[mo] = (byMonth[mo] || 0) + (entry.amount_saved as number);
        });
        const now = new Date();
        const currentWeek = getISOWeek(now);
        const prevWeek = getISOWeek(new Date(now.getTime() - 7 * 24 * 3600 * 1000));
        const currentMonth = getMonthKey(now);
        const prevMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        setThisWeek(convert(byWeek[currentWeek] || 0));
        setLastWeek(convert(byWeek[prevWeek] || 0));
        setThisMonth(convert(byMonth[currentMonth] || 0));
        setLastMonth(convert(byMonth[prevMonth] || 0));
      });
  }, [user, convert]);

  // Fetch chart data based on selected period
  useEffect(() => {
    if (!user) return;
    const days = PERIOD_DAYS[period];
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

    supabase
      .from('savings_entries')
      .select('amount_saved, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;

        const buckets: Record<string, number> = {};
        data.forEach(entry => {
          const d = new Date(entry.created_at);
          let key: string;
          if (period === '1W' || period === '1M') key = getDayKey(d);
          else if (period === '3M' || period === '6M') key = getISOWeek(d);
          else key = getMonthKey(d);
          buckets[key] = (buckets[key] || 0) + (entry.amount_saved as number);
        });

        // Build ordered list of bucket keys covering the full period
        const now = new Date();
        const points: ChartPoint[] = [];

        if (period === '1W' || period === '1M') {
          for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
            const key = getDayKey(d);
            points.push({ date: formatDateLabel(key, period), value: convert(buckets[key] || 0) });
          }
        } else if (period === '3M' || period === '6M') {
          const weeks = Math.ceil(days / 7);
          for (let i = weeks - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
            const key = getISOWeek(d);
            points.push({ date: formatDateLabel(key, period), value: convert(buckets[key] || 0) });
          }
        } else {
          // 1Y — 12 months
          for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = getMonthKey(d);
            points.push({ date: formatDateLabel(key, period), value: convert(buckets[key] || 0) });
          }
        }

        setChartData(points);
      });
  }, [user, period, convert]);

  const weekDiff = thisWeek - lastWeek;
  const monthDiff = thisMonth - lastMonth;

  const trendColor = (diff: number) =>
    diff > 0 ? 'text-overseez-green' : diff < 0 ? 'text-overseez-red' : 'text-muted-foreground';

  const trendText = (diff: number) => {
    if (diff === 0) return 'Same as before';
    return `${diff > 0 ? '+' : ''}${sym}${Math.abs(diff).toFixed(2)} vs last`;
  };

  const hasData = chartData.some(p => p.value > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <h3 className="font-display font-semibold mb-4">Savings Recap</h3>

      {/* Trend cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">This week</p>
          <p className="text-xl font-display font-bold tabular-nums">{sym}{thisWeek.toFixed(2)}</p>
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${trendColor(weekDiff)}`}>
            <TrendIcon diff={weekDiff} />
            <span>{trendText(weekDiff)}</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">This month</p>
          <p className="text-xl font-display font-bold tabular-nums">{sym}{thisMonth.toFixed(2)}</p>
          <div className={`flex items-center gap-1 text-xs mt-0.5 ${trendColor(monthDiff)}`}>
            <TrendIcon diff={monthDiff} />
            <span>{trendText(monthDiff)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200 80% 55%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(200 80% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip sym={sym} />}
                cursor={{ stroke: 'rgba(255,255,255,0.6)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(200 80% 55%)"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                activeDot={{ r: 5, fill: '#fff', stroke: 'hsl(200 80% 65%)', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No savings logged in this period</p>
          </div>
        )}
      </div>

      {/* Period tabs */}
      <div className="flex items-center justify-between mt-3 px-1">
        {(['1W', '1M', '3M', '6M', '1Y'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              period === p
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
