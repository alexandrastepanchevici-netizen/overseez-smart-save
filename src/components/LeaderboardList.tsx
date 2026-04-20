import React from 'react';
import { motion } from 'motion/react';
import { UserPlus, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface LeaderboardListProps {
  entries:         LeaderboardEntry[];
  currentUserRank: number | undefined;
  isLoading?:      boolean;
  friendIds?:      Set<string>;
  onAddFriend?:    (userId: string) => void;
}

function formatScore(entry: LeaderboardEntry): string {
  const count = entry.saveCount ?? 0;
  return `${count.toLocaleString()} ${count === 1 ? 'save' : 'saves'}`;
}

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

function RankBadge({ rank }: { rank: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{rank}</span>
    </div>
  );
}

function AvatarThumb({ avatarUrl, nickname }: { avatarUrl: string | null; nickname: string }) {
  return (
    <div className="w-7 h-7 rounded-full bg-overseez-blue/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
      {avatarUrl ? (
        <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-overseez-blue">
          {nickname.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function LeaderboardListSkeleton() {
  return (
    <div className="space-y-2">
      {/* Podium skeleton */}
      <div className="flex justify-center gap-4 mb-6">
        <Skeleton className="w-20 h-24 rounded-xl" />
        <Skeleton className="w-20 h-32 rounded-xl" />
        <Skeleton className="w-20 h-20 rounded-xl" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

export default function LeaderboardList({ entries, currentUserRank, isLoading, friendIds, onAddFriend }: LeaderboardListProps) {
  if (isLoading) return <LeaderboardListSkeleton />;

  return (
    <motion.div
      className="flex flex-col gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {entries.map(entry => {
        const isFriend = !entry.isBot && !!friendIds?.has(entry.userId);
        const canAdd   = !entry.isCurrentUser && !entry.isBot && !!onAddFriend;
        return (
          <motion.div
            key={entry.isBot ? `bot-${entry.userId}` : entry.userId}
            variants={rowVariants}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
              entry.isCurrentUser
                ? 'bg-overseez-blue/10 border border-overseez-blue/30'
                : 'bg-card border border-border'
            }`}
          >
            <RankBadge rank={entry.rank} />
            <AvatarThumb avatarUrl={entry.avatarUrl} nickname={entry.nickname} />
            <span className="flex-1 text-sm font-medium truncate">
              {entry.nickname}
              {entry.isCurrentUser && (
                <span className="ml-1.5 text-[10px] text-overseez-blue font-semibold">You</span>
              )}
              {isFriend && (
                <span className="ml-1.5 text-[10px] text-emerald-500 font-semibold">Friend</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums text-right flex-shrink-0">
              {formatScore(entry)}
            </span>
            {canAdd && (
              isFriend ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              ) : (
                <button
                  onClick={() => onAddFriend(entry.userId)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-overseez-blue/10 hover:bg-overseez-blue/20 transition-colors flex-shrink-0"
                  title={`Add ${entry.nickname} as friend`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-overseez-blue" />
                </button>
              )
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
