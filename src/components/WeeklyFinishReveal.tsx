import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Medal, Award, Zap, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useConfettiParticles } from '@/hooks/useConfettiParticles';
import { toast } from 'sonner';

interface WeeklyRevealData {
  rank: 1 | 2 | 3;
}

const RANK_CONFIG = {
  1: {
    icon:       Crown,
    iconColor:  'text-overseez-gold',
    glow:       'hsl(43 96% 56% / 0.5)',
    label:      '1st Place',
    headline:   "You're this week's Champion!",
    frameDesc:  "You've earned the Gold Frame",
    bonusDesc:  '12 hours off your next search reset',
    shareText:  "I finished #1 on Overseez this week! Check it out:",
  },
  2: {
    icon:       Medal,
    iconColor:  'text-slate-300',
    glow:       'rgba(203,213,225,0.45)',
    label:      '2nd Place',
    headline:   'Runner-up this week!',
    frameDesc:  "You've earned the Silver Frame",
    bonusDesc:  '8 hours off your next search reset',
    shareText:  'I finished 2nd on Overseez this week! Check it out:',
  },
  3: {
    icon:       Award,
    iconColor:  'text-amber-600',
    glow:       'rgba(180,83,9,0.4)',
    label:      '3rd Place',
    headline:   'Podium finish this week!',
    frameDesc:  "You've earned the Bronze Frame",
    bonusDesc:  '6 hours off your next search reset',
    shareText:  'I finished 3rd on Overseez this week! Check it out:',
  },
} as const;

const STORAGE_KEY = 'overseez:weeklyReveal';

export default function WeeklyFinishReveal() {
  const { profile } = useAuth();
  const [reveal, setReveal] = useState<WeeklyRevealData | null>(null);
  const particles = useConfettiParticles();

  // Read and clear the pending reveal from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as WeeklyRevealData;
        if (parsed.rank >= 1 && parsed.rank <= 3) {
          localStorage.removeItem(STORAGE_KEY);
          setReveal(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const dismiss = useCallback(() => setReveal(null), []);

  const handleShare = useCallback(async () => {
    if (!reveal) return;
    const config = RANK_CONFIG[reveal.rank];
    const text = `${config.shareText} https://overseez.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Overseez', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      }
    } catch {
      // user cancelled share
    }
  }, [reveal]);

  if (!reveal) return null;

  const config = RANK_CONFIG[reveal.rank];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={dismiss}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

        {/* Radial glow in rank colour */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${config.glow} 0%, transparent 70%)` }}
        />

        {/* Confetti */}
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

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center gap-5 px-8 text-center"
          onClick={e => e.stopPropagation()}
        >
          {/* Rank icon tile */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute rounded-full"
              style={{ width: 200, height: 200, background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)` }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{
                border:    `2px solid ${config.glow}`,
                boxShadow: `0 0 40px ${config.glow}, 0 0 80px ${config.glow.replace('0.5', '0.2').replace('0.45', '0.15').replace('0.4', '0.15')}`,
                background: 'hsl(var(--card))',
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
            >
              <Icon
                className={`w-16 h-16 ${config.iconColor}`}
                style={{ filter: `drop-shadow(0 0 12px ${config.glow})` }}
              />
            </motion.div>
          </div>

          {/* Rank label + headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4, ease: 'easeOut' }}
          >
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: config.glow }}>
              {config.label}
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">{config.headline}</h2>
          </motion.div>

          {/* Frame + bonus info cards */}
          <motion.div
            className="flex flex-col gap-2 w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <ProfileAvatar
                size="sm"
                weeklyRank={reveal.rank}
                avatarUrl={(profile as any)?.avatar_url ?? null}
                nickname={(profile as any)?.nickname ?? ''}
              />
              <p className="text-sm text-foreground">{config.frameDesc}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
              <Zap className="w-4 h-4 text-overseez-gold flex-shrink-0" />
              <p className="text-sm text-foreground">{config.bonusDesc}</p>
            </div>
          </motion.div>

          {/* Share button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleShare}
            className="bg-overseez-blue text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share your result
          </motion.button>

          {/* Dismiss hint */}
          <motion.p
            className="text-xs text-muted-foreground/40 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            onClick={dismiss}
          >
            Tap anywhere to continue
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper for the weekly reset hook to queue a reveal
export function queueWeeklyReveal(rank: 1 | 2 | 3) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rank }));
}
