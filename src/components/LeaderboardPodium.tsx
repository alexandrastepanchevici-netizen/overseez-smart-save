import React from 'react';
import { motion } from 'motion/react';
import { Crown, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/leaderboard';

interface LeaderboardPodiumProps {
  first:  LeaderboardEntry;
  second: LeaderboardEntry;
  third:  LeaderboardEntry;
}

function formatScore(entry: LeaderboardEntry): string {
  const count = entry.saveCount ?? 0;
  return `${count.toLocaleString()} ${count === 1 ? 'save' : 'saves'}`;
}

interface PodiumCardProps {
  entry: LeaderboardEntry;
  place: 1 | 2 | 3;
  delay: number;
}

const PLACE_STYLES = {
  1: {
    height:    'h-28',
    icon:      Crown,
    iconColor: 'text-overseez-gold',
    ring:      'ring-2 ring-overseez-gold shadow-[0_0_14px_3px_hsl(43_96%_56%_/_0.55)]',
    label:     '1st',
  },
  2: {
    height:    'h-20',
    icon:      Medal,
    iconColor: 'text-slate-300',
    ring:      'ring-2 ring-slate-300 shadow-[0_0_8px_2px_rgba(203,213,225,0.4)]',
    label:     '2nd',
  },
  3: {
    height:    'h-16',
    icon:      Award,
    iconColor: 'text-amber-600',
    ring:      'ring-2 ring-amber-600 shadow-[0_0_8px_2px_rgba(180,83,9,0.35)]',
    label:     '3rd',
  },
} as const;

function PodiumCard({ entry, place, delay }: PodiumCardProps) {
  const style = PLACE_STYLES[place];
  const Icon = style.icon;

  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-1.5"
      initial={{ y: -60, opacity: 0, scale: 0.85 }}
      animate={{ y: 0,   opacity: 1, scale: 1    }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay }}
    >
      {/* "You" pill */}
      {entry.isCurrentUser && (
        <span className="text-[10px] font-bold text-overseez-blue bg-overseez-blue/10 border border-overseez-blue/30 rounded-full px-2 py-0.5">
          You
        </span>
      )}

      {/* Avatar with rank frame */}
      <div className={`w-14 h-14 rounded-full bg-overseez-blue/20 overflow-hidden flex-shrink-0 ${style.ring}`}>
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt={entry.nickname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xl font-bold text-overseez-blue">
              {entry.nickname.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Place icon */}
      <Icon className={`w-5 h-5 ${style.iconColor}`} />

      {/* Name */}
      <p className="text-xs font-semibold text-center max-w-[72px] truncate">
        {entry.nickname}
      </p>

      {/* Score */}
      <p className="text-[10px] text-muted-foreground text-center max-w-[80px] leading-tight">
        {formatScore(entry)}
      </p>

      {/* Podium block */}
      <div
        className={`w-full ${style.height} rounded-t-lg flex items-center justify-center mt-1 ${
          place === 1
            ? 'bg-overseez-gold/20 border border-overseez-gold/30'
            : place === 2
            ? 'bg-slate-300/10 border border-slate-300/20'
            : 'bg-amber-600/10 border border-amber-600/20'
        }`}
      >
        <span className="text-lg font-display font-bold text-muted-foreground/40">{style.label}</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPodium({ first, second, third }: LeaderboardPodiumProps) {
  return (
    <div className="flex items-end gap-2 mb-6 px-2">
      {/* 2nd | 1st | 3rd */}
      <PodiumCard entry={second} place={2} delay={0.12} />
      <PodiumCard entry={first}  place={1} delay={0}    />
      <PodiumCard entry={third}  place={3} delay={0.22} />
    </div>
  );
}
