/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ProgressRing — a small, dependency-free circular progress indicator.
 *
 * Used for daily well-being goals (water, sleep, …) instead of a flat bar:
 * a ring reads as "close the loop", which is more motivating and compact.
 * Colors are passed in so the same ring works for any metric and reads
 * correctly in both light and dark themes (the track is a theme-neutral
 * translucent grey).
 */

import React from 'react';

interface ProgressRingProps {
  /** Current value (e.g. ml of water drunk). */
  value: number;
  /** Goal the ring fills toward (e.g. 2000 ml). */
  goal: number;
  /** Outer diameter in px. */
  size?: number;
  /** Stroke thickness in px. */
  stroke?: number;
  /** Progress arc color. */
  color?: string;
  /** Track (unfilled) color — translucent so it works on light & dark. */
  trackColor?: string;
  /** Center content (value, %, emoji, …). */
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  goal,
  size = 88,
  stroke = 8,
  color = '#3b82f6',
  trackColor = 'rgba(120,116,110,0.20)',
  children,
}: ProgressRingProps) {
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.max(0, Math.min(value / safeGoal, 1));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      style={{ position: 'relative', width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct * 100)}%`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ProgressRing;
