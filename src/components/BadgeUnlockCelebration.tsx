import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Badge } from '@/hooks/useAchievements';

const CONFETTI_COLORS = [
  'hsl(200 80% 55%)',  // overseez-blue
  'hsl(160 60% 45%)',  // overseez-green
  'hsl(43 96% 56%)',   // overseez-gold
  '#ffffff',
];

interface Particle {
  tx: number;
  ty: number;
  color: string;
  delay: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 70 + Math.random() * 50;
    return {
      tx: Math.cos((angle * Math.PI) / 180) * distance,
      ty: Math.sin((angle * Math.PI) / 180) * distance,
      color: CONFETTI_COLORS[i % 4],
      delay: Math.random() * 0.15,
    };
  });
}

export default function BadgeUnlockCelebration() {
  const [queue, setQueue] = useState<Badge[]>([]);
  const [current, setCurrent] = useState<Badge | null>(null);
  const particles = useMemo(() => generateParticles(), []);

  // Listen for badge unlock events fired by useAchievements
  useEffect(() => {
    const handler = (e: Event) => {
      const badge = (e as CustomEvent<Badge>).detail;
      setQueue(q => [...q, badge]);
    };
    window.addEventListener('overseez:badge-unlock', handler);
    return () => window.removeEventListener('overseez:badge-unlock', handler);
  }, []);

  // Dequeue one badge at a time — wait for current to clear before showing next
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [queue, current]);

  const dismiss = useCallback(() => setCurrent(null), []);

  // Auto-dismiss after 3.5s
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, 3500);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.key}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

          {/* Confetti layer */}
          <div className="absolute flex items-center justify-center pointer-events-none" style={{ inset: 0 }}>
            {particles.map((p, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: p.color,
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`,
                  animation: `confetti-burst 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s both`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Main card */}
          <div className="relative flex flex-col items-center gap-5 px-8 pointer-events-none select-none">
            {/* Badge emoji — spring scale in */}
            <motion.div
              className="w-28 h-28 rounded-3xl bg-overseez-blue/20 border-2 border-overseez-blue/40 flex items-center justify-center shadow-lg"
              style={{ fontSize: '4rem' }}
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
            >
              {current.emoji}
            </motion.div>

            {/* Text block */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            >
              <p className="text-xs uppercase tracking-widest text-overseez-gold font-semibold mb-2">
                Badge Unlocked ✨
              </p>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {current.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                {current.description}
              </p>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              className="text-xs text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
            >
              Tap anywhere to continue
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
