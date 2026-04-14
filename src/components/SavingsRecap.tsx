import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeekData {
  week: string;
  label: string;
  total: number;
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

interface Props {
  displayCurrency: string;
  profileCurrency: string;
}

export default function SavingsRecap({ displayCurrency, profileCurrency }: Props) {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [thisWeek, setThisWeek] = useState(0);
  const [lastWeek, setLastWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);

  const sym = getCurrencySymbol(displayCurrency);
  const convert = (amount: number) => convertCurrency(amount, profileCurrency, displayCurrency);

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

        // Group by ISO week
        const byWeek: Record<string, number> = {};
        const byMonth: Record<string, number> = {};
        data.forEach(entry => {
          const d = new Date(entry.created_at);
          const wk = getISOWeek(d);
          const mo = getMonthKey(d);
          byWeek[wk] = (byWeek[wk] || 0) + (entry.amount_saved as number);
          byMonth[mo] = (byMonth[mo] || 0) + (entry.amount_saved as number);
        });

        // Last 8 weeks for chart
        const now = new Date();
        const weeks: WeekData[] = [];
        for (let i = 7; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
          const wk = getISOWeek(d);
          const weekNum = wk.split('-W')[1];
          weeks.push({ week: wk, label: `W${weekNum}`, total: convert(byWeek[wk] || 0) });
        }
        setWeekData(weeks);

        const currentWeek = getISOWeek(now);
        const prevDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        const prevWeek = getISOWeek(prevDate);
        setThisWeek(convert(byWeek[currentWeek] || 0));
        setLastWeek(convert(byWeek[prevWeek] || 0));

        const currentMonth = getMonthKey(now);
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = getMonthKey(prevMonthDate);
        setThisMonth(convert(byMonth[currentMonth] || 0));
        setLastMonth(convert(byMonth[prevMonth] || 0));
      });
  }, [user, displayCurrency, profileCurrency]);

  const weekDiff = thisWeek - lastWeek;
  const monthDiff = thisMonth - lastMonth;

  function TrendIcon({ diff }: { diff: number }) {
    if (diff > 0) return <TrendingUp className="w-3.5 h-3.5 text-overseez-green" />;
    if (diff < 0) return <TrendingDown className="w-3.5 h-3.5 text-overseez-red" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  }

  function trendColor(diff: number) {
    if (diff > 0) return 'text-overseez-green';
    if (diff < 0) return 'text-overseez-red';
    return 'text-muted-foreground';
  }

  function trendText(diff: number) {
    if (diff === 0) return 'Same as before';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${sym}${Math.abs(diff).toFixed(2)} vs last`;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <h3 className="font-display font-semibold mb-4">Savings Recap</h3>

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

      {weekData.length > 0 && weekData.some(w => w.total > 0) && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Last 8 weeks</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  formatter={(value: number) => [`${sym}${value.toFixed(2)}`, 'Saved']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell
                      key={entry.week}
                      fill={index === weekData.length - 1 ? 'hsl(200 80% 65%)' : 'hsl(200 80% 45%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-1">
            {weekData.map((w, i) => (
              <span key={w.week} className={`text-[9px] ${i === weekData.length - 1 ? 'text-overseez-blue font-medium' : 'text-muted-foreground/50'}`}>
                {w.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
