import React from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface RouteMood {
  c1: string; // large oval + primary orb
  c2: string; // medium oval + secondary orb
  c3: string; // small oval
  c4: string; // tiny oval
  dx: number; // whole-layer x drift
  dy: number; // whole-layer y drift
}

const MOODS: Record<string, RouteMood> = {
  '/home':         { c1: '200 80% 55%', c2: '185 70% 55%', c3: '43 96% 56%',  c4: '200 60% 50%', dx: 0,   dy: 0   },
  '/dashboard':    { c1: '185 70% 55%', c2: '200 80% 55%', c3: '160 60% 45%', c4: '185 70% 55%', dx: -18, dy: 12  },
  '/search':       { c1: '43 96% 56%',  c2: '200 80% 55%', c3: '185 70% 55%', c4: '43 80% 50%',  dx: 14,  dy: -18 },
  '/profile':      { c1: '160 60% 45%', c2: '185 70% 55%', c3: '200 80% 55%', c4: '160 50% 45%', dx: -12, dy: 18  },
  '/subscription': { c1: '200 80% 55%', c2: '43 96% 56%',  c3: '160 60% 45%', c4: '200 80% 55%', dx: 10,  dy: -10 },
};

const DEFAULT_MOOD = MOODS['/home'];
const TRANSITION = { duration: 0.65, ease: 'easeInOut' as const };

export default function FloatingOvals({ className = '' }: { className?: string }) {
  const location = useLocation();
  const mood = MOODS[location.pathname] ?? DEFAULT_MOOD;

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      animate={{ x: mood.dx, y: mood.dy }}
      transition={TRANSITION}
    >
      {/* Large oval top-right */}
      <motion.svg
        className="absolute -top-24 -right-20 w-[420px] h-[420px] opacity-[0.04] animate-float"
        viewBox="0 0 100 100"
        fill="none"
        animate={{ x: mood.dx * 0.4, y: mood.dy * 0.4 }}
        transition={TRANSITION}
      >
        <motion.ellipse
          cx="50" cy="50" rx="38" ry="34"
          transform="rotate(-18 50 50)"
          strokeWidth="3"
          style={{ stroke: `hsl(${mood.c1})` }}
          animate={{ stroke: `hsl(${mood.c1})` }}
          transition={TRANSITION}
        />
      </motion.svg>

      {/* Medium oval bottom-left */}
      <motion.svg
        className="absolute -bottom-16 -left-16 w-[300px] h-[300px] opacity-[0.05] animate-float-delayed"
        viewBox="0 0 100 100"
        fill="none"
        animate={{ x: mood.dx * -0.3, y: mood.dy * -0.3 }}
        transition={TRANSITION}
      >
        <motion.ellipse
          cx="50" cy="50" rx="38" ry="34"
          transform="rotate(-18 50 50)"
          strokeWidth="4"
          style={{ stroke: `hsl(${mood.c2})` }}
          animate={{ stroke: `hsl(${mood.c2})` }}
          transition={TRANSITION}
        />
      </motion.svg>

      {/* Small oval center-left */}
      <motion.svg
        className="absolute top-1/3 left-[8%] w-[160px] h-[160px] opacity-[0.03] animate-float"
        style={{ animationDelay: '4s' }}
        viewBox="0 0 100 100"
        fill="none"
        animate={{ x: mood.dx * 0.6, y: mood.dy * 0.2 }}
        transition={TRANSITION}
      >
        <motion.ellipse
          cx="50" cy="50" rx="38" ry="34"
          transform="rotate(-18 50 50)"
          strokeWidth="5"
          style={{ stroke: `hsl(${mood.c3})` }}
          animate={{ stroke: `hsl(${mood.c3})` }}
          transition={TRANSITION}
        />
      </motion.svg>

      {/* Tiny oval mid-right */}
      <motion.svg
        className="absolute top-[60%] right-[12%] w-[100px] h-[100px] opacity-[0.04] animate-float-delayed"
        style={{ animationDelay: '2s' }}
        viewBox="0 0 100 100"
        fill="none"
        animate={{ x: mood.dx * -0.5, y: mood.dy * 0.5 }}
        transition={TRANSITION}
      >
        <motion.ellipse
          cx="50" cy="50" rx="38" ry="34"
          transform="rotate(-18 50 50)"
          strokeWidth="6"
          style={{ stroke: `hsl(${mood.c4})` }}
          animate={{ stroke: `hsl(${mood.c4})` }}
          transition={TRANSITION}
        />
      </motion.svg>

      {/* Gradient orbs for depth */}
      <motion.div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-[0.06] animate-float"
        animate={{ background: `radial-gradient(circle, hsl(${mood.c1}) 0%, transparent 70%)` }}
        transition={TRANSITION}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full opacity-[0.04] animate-float-delayed"
        animate={{ background: `radial-gradient(circle, hsl(${mood.c2}) 0%, transparent 70%)` }}
        transition={TRANSITION}
      />
    </motion.div>
  );
}
