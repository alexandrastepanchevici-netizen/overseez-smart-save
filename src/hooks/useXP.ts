import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const XP_EVENTS = {
  SEARCH:  10,
  SAVE:    50,
  BADGE:  100,
} as const;

interface LevelDef {
  level: number;
  name: string;
  min: number;
}

const LEVELS: LevelDef[] = [
  { level: 1,  name: 'Rookie',    min: 0    },
  { level: 2,  name: 'Scout',     min: 100  },
  { level: 3,  name: 'Hunter',    min: 300  },
  { level: 4,  name: 'Tracker',   min: 600  },
  { level: 5,  name: 'Expert',    min: 1000 },
  { level: 6,  name: 'Elite',     min: 1500 },
  { level: 7,  name: 'Master',    min: 2200 },
  { level: 8,  name: 'Legend',    min: 3000 },
  { level: 9,  name: 'Mythic',    min: 4000 },
  { level: 10, name: 'Overseez',  min: 5500 },
];

export interface LevelInfo {
  level: number;
  name: string;
  min: number;
  progress: number;   // 0–100 toward next level
  nextLevelXP: number | null;
}

export function getLevelFromXP(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) current = l;
    else break;
  }
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
  const next = LEVELS[nextIdx] ?? null;
  const progress = next
    ? Math.min(((xp - current.min) / (next.min - current.min)) * 100, 100)
    : 100;
  return { ...current, progress, nextLevelXP: next?.min ?? null };
}

export function useXP() {
  const { user, profile, refreshProfile } = useAuth();
  const xp = (profile as any)?.xp ?? 0;
  const levelInfo = useMemo(() => getLevelFromXP(xp), [xp]);

  const addXP = useCallback(async (amount: number) => {
    if (!user) return;
    const prevLevel = levelInfo.level;

    const { data } = await supabase.rpc('increment_profile_xp' as any, {
      user_id_in: user.id,
      amount_in: amount,
    });

    // data is the new xp value returned by the RPC
    const newXP = typeof data === 'number' ? data : xp + amount;
    const newLevel = getLevelFromXP(newXP);

    await refreshProfile();

    if (newLevel.level > prevLevel) {
      toast.success(`Level up! You're now ${newLevel.name} (Lv.${newLevel.level})`, {
        duration: 4000,
      });
    }
  }, [user, levelInfo.level, xp, refreshProfile]);

  return { xp, levelInfo, addXP };
}
