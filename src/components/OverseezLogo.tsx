import React from 'react';
import logoImg from '@/assets/overseez-logo.png';

interface OverseezLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function OverseezLogo({ size = 64, className = '' }: OverseezLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Overseez"
      className={`object-contain ${className}`}
      style={{ height: size, width: 'auto', imageRendering: 'auto', filter: 'brightness(1.15) contrast(1.1)', verticalAlign: 'middle' }}
    />
  );
}
