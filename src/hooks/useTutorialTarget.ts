import { useState, useLayoutEffect } from 'react';

/**
 * Finds the DOM element with the given data-tutorial-id and returns its DOMRect.
 * Re-measures on resize. Retries after 350ms if element not found (handles page transitions).
 */
export function useTutorialTarget(id: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!id) {
      setRect(null);
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let ro: ResizeObserver | null = null;

    const measure = () => {
      const el = document.querySelector(`[data-tutorial-id="${id}"]`);
      if (!el) {
        // Element not in DOM yet (page transition in progress) — retry after transition completes
        retryTimer = setTimeout(measure, 350);
        return;
      }
      setRect(el.getBoundingClientRect());
      ro = new ResizeObserver(() => {
        const current = document.querySelector(`[data-tutorial-id="${id}"]`);
        if (current) setRect(current.getBoundingClientRect());
      });
      ro.observe(el);
    };

    measure();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (ro) ro.disconnect();
    };
  }, [id]);

  return rect;
}
