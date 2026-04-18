import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StreakMilestone {
  days: number;
  emoji: string;
  title: string;
  subtitle: string;
}

const MILESTONES: StreakMilestone[] = [
  { days: 1,   emoji: '🌱', title: 'Day One!',     subtitle: 'Every great streak starts here' },
  { days: 7,   emoji: '🔥', title: 'One Week!',    subtitle: 'Seven days of consistency' },
  { days: 14,  emoji: '💪', title: 'Two Weeks!',   subtitle: "You're building a real habit" },
  { days: 30,  emoji: '🌟', title: 'One Month!',   subtitle: 'A full month of daily wins' },
  { days: 60,  emoji: '🏆', title: 'Two Months!',  subtitle: 'Unstoppable commitment' },
  { days: 100, emoji: '⚡', title: '100 Days!',    subtitle: 'A century of savings power' },
];

const MILESTONE_DAYS = new Set(MILESTONES.map(m => m.days));

export function useStreak() {
  const { user, refreshProfile } = useAuth();

  const recordActivity = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

    refreshProfile();

    // Fire milestone event if this streak count is a milestone
    if (MILESTONE_DAYS.has(currentStreak)) {
      const milestone = MILESTONES.find(m => m.days === currentStreak)!;
      window.dispatchEvent(
        new CustomEvent<StreakMilestone>('overseez:streak-milestone', { detail: milestone })
      );
    }

    return currentStreak;
  }, [user, refreshProfile]);

  return { recordActivity };
}
