import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTutorial, STEPS } from '@/contexts/TutorialContext';
import { useTutorialTarget } from '@/hooks/useTutorialTarget';
import { Button } from '@/components/ui/button';

const PADDING = 10;
const TOOLTIP_HEIGHT_ESTIMATE = 160; // px — used for above/below decision

export default function TutorialOverlay() {
  const { status, stepIndex, currentStep, skip, advance } = useTutorial();
  const rect = useTutorialTarget(currentStep?.id ?? null);

  const isVisible = status === 'active' && !!rect && !!currentStep;

  const spotlightStyle = useMemo(() => {
    if (!rect) return {};
    return {
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
  }, [rect]);

  const tooltipStyle = useMemo(() => {
    if (!rect || !currentStep) return {};
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - (rect.bottom + PADDING);
    const forceAbove = currentStep.position === 'above' || spaceBelow < TOOLTIP_HEIGHT_ESTIMATE;

    if (forceAbove) {
      return {
        bottom: viewportHeight - (rect.top - PADDING) + 8,
        left: 12,
        right: 12,
      };
    }
    return {
      top: rect.bottom + PADDING + 8,
      left: 12,
      right: 12,
    };
  }, [rect, currentStep]);

  const tooltipMotion = currentStep?.position === 'above'
    ? { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 6 } }
    : { initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

  const handleCta = () => {
    if (currentStep?.pauseForBadge) {
      // Trigger the search first, then advance (which pauses for badge)
      const searchBtn = document.querySelector<HTMLElement>('[data-tutorial-id="search-submit"]');
      if (searchBtn && !searchBtn.hasAttribute('disabled')) {
        searchBtn.click();
      }
    }
    advance();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Dark backdrop with spotlight hole via box-shadow */}
          <motion.div
            key={`spotlight-${stepIndex}`}
            className="fixed pointer-events-none"
            style={{
              ...spotlightStyle,
              zIndex: 300,
              borderRadius: 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)',
            }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          />

          {/* Tooltip card */}
          <motion.div
            key={`tooltip-${stepIndex}`}
            className="fixed"
            style={{ ...tooltipStyle, zIndex: 301 }}
            {...tooltipMotion}
            transition={{ duration: 0.22, ease: 'easeOut', delay: 0.08 }}
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl mx-auto" style={{ maxWidth: 340 }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  Step {stepIndex + 1} of {STEPS.length}
                </span>
                <button
                  onClick={skip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tour
                </button>
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-sm mb-1 text-foreground">
                {currentStep.tooltip.heading}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {currentStep.tooltip.body}
              </p>

              {/* Footer: progress dots + CTA */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: i === stepIndex
                          ? 'hsl(var(--overseez-blue, 200 80% 55%))'
                          : 'hsl(var(--muted-foreground) / 0.3)',
                      }}
                    />
                  ))}
                </div>
                <Button variant="hero" size="sm" onClick={handleCta} className="shrink-0">
                  {currentStep.tooltip.cta}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
