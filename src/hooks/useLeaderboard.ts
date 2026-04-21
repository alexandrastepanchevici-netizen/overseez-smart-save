import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types/leaderboard';
import { fillLeaderboardWithBots } from '@/lib/leaderboardBots';

const STALE_TIMES: Record<LeaderboardPeriod, number> = {
  week:  5  * 60 * 1000,  // 5 min
  month: 15 * 60 * 1000,  // 15 min
  year:  30 * 60 * 1000,  // 30 min
};

export function useLeaderboard(period: LeaderboardPeriod) {
  const { user } = useAuth();

  return useQuery<LeaderboardEntry[]>({
    queryKey:  ['leaderboard', period],
    staleTime: STALE_TIMES[period],
    enabled:   !!user,
    queryFn:   async () => {
      const { data, error } = await (supabase.rpc as any)('get_saves_leaderboard', { period, lim: 50 });
      const real = error ? [] : (data ?? []).map((row: any) => ({
        rank:          Number(row.rank),
        userId:        row.user_id,
        nickname:      row.nickname,
        avatarUrl:     row.avatar_url ?? null,
        saveCount:     Number(row.save_count),
        isCurrentUser: row.user_id === user?.id,
      }));
      return fillLeaderboardWithBots(real);
    },
  });
}
