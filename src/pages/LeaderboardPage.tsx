import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppNav from '@/components/AppNav';
import LeaderboardPodium from '@/components/LeaderboardPodium';
import LeaderboardList, { LeaderboardListSkeleton } from '@/components/LeaderboardList';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';
import { queueWeeklyReveal } from '@/components/WeeklyFinishReveal';
import type { LeaderboardPeriod, LeaderboardType } from '@/types/leaderboard';

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  week:  'Weekly',
  month: 'Monthly',
  year:  'Yearly',
};

// ISO week number helper
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day  = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const { checkAchievements } = useAchievements();

  const [type,   setType]   = useState<LeaderboardType>('searches');
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');

  const { data, isLoading, error } = useLeaderboard(type, period);

  // Weekly finish recording (client-side trigger)
  useEffect(() => {
    if (!user || !profile) return;

    const currentWeek   = getISOWeek(new Date());
    const lastRecorded  = (profile as any).last_week_recorded as number | null;

    // Only record once per week-transition
    if (lastRecorded === currentWeek - 1 || lastRecorded === currentWeek) return;

    (async () => {
      const { data: lastWeekData } = await (supabase.rpc as any)('get_last_week_savings_leaderboard', { lim: 200 });
      if (lastWeekData) {
        const myRow = (lastWeekData as any[]).find((r: any) => r.user_id === user.id);
        if (myRow) {
          const rank = Number(myRow.rank);
          await (supabase.rpc as any)('record_weekly_finish', { p_user_id: user.id, p_rank: rank });
          if (rank <= 3) {
            queueWeeklyReveal(Math.min(rank, 3) as 1 | 2 | 3);
          }
        }
      }
      await supabase.from('profiles').update({ last_week_recorded: currentWeek } as any).eq('user_id', user.id);
    })();
  }, [user?.id]); // run once on mount per session

  // Check leaderboard-related badges once data loads
  useEffect(() => {
    if (!profile) return;
    const top3Count        = (profile as any).top3_weekly_count as number ?? 0;
    const isWeeklyChampion = (profile as any).search_cooldown_bonus_at != null;
    if (top3Count > 0 || isWeeklyChampion) {
      checkAchievements({ top3Count, isWeeklyChampion });
    }
  }, [(profile as any)?.top3_weekly_count]);

  const currentUserRank = data?.find(e => e.isCurrentUser)?.rank;
  const podiumEntries   = data && data.length >= 3 ? data.slice(0, 3) : null;
  const listEntries     = data ? data.slice(podiumEntries ? 3 : 0) : [];

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-6">
      <AppNav />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Page header */}
        <h1 className="font-display text-2xl font-bold mb-5 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-overseez-gold" />
          Leaderboard
        </h1>

        {/* Type tabs */}
        <Tabs value={type} onValueChange={v => setType(v as LeaderboardType)} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="searches" className="flex-1">Searches</TabsTrigger>
            <TabsTrigger value="savings"  className="flex-1">Savings</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period pills */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-overseez-blue text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Currency note for savings leaderboard */}
        {type === 'savings' && (
          <p className="text-[11px] text-muted-foreground mb-4">
            Amounts shown in each user's own currency.
          </p>
        )}

        {/* Content — animated on tab change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${type}-${period}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading && <LeaderboardListSkeleton />}

            {error && (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load leaderboard</p>
              </div>
            )}

            {!isLoading && !error && data?.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-10 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-semibold mb-1">No data yet</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to climb the leaderboard this {PERIOD_LABELS[period].toLowerCase()}.
                </p>
              </div>
            )}

            {!isLoading && !error && data && data.length > 0 && (
              <>
                {podiumEntries && (
                  <LeaderboardPodium
                    first={podiumEntries[0]}
                    second={podiumEntries[1]}
                    third={podiumEntries[2]}
                    type={type}
                  />
                )}
                <LeaderboardList
                  entries={listEntries}
                  type={type}
                  currentUserRank={currentUserRank}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
