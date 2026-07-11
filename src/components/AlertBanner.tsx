'use client';

import { memo } from 'react';
import { WeatherAlert } from '@/lib/types';

interface Props {
  alerts: WeatherAlert[];
}

const severityConfig: Record<
  string,
  { bg: string; leftBar: string; text: string; subText: string; icon: string; label: string }
> = {
  extreme: {
    bg: 'bg-red-50/90 backdrop-blur-sm border border-red-200',
    leftBar: 'bg-red-500',
    text: 'text-red-900',
    subText: 'text-red-700',
    icon: '🚨',
    label: 'EXTREME',
  },
  high: {
    bg: 'bg-orange-50/90 backdrop-blur-sm border border-orange-200',
    leftBar: 'bg-orange-500',
    text: 'text-orange-900',
    subText: 'text-orange-700',
    icon: '⚠️',
    label: 'HIGH',
  },
  moderate: {
    bg: 'bg-amber-50/90 backdrop-blur-sm border border-amber-200',
    leftBar: 'bg-amber-500',
    text: 'text-amber-900',
    subText: 'text-amber-700',
    icon: '⚡',
    label: 'MODERATE',
  },
  low: {
    bg: 'bg-blue-50/90 backdrop-blur-sm border border-blue-200',
    leftBar: 'bg-blue-400',
    text: 'text-blue-900',
    subText: 'text-blue-700',
    icon: 'ℹ️',
    label: 'INFO',
  },
};

/** Memoized alert banner — only re-renders when alerts change */
const AlertBanner = memo(function AlertBanner({ alerts }: Props) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2 max-w-7xl mx-auto px-4 pt-4 stagger" role="alert" aria-live="polite">
      {alerts.map((alert, i) => {
        const cfg = severityConfig[alert.severity] || severityConfig.low;
        return (
          <div
            key={i}
            className={`${cfg.bg} rounded-xl overflow-hidden flex items-stretch shadow-sm`}
          >
            {/* Coloured left accent bar */}
            <div className={`w-1.5 flex-shrink-0 ${cfg.leftBar}`} />
            <div className="flex items-start gap-3 px-4 py-3 flex-1">
              <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                {cfg.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold ${cfg.text}`}>{alert.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.leftBar} text-white`}>
                    {cfg.label}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 ${cfg.subText}`}>{alert.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default AlertBanner;
