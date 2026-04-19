import { useMemo } from 'react';

export const CONFETTI_COLORS = [
  'hsl(200 80% 55%)',
  'hsl(160 60% 45%)',
  'hsl(43 96% 56%)',
  'hsl(0 90% 65%)',
  '#ffffff',
  'hsl(280 70% 65%)',
  'hsl(340 80% 60%)',
];

export interface ConfettiParticle {
  x:        number;
  size:     number;
  color:    string;
  duration: number;
  delay:    number;
  rotation: number;
  shape:    'circle' | 'square' | 'diamond' | 'strip';
}

export function generateConfettiParticles(count = 90): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    x:        Math.random() * 100,
    size:     4 + Math.random() * 10,
    color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 1.8 + Math.random() * 2.4,
    delay:    Math.random() * 2.5,
    rotation: Math.random() * 900,
    shape:    (['circle', 'square', 'diamond', 'strip'] as const)[i % 4],
  }));
}

export function useConfettiParticles(count = 90): ConfettiParticle[] {
  // Stable across re-renders — only generated once per mount
  return useMemo(() => generateConfettiParticles(count), [count]);
}
