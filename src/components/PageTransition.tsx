import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

const MAIN_TABS = ['/dashboard', '/search', '/leaderboard', '/subscription', '/profile'];
const PANEL_PAGES = ['/streak', '/movement', '/terms'];

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;
const EASE_IN  = [0.55, 0, 1, 0.45] as const;

interface TransitionConfig {
  direction: number;
  isPanel: boolean;
  isClosingPanel: boolean;
}

const pageVariants: import('motion/react').Variants = {
  initial: (cfg: TransitionConfig) => {
    if (cfg.isPanel)        return { y: '100%' };
    if (cfg.isClosingPanel) return { x: 0 };
    if (cfg.direction > 0)  return { x: '100%' };
    if (cfg.direction < 0)  return { x: '-100%' };
    return { x: 0 };
  },

  animate: (cfg: TransitionConfig) => {
    if (cfg.isPanel) {
      return { y: 0, transition: { duration: 0.36, ease: EASE_OUT } };
    }
    if (cfg.isClosingPanel) {
      return { x: 0, transition: { duration: 0.28, ease: EASE_OUT } };
    }
    if (cfg.direction !== 0) {
      return { x: 0, transition: { duration: 0.28, ease: EASE_OUT } };
    }
    return { x: 0 };
  },

  exit: (cfg: TransitionConfig) => {
    if (cfg.isClosingPanel) {
      return { y: '100%', transition: { duration: 0.3, ease: EASE_IN } };
    }
    if (cfg.isPanel) {
      return { x: 0, transition: { duration: 0.06 } };
    }
    if (cfg.direction > 0)  return { x: '-100%', transition: { duration: 0.28, ease: EASE_IN } };
    if (cfg.direction < 0)  return { x: '100%',  transition: { duration: 0.28, ease: EASE_IN } };
    return { x: 0 };
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const prevPathnameRef = useRef(location.pathname);
  const prevPathname = prevPathnameRef.current;

  useEffect(() => {
    prevPathnameRef.current = location.pathname;
  });

  const prevTabIdx = MAIN_TABS.indexOf(prevPathname);
  const currTabIdx = MAIN_TABS.indexOf(location.pathname);

  const isPanel = currTabIdx === -1 && PANEL_PAGES.some(p => location.pathname.startsWith(p));
  const isClosingPanel =
    prevTabIdx === -1 &&
    currTabIdx !== -1 &&
    PANEL_PAGES.some(p => prevPathname.startsWith(p));

  const direction =
    prevTabIdx !== -1 && currTabIdx !== -1
      ? Math.sign(currTabIdx - prevTabIdx)
      : 0;

  const cfg: TransitionConfig = { direction, isPanel, isClosingPanel };

  return (
    <AnimatePresence mode="popLayout" custom={cfg} initial={false}>
      <motion.div
        key={location.pathname}
        custom={cfg}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={isPanel ? { position: 'relative', zIndex: 10 } : undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
