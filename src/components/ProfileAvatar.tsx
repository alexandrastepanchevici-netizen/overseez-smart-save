import React from 'react';
import { User, Camera } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl:   string | null;
  nickname:    string;
  size?:       'sm' | 'md' | 'lg';
  onClick?:    () => void;
  showLevel?:  boolean;
  level?:      number;
  weeklyRank?: number | null;
  className?:  string;
}

const RANK_RING: Record<number, string> = {
  1: 'ring-2 ring-overseez-gold shadow-[0_0_14px_3px_hsl(43_96%_56%_/_0.65)]',
  2: 'ring-2 ring-slate-300 shadow-[0_0_10px_2px_rgba(203,213,225,0.55)]',
  3: 'ring-2 ring-amber-600 shadow-[0_0_10px_2px_rgba(180,83,9,0.5)]',
};

const SIZE_MAP = {
  sm: { outer: 'w-7 h-7',   icon: 'w-4 h-4', camera: 'w-3.5 h-3.5' },
  md: { outer: 'w-16 h-16', icon: 'w-8 h-8', camera: 'w-5 h-5'    },
  lg: { outer: 'w-24 h-24', icon: 'w-10 h-10', camera: 'w-6 h-6'  },
};

export default function ProfileAvatar({
  avatarUrl,
  nickname,
  size = 'md',
  onClick,
  showLevel = false,
  level,
  className = '',
}: ProfileAvatarProps) {
  const s = SIZE_MAP[size];

  const inner = (
    <div className={`relative ${onClick ? 'group' : ''} flex-shrink-0 ${className}`}>
      <div
        className={`${s.outer} rounded-full bg-overseez-blue/20 flex items-center justify-center overflow-hidden`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" />
        ) : (
          <User className={`${s.icon} text-overseez-blue`} />
        )}
      </div>

      {/* Camera overlay — only when clickable */}
      {onClick && (
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
          <Camera className={`${s.camera} text-white`} />
        </div>
      )}

      {/* XP level badge */}
      {showLevel && level != null && (
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-overseez-blue text-white rounded-full px-1.5 py-0.5 leading-none z-10 select-none">
          {level}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="relative flex-shrink-0 focus:outline-none">
        {inner}
      </button>
    );
  }

  return inner;
}
