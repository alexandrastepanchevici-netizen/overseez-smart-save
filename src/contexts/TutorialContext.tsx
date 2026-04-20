import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'overseez_tutorial_completed';
const BADGE_PAUSE_TIMEOUT_MS = 30_000; // safety: auto-advance if badge never fires

export type TutorialStatus = 'idle' | 'active' | 'paused_for_badge' | 'done';

export interface TutorialStep {
  id: string;
  route: string;
  tooltip: {
    heading: string;
    body: string;
    cta: string;
  };
  position: 'above' | 'below';
  pauseForBadge?: boolean;
}

export const STEPS: TutorialStep[] = [
  {
    id: 'nav-search',
    route: '/dashboard',
    tooltip: {
      heading: 'Find the best prices nearby',
      body: 'Tap Search to compare live prices at stores around you.',
      cta: 'Show me',
    },
    position: 'above',
  },
  {
    id: 'search-input',
    route: '/search',
    tooltip: {
      heading: 'Try searching for milk',
      body: "We've pre-filled a search — hit the button and see live prices in seconds.",
      cta: 'Search now',
    },
    position: 'below',
    pauseForBadge: true,
  },
  {
    id: 'dashboard-savings',
    route: '/dashboard',
    tooltip: {
      heading: 'Track every penny you save',
      body: 'Every saving you log adds up here. Your total grows as you find better deals.',
      cta: 'Got it',
    },
    position: 'below',
  },
  {
    id: 'nav-leaderboard',
    route: '/leaderboard',
    tooltip: {
      heading: 'See how you rank',
      body: 'Compete with local savers weekly. Top 3 finish earns bonus search credits.',
      cta: 'Check it out',
    },
    position: 'above',
  },
  {
    id: 'profile-badge-shelf',
    route: '/profile',
    tooltip: {
      heading: 'Your badges live here',
      body: 'You just earned your first one. Keep searching to unlock more.',
      cta: 'Finish tour',
    },
    position: 'below',
  },
];

interface TutorialContextValue {
  status: TutorialStatus;
  stepIndex: number;
  currentStep: TutorialStep | null;
  isTutorialActive: boolean;
  tutorialQuery: string | null;
  startTutorial: () => void;
  advance: () => void;
  skip: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TutorialStatus>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const badgePauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: never start if already completed
  const isCompleted = useCallback(() => !!localStorage.getItem(STORAGE_KEY), []);

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setStatus('done');
  }, []);

  const startTutorial = useCallback(() => {
    if (isCompleted()) return;
    setStepIndex(0);
    setStatus('active');
  }, [isCompleted]);

  const skip = useCallback(() => {
    if (badgePauseTimer.current) clearTimeout(badgePauseTimer.current);
    complete();
  }, [complete]);

  const advance = useCallback(() => {
    setStepIndex(prev => {
      const next = prev + 1;
      if (next >= STEPS.length) {
        complete();
        navigate('/search');
        return prev;
      }

      const nextStep = STEPS[next];

      if (STEPS[prev].pauseForBadge) {
        // Enter paused state — wait for badge celebration to close
        setStatus('paused_for_badge');

        // Safety timeout: if badge never fires within 30s, skip ahead
        badgePauseTimer.current = setTimeout(() => {
          setStatus('active');
          navigate(nextStep.route);
        }, BADGE_PAUSE_TIMEOUT_MS);

        return next;
      }

      navigate(nextStep.route);
      return next;
    });
  }, [complete, navigate]);

  // Listen for badge celebration close — resume tutorial
  useEffect(() => {
    const handler = () => {
      if (status !== 'paused_for_badge') return;
      if (badgePauseTimer.current) clearTimeout(badgePauseTimer.current);
      setStatus('active');
      navigate(STEPS[stepIndex].route);
    };
    window.addEventListener('overseez:badge-celebration-done', handler);
    return () => window.removeEventListener('overseez:badge-celebration-done', handler);
  }, [status, stepIndex, navigate]);

  // Navigate when step changes (for non-paused transitions)
  useEffect(() => {
    if (status !== 'active') return;
    navigate(STEPS[stepIndex].route);
  }, [stepIndex, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const isTutorialActive = status === 'active' || status === 'paused_for_badge';
  const currentStep = status === 'active' ? STEPS[stepIndex] : null;
  const tutorialQuery = stepIndex === 1 && isTutorialActive ? 'milk' : null;

  return (
    <TutorialContext.Provider value={{
      status,
      stepIndex,
      currentStep,
      isTutorialActive,
      tutorialQuery,
      startTutorial,
      advance,
      skip,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
  return ctx;
}
