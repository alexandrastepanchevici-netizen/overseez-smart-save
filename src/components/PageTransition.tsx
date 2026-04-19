import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

// The 4 main tab routes in left→right order.
// Navigating to a higher index = slide left (new page comes from right).
// Navigating to a lower index  = slide right (new page comes from left).
const MAIN_TABS = ['/dashboard', '/search', '/subscription', '/profile'];

// Routes that should slide UP from the bottom as a full-screen panel.
// Everything else that isn't a main tab gets a plain fade.
const PANEL_PAGES = ['/streak', '/movement', '/terms'];

interface TransitionConfig {
  direction: number;       // +1 forward, -1 backward, 0 none
  isPanel: boolean;        // entering a panel page
  isClosingPanel: boolean; // leaving a panel page back to a main tab
}

// Easing curves
const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;
const EASE_IN  = [0.55, 0, 1, 0.45] as const;

const pageVariants: import('motion/react').Variants = {
  initial: (cfg: TransitionConfig) => {
    if (cfg.isPanel)        return { y: '100%', opacity: 1 };
    if (cfg.isClosingPanel) return { opacity: 0 };
    if (cfg.direction > 0)  return { x: '42%',  opacity: 0 };
    if (cfg.direction < 0)  return { x: '-42%', opacity: 0 };
    return { opacity: 0 };
  },

  animate: (cfg: TransitionConfig) => {
    if (cfg.isPanel) {
      return { y: 0, opacity: 1, transition: { duration: 0.36, ease: EASE_OUT } };
    }
    if (cfg.isClosingPanel) {
      // The page behind the closing panel just fades in gently near the end.
      return { opacity: 1, transition: { duration: 0.18, delay: 0.18, ease: 'easeOut' as const } };
    }
    if (cfg.direction !== 0) {
      return { x: 0, opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } };
    }
    return { opacity: 1, transition: { duration: 0.1, ease: 'easeOut' as const } };
  },

  exit: (cfg: TransitionConfig) => {
    // isClosingPanel: the PANEL page is exiting — slides back down.
    if (cfg.isClosingPanel) {
      return { y: '100%', opacity: 1, transition: { duration: 0.3, ease: EASE_IN } };
    }
    // isPanel: the background page exits quickly so the panel can slide up over it.
    if (cfg.isPanel) {
      return { opacity: 0, transition: { duration: 0.06 } };
    }
    if (cfg.direction > 0) {
      return { x: '-42%', opacity: 0, transition: { duration: 0.15, ease: EASE_IN } };
    }
    if (cfg.direction < 0) {
      return { x: '42%',  opacity: 0, transition: { duration: 0.15, ease: EASE_IN } };
    }
    return { opacity: 0, transition: { duration: 0.07, ease: 'easeIn' as const } };
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // Track previous pathname in a ref so we can read it synchronously during render.
  // useEffect fires AFTER the render, so the ref still holds the OLD value
  // when this render runs — exactly what we need to compute direction.
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
    // `custom` on AnimatePresence propagates the CURRENT config to the exit
    // variants of the outgoing element, enabling the correct directional exit.
    <AnimatePresence mode="wait" custom={cfg} initial={false}>
      <motion.div
        key={location.pathname}
        custom={cfg}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        // Panel pages render on top; give them a higher stacking order
        // so they overlay the outgoing page during mode="wait" hand-off.
        style={isPanel ? { position: 'relative', zIndex: 10 } : undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
