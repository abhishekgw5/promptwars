'use client';

import { memo } from 'react';
import { WeatherAlert } from '@/lib/types';

interface Props {
  alerts: WeatherAlert[];
}

const severityConfig: Record<
  string,
  { bg: string; border: string; text: string; icon: string }
> = {
  extreme: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    icon: '🚨',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-800',
    icon: '⚠️',
  },
  moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    icon: '⚡',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    icon: 'ℹ️',
  },
};

/** Memoized alert banner — only re-renders when alerts change */
const AlertBanner = memo(function AlertBanner({ alerts }: Props) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2 max-w-7xl mx-auto px-4 pt-4" role="alert">
      {alerts.map((alert, i) => {
        const cfg = severityConfig[alert.severity] || severityConfig.low;
        return (
          <div
            key={i}
            className={`${cfg.bg} ${cfg.border} ${cfg.text} border rounded-xl px-4 py-3 flex items-start gap-3`}
          >
            <span className="text-xl flex-shrink-0" aria-hidden="true">
              {cfg.icon}
            </span>
            <div>
              <p className="font-semibold">{alert.title}</p>
              <p className="text-sm opacity-90">{alert.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default AlertBanner;
