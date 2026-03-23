import React from 'react';

interface OverseezLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function OverseezLogo({ size = 32, className = '', color = 'currentColor' }: OverseezLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Thick tilted oval matching the brand mark exactly */}
      <ellipse
        cx="50"
        cy="50"
        rx="36"
        ry="32"
        transform="rotate(-25 50 50)"
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
