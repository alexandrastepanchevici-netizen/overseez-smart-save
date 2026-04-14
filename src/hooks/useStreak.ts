import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useStreak() {
  const { user, refreshProfile } = useAuth();

  const recordActivity = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const lastActive = (profile as any).last_active_date as string | null;
    let currentStreak = (profile as any).current_streak as number || 0;
    let longestStreak = (profile as any).longest_streak as number || 0;

    if (lastActive === today) {
      // Already recorded today — no update needed
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];

    if (lastActive === yesterday) {
      // Consecutive day — increment streak
      currentStreak += 1;
    } else {
      // Streak broken (or first activity) — reset to 1
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await supabase
      .from('profiles')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
      } as any)
      .eq('id', user.id);

    refreshProfile();
  }, [user, refreshProfile]);

  return { recordActivity };
}
