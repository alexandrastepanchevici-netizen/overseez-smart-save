import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function toDateStr(d: Date): string {
  // local date string YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function intensityClass(count: number): string {
  if (count === 0) return 'bg-muted/25';
  if (count === 1) return 'bg-overseez-blue/30';
  if (count <= 3) return 'bg-overseez-blue/60';
  return 'bg-overseez-blue';
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_BACK = 90;

export default function StreakCalendar() {
  const { user } = useAuth();
  const [activityMap, setActivityMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - (DAYS_BACK + 1) * 86_400_000).toISOString();
    supabase
      .from('ai_usage')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .then(({ data }) => {
        const map = new Map<string, number>();
        for (const row of data ?? []) {
          const key = toDateStr(new Date(row.created_at));
          map.set(key, (map.get(key) ?? 0) + 1);
        }
        setActivityMap(map);
      });
  }, [user]);

  // Build the day grid: last DAYS_BACK days ending today
  const today = new Date();
  const days: Date[] = [];
  for (let i = DAYS_BACK; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Pad the start so the first column begins on Monday (day 1 in ISO)
  const firstDow = days[0].getDay(); // 0=Sun
  const padStart = firstDow === 0 ? 6 : firstDow - 1;
  const padded: (Date | null)[] = [...Array(padStart).fill(null), ...days];

  // Split into week columns (each column = 7 rows = Mon–Sun)
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const activeDays = [...activityMap.values()].filter(v => v > 0).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-sm">Activity — Last 90 Days</h3>
        <span className="text-xs text-muted-foreground">{activeDays} active day{activeDays !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-[3px]">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="w-3 h-3 flex items-center justify-center text-[9px] text-muted-foreground leading-none">
              {l}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, di) => {
              const day = week[di] ?? null;
              if (!day) return <div key={di} className="w-3 h-3" />;
              const count = activityMap.get(toDateStr(day)) ?? 0;
              return (
                <div
                  key={di}
                  title={`${toDateStr(day)}: ${count} search${count !== 1 ? 'es' : ''}`}
                  className={`w-3 h-3 rounded-sm transition-colors ${intensityClass(count)}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0, 1, 2, 4].map(c => (
          <div key={c} className={`w-3 h-3 rounded-sm ${intensityClass(c)}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}
