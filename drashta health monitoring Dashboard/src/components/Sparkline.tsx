import React from 'react';

interface SparklineProps {
  points: number[];
  color?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  points, 
  color = '#10B981', 
  className = 'h-10 w-full' 
}) => {
  if (!points || points.length < 2) {
    return (
      <div className={`flex items-center justify-center text-[10px] text-slate-600 font-mono ${className}`}>
        Gathering historical telemetry points...
      </div>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100;
  const height = 30;

  const pathD = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`overflow-visible ${className}`} preserveAspectRatio="none">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />
    </svg>
  );
};
