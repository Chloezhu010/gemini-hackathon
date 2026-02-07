import React from 'react';

export interface IconProps {
  className?: string;
  color?: string;
  weight?: string;
}

const strokeStyle = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
  strokeWidth: '2.5',
};

export const Icons = {
  // Brand
  Logo: ({ className = "w-10 h-10", color }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} style={{ overflow: 'visible' }}>
      <path 
        d="M50 10 Q 60 40, 90 50 Q 60 60, 50 90 Q 40 60, 10 50 Q 40 40, 50 10 Z" 
        stroke={color || "currentColor"} 
        strokeWidth="4" 
        fill={color || "currentColor"} 
        fillOpacity="0.2"
        style={strokeStyle} 
      />
      <path 
        d="M20 80 Q 50 95, 80 80 Q 95 50, 80 20" 
        stroke={color || "currentColor"} 
        strokeWidth="3" 
        strokeDasharray="5,5"
        style={strokeStyle} 
      />
      <circle cx="85" cy="15" r="3" fill={color || "currentColor"} />
      <circle cx="15" cy="85" r="2" fill={color || "currentColor"} />
    </svg>
  ),

  // UI
  ArrowRight: ({ className = "w-6 h-6", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: ({ className = "w-6 h-6", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Check: ({ className = "w-6 h-6", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),

  // Features (Landing Page)
  Pencil: ({ className = "w-12 h-12", color }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M20 80 L 10 90 L 30 90 Z" stroke={color || "currentColor"} fill={color || "currentColor"} style={strokeStyle} />
      <path d="M20 80 L 70 30 L 90 50 L 40 100 L 20 80" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M70 30 L 80 20 Q 90 30, 90 50" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M30 70 L 50 90" stroke={color || "currentColor"} style={strokeStyle} />
    </svg>
  ),
  Shield: ({ className = "w-12 h-12", color }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className}>
      <path d="M20 20 Q 50 10, 80 20 V 50 Q 50 90, 20 50 Z" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M50 20 V 80" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M20 50 H 80" stroke={color || "currentColor"} style={strokeStyle} />
    </svg>
  ),
  Book: ({ className = "w-12 h-12", color }: IconProps) => (
    <svg viewBox="0 0 100 80" className={className}>
      <path d="M10 20 Q 30 30, 50 20 Q 70 30, 90 20 L 90 70 Q 70 80, 50 70 Q 30 80, 10 70 Z" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M50 20 L 50 70" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M20 35 H 40" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M20 45 H 40" stroke={color || "currentColor"} style={strokeStyle} />
      <path d="M60 35 H 80" stroke={color || "currentColor"} style={strokeStyle} />
    </svg>
  ),
  SketchArrow: ({ className = "w-24 h-12", color }: IconProps) => (
    <svg viewBox="0 0 100 50" className={className}>
      <path d="M10 25 Q 40 10, 80 25" stroke={color || "currentColor"} style={strokeStyle} strokeDasharray="5,5" />
      <path d="M70 15 L 85 25 L 70 35" stroke={color || "currentColor"} style={strokeStyle} />
    </svg>
  ),

  // Wizard Archetypes
  Explorer: ({ className = "w-8 h-8", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <circle cx="12" cy="12" r="10" />
      <path d="M16.2 7.8l-2 6.2-6.2 2 2-6.2z" />
    </svg>
  ),
  Inventor: ({ className = "w-8 h-8", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M9 3h6l3 7-3 6h-6l-3-6z" />
      <path d="M12 16v5" />
      <path d="M8 21h8" />
    </svg>
  ),
  Guardian: ({ className = "w-8 h-8", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Dreamer: ({ className = "w-8 h-8", color }: IconProps) => (
    <svg viewBox="0 0 24 24" className={className} stroke={color || "currentColor"} style={strokeStyle}>
      <path d="M12 2l3 6 6 1-5 4 2 6-6-4-6 4 2-6-5-4 6-1z" />
    </svg>
  ),
};
