import React from 'react';
import { User, Camera } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl:   string | null;
  nickname:    string;
  size?:       'sm' | 'md' | 'lg';
  weeklyRank:  number | null;
  onClick?:    () => void;
  showLevel?:  boolean;
  level?:      number;
  className?:  string;
}

const SIZE_MAP = {
  sm: { outer: 'w-7 h-7',   icon: 'w-4 h-4', camera: 'w-3.5 h-3.5' },
  md: { outer: 'w-16 h-16', icon: 'w-8 h-8', camera: 'w-5 h-5'    },
  lg: { outer: 'w-24 h-24', icon: 'w-10 h-10', camera: 'w-6 h-6'  },
};

// Ring sizes differ per avatar size so the frame stays proportional
const RING_SIZE = {
  sm: 'ring-[1.5px]',
  md: 'ring-2',
  lg: 'ring-2',
};

const FRAME_BASE: Record<number, string> = {
  1: 'shadow-[0_0_14px_3px_hsl(43_96%_56%_/_0.65)]',   // gold glow
  2: 'shadow-[0_0_10px_2px_rgba(203,213,225,0.55)]',     // silver glow
  3: 'shadow-[0_0_10px_2px_rgba(180,83,9,0.5)]',         // bronze glow
};

const RING_COLOR: Record<number, string> = {
  1: 'ring-overseez-gold',
  2: 'ring-slate-300',
  3: 'ring-amber-600',
};

function getFrameClasses(rank: number | null, size: 'sm' | 'md' | 'lg'): string {
  if (!rank || rank > 3) return '';
  return `${RING_SIZE[size]} ${RING_COLOR[rank]} ${FRAME_BASE[rank]}`;
}

export default function ProfileAvatar({
  avatarUrl,
  nickname,
  size = 'md',
  weeklyRank,
  onClick,
  showLevel = false,
  level,
  className = '',
}: ProfileAvatarProps) {
  const s = SIZE_MAP[size];
  const frameClasses = getFrameClasses(weeklyRank, size);

  const inner = (
    <div className={`relative ${onClick ? 'group' : ''} flex-shrink-0 ${className}`}>
      <div
        className={`${s.outer} rounded-full bg-overseez-blue/20 flex items-center justify-center overflow-hidden transition-shadow ${frameClasses}`}
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
