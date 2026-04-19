import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardType } from '@/types/leaderboard';

const STALE_TIMES: Record<LeaderboardPeriod, number> = {
  week:  5  * 60 * 1000,  // 5 min
  month: 15 * 60 * 1000,  // 15 min
  year:  30 * 60 * 1000,  // 30 min
};

export function useLeaderboard(type: LeaderboardType, period: LeaderboardPeriod) {
  const { user } = useAuth();

  return useQuery<LeaderboardEntry[]>({
    queryKey:  ['leaderboard', type, period],
    staleTime: STALE_TIMES[period],
    enabled:   !!user,
    queryFn:   async () => {
      if (type === 'searches') {
        const { data, error } = await supabase.rpc('get_search_leaderboard', { period, lim: 50 });
        if (error) throw error;
        return (data ?? []).map((row: any) => ({
          rank:          Number(row.rank),
          userId:        row.user_id,
          nickname:      row.nickname,
          avatarUrl:     row.avatar_url ?? null,
          searchCount:   Number(row.search_count),
          isCurrentUser: row.user_id === user?.id,
        }));
      } else {
        const { data, error } = await supabase.rpc('get_savings_leaderboard', { period, lim: 50 });
        if (error) throw error;
        return (data ?? []).map((row: any) => ({
          rank:          Number(row.rank),
          userId:        row.user_id,
          nickname:      row.nickname,
          avatarUrl:     row.avatar_url ?? null,
          amountSaved:   Number(row.amount_saved),
          currency:      row.currency,
          isCurrentUser: row.user_id === user?.id,
        }));
      }
    },
  });
}
