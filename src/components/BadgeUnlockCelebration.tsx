import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Badge } from '@/hooks/useAchievements';
import { useConfettiParticles } from '@/hooks/useConfettiParticles';
import Mascot from '@/components/Mascot';

export default function BadgeUnlockCelebration() {
  const [queue, setQueue]     = useState<Badge[]>([]);
  const [current, setCurrent] = useState<Badge | null>(null);
  const particles             = useConfettiParticles();

  useEffect(() => {
    const handler = (e: Event) => {
      const badge = (e as CustomEvent<Badge>).detail;
      setQueue(q => [...q, badge]);
    };
    window.addEventListener('overseez:badge-unlock', handler);
    return () => window.removeEventListener('overseez:badge-unlock', handler);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [queue, current]);

  const dismiss = useCallback(() => {
    setCurrent(null);
    window.dispatchEvent(new CustomEvent('overseez:badge-celebration-done'));
  }, []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.key}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 70% 55% at 50% 50%, hsl(43 96% 56% / 0.18) 0%, transparent 70%)',
          }} />

          {/* Confetti rain */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left:            `${p.x}%`,
                  top:             0,
                  width:           p.shape === 'strip' ? p.size * 0.4 : p.size,
                  height:          p.shape === 'strip' ? p.size * 2.5 : p.size,
                  backgroundColor: p.color,
                  borderRadius:    p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '1px',
                  transform:       p.shape === 'diamond' ? 'rotate(45deg)' : undefined,
                }}
                initial={{ y: -80, opacity: 1 }}
                animate={{ y: '108vh', rotate: p.rotation, opacity: [1, 1, 0] }}
                transition={{
                  duration: p.duration,
                  delay:    p.delay,
                  ease:     'easeIn',
                  opacity:  { times: [0, 0.78, 1], duration: p.duration, delay: p.delay },
                }}
              />
            ))}
          </div>

          {/* Mascot cheering from the bottom-right */}
          <motion.div
            className="absolute bottom-0 right-0 z-10 pointer-events-none"
            initial={{ x: 80, y: 40, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.35 }}
          >
            <Mascot pose="celebrate" size={180} />
          </motion.div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 pointer-events-none select-none">

            {/* Glow rings + badge tile */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute rounded-full"
                style={{ width: 200, height: 200, background: 'radial-gradient(circle, hsl(43 96% 56% / 0.18) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute rounded-full border border-overseez-gold/25"
                style={{ width: 160, height: 160 }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
              <motion.div
                className="absolute rounded-full border-2 border-overseez-gold/40"
                style={{ width: 124, height: 124 }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              />

              {/* Badge tile — renders lucide icon */}
              <motion.div
                className="relative w-28 h-28 rounded-3xl flex items-center justify-center"
                style={{
                  background:  'linear-gradient(135deg, hsl(43 96% 56% / 0.25) 0%, hsl(200 80% 55% / 0.2) 100%)',
                  border:      '2px solid hsl(43 96% 56% / 0.55)',
                  boxShadow:   '0 0 40px hsl(43 96% 56% / 0.45), 0 0 80px hsl(43 96% 56% / 0.2), inset 0 1px 0 hsl(43 96% 56% / 0.3)',
                }}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
              >
                <current.icon
                  className="w-16 h-16 text-overseez-gold"
                  style={{ filter: 'drop-shadow(0 0 12px hsl(43 96% 56% / 0.8))' }}
                />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.4, ease: 'easeOut' }}
            >
              <p className="text-xs uppercase tracking-widest text-overseez-gold font-semibold mb-2">
                Badge Unlocked
              </p>
              <h2 className="text-2xl font-display font-bold text-foreground">{current.name}</h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                {current.description}
              </p>
            </motion.div>

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
