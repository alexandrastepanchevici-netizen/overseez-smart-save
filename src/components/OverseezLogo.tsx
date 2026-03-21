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
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="42"
        transform="rotate(-15 50 50)"
        stroke={color}
        strokeWidth="6"
        fill="none"
      />
    </svg>
  );
}
