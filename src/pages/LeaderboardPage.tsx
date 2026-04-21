import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';
import AppNav from '@/components/AppNav';
import LeaderboardPodium from '@/components/LeaderboardPodium';
import LeaderboardList, { LeaderboardListSkeleton } from '@/components/LeaderboardList';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useFriends } from '@/hooks/useFriends';
import type { LeaderboardPeriod } from '@/types/leaderboard';

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  week:  'Weekly',
  month: 'Monthly',
  year:  'Yearly',
};

export default function LeaderboardPage() {
  const { friendIds, addFriend } = useFriends();

  const [period, setPeriod] = useState<LeaderboardPeriod>('week');

  const { data, isLoading, error } = useLeaderboard(period);

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

        {/* Content — animated on period change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
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
                  Be the first to log a save this {PERIOD_LABELS[period].toLowerCase()}.
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
                  />
                )}
                <LeaderboardList
                  entries={listEntries}
                  currentUserRank={currentUserRank}
                  friendIds={friendIds}
                  onAddFriend={addFriend}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
