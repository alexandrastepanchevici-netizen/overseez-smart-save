import React from 'react';

/**
 * Decorative floating ovals that echo the brand mark.
 * Place behind hero sections / across pages for visual depth.
 */
export default function FloatingOvals({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Large oval top-right */}
      <svg className="absolute -top-24 -right-20 w-[420px] h-[420px] opacity-[0.04] animate-float" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(200 80% 55%)" strokeWidth="3" />
      </svg>
      {/* Medium oval bottom-left */}
      <svg className="absolute -bottom-16 -left-16 w-[300px] h-[300px] opacity-[0.05] animate-float-delayed" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(185 70% 55%)" strokeWidth="4" />
      </svg>
      {/* Small oval center-left */}
      <svg className="absolute top-1/3 left-[8%] w-[160px] h-[160px] opacity-[0.03] animate-float" style={{ animationDelay: '4s' }} viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(43 96% 56%)" strokeWidth="5" />
      </svg>
      {/* Tiny oval mid-right */}
      <svg className="absolute top-[60%] right-[12%] w-[100px] h-[100px] opacity-[0.04] animate-float-delayed" style={{ animationDelay: '2s' }} viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(200 60% 50%)" strokeWidth="6" />
      </svg>

      {/* Gradient orbs for depth */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-[0.06] animate-float"
        style={{ background: 'radial-gradient(circle, hsl(200 80% 55%) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full opacity-[0.04] animate-float-delayed"
        style={{ background: 'radial-gradient(circle, hsl(185 70% 55%) 0%, transparent 70%)' }} />
    </div>
  );
}
