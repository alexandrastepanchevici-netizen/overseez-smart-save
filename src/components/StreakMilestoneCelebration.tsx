import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StreakMilestone } from '@/hooks/useStreak';
import { useHaptics } from '@/hooks/useHaptics';

const CONFETTI_COLORS = [
  'hsl(200 80% 55%)',
  'hsl(160 60% 45%)',
  'hsl(43 96% 56%)',
  'hsl(0 90% 65%)',
  '#ffffff',
];

interface RainParticle {
  x: number;       // % across screen
  size: number;    // px
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  shape: 'circle' | 'square' | 'diamond';
}

function generateRain(): RainParticle[] {
  return Array.from({ length: 60 }, (_, i) => ({
    x: Math.random() * 100,
    size: 5 + Math.random() * 9,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 2.2 + Math.random() * 2,
    delay: Math.random() * 2,
    rotation: Math.random() * 720,
    shape: (['circle', 'square', 'diamond'] as const)[i % 3],
  }));
}

export default function StreakMilestoneCelebration() {
  const [queue, setQueue] = useState<StreakMilestone[]>([]);
  const [current, setCurrent] = useState<StreakMilestone | null>(null);
  const particles = useMemo(() => generateRain(), []);
  const { tapCelebration } = useHaptics();

  useEffect(() => {
    const handler = (e: Event) => {
      const milestone = (e as CustomEvent<StreakMilestone>).detail;
      setQueue(q => [...q, milestone]);
    };
    window.addEventListener('overseez:streak-milestone', handler);
    return () => window.removeEventListener('overseez:streak-milestone', handler);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      tapCelebration();
    }
  }, [queue, current, tapCelebration]);

  const dismiss = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.days}
          className="fixed inset-0 z-[210] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismiss}
        >
          {/* Backdrop — deeper than badge unlock */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

          {/* Radial glow behind the central content */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(43 96% 56% / 0.12) 0%, transparent 70%)',
            }}
          />

          {/* Confetti rain */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: 0,
                  width: p.size,
                  height: p.shape === 'square' ? p.size : p.shape === 'diamond' ? p.size : p.size,
                  backgroundColor: p.color,
                  borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '1px',
                  transform: p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
                }}
                initial={{ y: -60, opacity: 1 }}
                animate={{ y: '105vh', rotate: p.rotation, opacity: [1, 1, 0] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeIn',
                  opacity: { times: [0, 0.75, 1], duration: p.duration, delay: p.delay },
                }}
              />
            ))}
          </div>

          {/* Central celebration card */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 pointer-events-none select-none">

            {/* Big emoji with spring pop + pulse */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
            >
              <motion.div
                className="absolute w-36 h-36 rounded-full bg-overseez-gold/15"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span style={{ fontSize: '5rem', lineHeight: 1 }}>{current.emoji}</span>
            </motion.div>

            {/* Streak day count + title */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45, ease: 'easeOut' }}
            >
              <p className="text-xs uppercase tracking-widest text-overseez-gold font-semibold mb-2">
                Streak Milestone 🔥
              </p>
              <h2 className="text-6xl font-display font-black tabular-nums leading-none">
                {current.days}
              </h2>
              <p className="text-lg font-display font-semibold text-muted-foreground mt-1">
                {current.days === 1 ? 'day' : 'days'}
              </p>
              <h3 className="text-2xl font-display font-bold mt-3">{current.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                {current.subtitle}
              </p>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              className="text-xs text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
