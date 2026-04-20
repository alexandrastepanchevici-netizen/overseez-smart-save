import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import hero from '@/assets/mascot/cat-hero.png';
import detective from '@/assets/mascot/cat-detective.png';
import map from '@/assets/mascot/cat-map.png';
import sleeping from '@/assets/mascot/cat-sleeping.png';
import shrug from '@/assets/mascot/cat-shrug.png';
import teacher from '@/assets/mascot/cat-teacher.png';
import traveling from '@/assets/mascot/cat-traveling.png';
import trophy from '@/assets/mascot/cat-trophy.png';
import celebrate from '@/assets/mascot/cat-celebrate.png';
import streakSmall from '@/assets/mascot/cat-streak-small.png';
import streakMedium from '@/assets/mascot/cat-streak-medium.png';
import streakLarge from '@/assets/mascot/cat-streak-large.png';

export type MascotPose =
  | 'hero'
  | 'detective'
  | 'map'
  | 'sleeping'
  | 'shrug'
  | 'teacher'
  | 'traveling'
  | 'trophy'
  | 'celebrate'
  | 'streak-small'
  | 'streak-medium'
  | 'streak-large';

const POSES: Record<MascotPose, string> = {
  hero,
  detective,
  map,
  sleeping,
  shrug,
  teacher,
  traveling,
  trophy,
  celebrate,
  'streak-small': streakSmall,
  'streak-medium': streakMedium,
  'streak-large': streakLarge,
};

interface MascotProps {
  pose: MascotPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const SIZES = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
} as const;

/** Picks the right streak pose based on day count */
export function streakPose(days: number): MascotPose {
  if (days >= 30) return 'streak-large';
  if (days >= 7) return 'streak-medium';
  return 'streak-small';
}

export default function Mascot({ pose, size = 'md', className, animate = true }: MascotProps) {
  const src = POSES[pose];
  const Wrapper = animate ? motion.img : 'img';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 12, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
        key: pose, // re-mount on pose change for fade
      }
    : {};
  return (
    <Wrapper
      src={src}
      alt=""
      draggable={false}
      className={cn('object-contain select-none pointer-events-none', SIZES[size], className)}
      {...(motionProps as any)}
    />
  );
}
