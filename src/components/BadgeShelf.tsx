import React, { useEffect, useState } from 'react';
import { useAchievements, ALL_BADGES } from '@/hooks/useAchievements';

export default function BadgeShelf() {
  const { fetchUnlocked } = useAchievements();
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUnlocked().then(keys => setUnlockedKeys(new Set(keys)));
  }, [fetchUnlocked]);

  const unlockedCount = unlockedKeys.size;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Badges</h3>
        <span className="text-xs text-muted-foreground">{unlockedCount} / {ALL_BADGES.length} unlocked</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
        {ALL_BADGES.map(badge => {
          const unlocked = unlockedKeys.has(badge.key);
          return (
            <div key={badge.key} className="flex flex-col items-center gap-1 group relative">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  unlocked
                    ? 'bg-overseez-blue/15 border border-overseez-blue/30'
                    : 'bg-muted/40 border border-border opacity-40 grayscale'
                }`}
                title={badge.name}
              >
                {badge.emoji}
              </div>
              <span className={`text-[9px] text-center leading-tight max-w-[44px] ${unlocked ? 'text-foreground/70' : 'text-muted-foreground/40'}`}>
                {badge.name}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1.5 text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity">
                <p className="font-medium">{badge.emoji} {badge.name}</p>
                <p className="text-muted-foreground text-[10px]">{badge.description}</p>
                {!unlocked && <p className="text-[10px] text-overseez-blue mt-0.5">Locked</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
