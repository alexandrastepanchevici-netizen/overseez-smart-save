import React from 'react';
import heroImg from '@/assets/mascot-hero.png';
import searchImg from '@/assets/mascot-search.png';
import mapImg from '@/assets/mascot-map.png';
import laptopImg from '@/assets/mascot-laptop.png';
import moneyImg from '@/assets/mascot-money.png';
import celebrateImg from '@/assets/mascot-celebrate.png';

export type MascotPose =
  | 'hero'
  | 'search'
  | 'map'
  | 'laptop'
  | 'money'
  | 'celebrate';

const POSES: Record<MascotPose, string> = {
  hero: heroImg,
  search: searchImg,
  map: mapImg,
  laptop: laptopImg,
  money: moneyImg,
  celebrate: celebrateImg,
};

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Overseez panther mascot. Pick the pose that fits the surrounding context:
 *  - hero      → welcomes / landing / onboarding
 *  - search    → reviewing prices / receipts
 *  - map       → location, navigation, "near me" empty states
 *  - laptop    → work, login, dashboards
 *  - money     → savings totals, savings list
 *  - celebrate → milestones, badges, level-ups
 */
export default function Mascot({
  pose = 'hero',
  size = 160,
  className = '',
  alt = 'Overseez mascot',
}: MascotProps) {
  return (
    <img
      src={POSES[pose]}
      alt={alt}
      draggable={false}
      style={{ height: size, width: 'auto' }}
      className={`object-contain select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] ${className}`}
    />
  );
}
