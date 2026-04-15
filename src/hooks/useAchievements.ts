import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';

export interface Badge {
  key: string;
  emoji: string;
  name: string;
  description: string;
}

export const ALL_BADGES: Badge[] = [
  { key: 'first_search', emoji: '🔍', name: 'First Search', description: 'Complete your first AI search' },
  { key: 'first_saving', emoji: '💰', name: 'First Saving', description: 'Log your first saving' },
  { key: 'week_warrior', emoji: '🔥', name: 'Week Warrior', description: '7-day search streak' },
  { key: 'overseez_legend', emoji: '🌟', name: 'Overseez Legend', description: '30-day search streak' },
  { key: 'century_streak', emoji: '⚡', name: 'Century Streak', description: '100-day search streak' },
  { key: 'globe_trotter', emoji: '🌍', name: 'Globe Trotter', description: 'Search in 3 different cities' },
  { key: 'world_explorer', emoji: '🗺️', name: 'World Explorer', description: 'Search in 5 different countries' },
  { key: 'century_saver', emoji: '🏆', name: 'Century Saver', description: 'Save $100 total' },
  { key: 'diamond_saver', emoji: '💎', name: 'Diamond Saver', description: 'Save $500 total' },
  { key: 'savings_king', emoji: '👑', name: 'Savings King', description: 'Save $1,000 total' },
  { key: 'high_roller', emoji: '🚀', name: 'High Roller', description: 'Save $5,000 total' },
  { key: 'power_user', emoji: '⚡', name: 'Power User', description: '50 total searches' },
  { key: 'search_master', emoji: '🧠', name: 'Search Master', description: '200 total searches' },
  { key: 'student_smart', emoji: '🎓', name: 'Student Smart', description: 'Use a student discount search' },
  { key: 'premium_member', emoji: '👑', name: 'Premium Member', description: 'Upgrade to premium' },
  { key: 'night_owl', emoji: '🌙', name: 'Night Owl', description: 'Complete a search after midnight' },
  { key: 'show_off', emoji: '📤', name: 'Show Off', description: 'Share your savings recap' },
  { key: 'referral_star', emoji: '🤝', name: 'Referral Star', description: 'A friend joins using your link' },
  { key: 'community_builder', emoji: '🌐', name: 'Community Builder', description: '3 friends join using your link' },
  { key: 'challenge_crusher', emoji: '🎯', name: 'Challenge Crusher', description: 'Complete 3 weekly challenges' },
  { key: 'challenge_champion', emoji: '🏅', name: 'Challenge Champion', description: 'Complete 10 weekly challenges' },
];

interface CheckContext {
  totalSavedUSD?: number;
  searchCount?: number;
  streakDays?: number;
  isStudentSearch?: boolean;
  isSubscribed?: boolean;
  isAfterMidnight?: boolean;
  justShared?: boolean;
  referralCount?: number;
}

export function useAchievements() {
  const { user } = useAuth();
  const { tapSuccess } = useHaptics();

  const unlockBadge = useCallback(async (badgeKey: string) => {
    if (!user) return;

    const badge = ALL_BADGES.find(b => b.key === badgeKey);
    if (!badge) return;

    const { error } = await supabase
      .from('achievements' as any)
      .upsert({ user_id: user.id, badge_key: badgeKey }, { onConflict: 'user_id,badge_key', ignoreDuplicates: true });

    if (!error) {
      tapSuccess();
      // Fire custom event — BadgeUnlockCelebration listens at root level
      window.dispatchEvent(new CustomEvent('overseez:badge-unlock', { detail: badge }));
    }
  }, [user, tapSuccess]);

  const checkAchievements = useCallback(async (ctx: CheckContext) => {
    if (!user) return;

    const checks: { key: string; condition: boolean }[] = [
      { key: 'first_search', condition: (ctx.searchCount || 0) >= 1 },
      { key: 'power_user', condition: (ctx.searchCount || 0) >= 50 },
      { key: 'search_master', condition: (ctx.searchCount || 0) >= 200 },
      { key: 'first_saving', condition: (ctx.totalSavedUSD || 0) > 0 },
      { key: 'century_saver', condition: (ctx.totalSavedUSD || 0) >= 100 },
      { key: 'diamond_saver', condition: (ctx.totalSavedUSD || 0) >= 500 },
      { key: 'savings_king', condition: (ctx.totalSavedUSD || 0) >= 1000 },
      { key: 'high_roller', condition: (ctx.totalSavedUSD || 0) >= 5000 },
      { key: 'week_warrior', condition: (ctx.streakDays || 0) >= 7 },
      { key: 'overseez_legend', condition: (ctx.streakDays || 0) >= 30 },
      { key: 'century_streak', condition: (ctx.streakDays || 0) >= 100 },
      { key: 'student_smart', condition: !!ctx.isStudentSearch },
      { key: 'premium_member', condition: !!ctx.isSubscribed },
      { key: 'night_owl', condition: !!ctx.isAfterMidnight },
      { key: 'show_off', condition: !!ctx.justShared },
      { key: 'referral_star', condition: (ctx.referralCount || 0) >= 1 },
      { key: 'community_builder', condition: (ctx.referralCount || 0) >= 3 },
    ];

    // Fetch already-unlocked badges to avoid re-toasting
    const { data: existing } = await supabase
      .from('achievements' as any)
      .select('badge_key')
      .eq('user_id', user.id);

    const unlockedKeys = new Set((existing || []).map((e: any) => e.badge_key));

    for (const check of checks) {
      if (check.condition && !unlockedKeys.has(check.key)) {
        await unlockBadge(check.key);
      }
    }
  }, [user, unlockBadge]);

  const fetchUnlocked = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('achievements' as any)
      .select('badge_key')
      .eq('user_id', user.id);
    return (data || []).map((e: any) => e.badge_key);
  }, [user]);

  return { checkAchievements, unlockBadge, fetchUnlocked, ALL_BADGES };
}
