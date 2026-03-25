import React from 'react';
import logoImg from '@/assets/overseez-logo.png';

interface OverseezLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function OverseezLogo({ size = 32, className = '' }: OverseezLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Overseez"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ height: size, width: 'auto' }}
    />
  );
}
