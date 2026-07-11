'use client';

import { useState, useCallback } from 'react';
import { WeatherData, Location, Language, SafetyResult } from '@/lib/types';

interface Props {
  weather: WeatherData;
  location: Location;
  language: Language;
}

export default function SafetyTips({ weather, location, language }: Props) {
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'safety',
          weatherData: weather,
          location,
          language,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate safety tips');
      }
      const data: SafetyResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [weather, location, language]);

  const riskStyle: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-100', text: 'text-red-800' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800' },
    moderate: { bg: 'bg-amber-100', text: 'text-amber-800' },
    low: { bg: 'bg-green-100', text: 'text-green-800' },
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          AI Safety Recommendations
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Get personalized monsoon safety tips based on real-time weather in{' '}
          <strong>{location.city}</strong>.
        </p>
        <button onClick={generate} disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing Conditions…
            </span>
          ) : result ? (
            '🔄 Refresh Recommendations'
          ) : (
            '🤖 Get Safety Tips'
          )}
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>
        )}
      </div>

      {result && (
        <>
          {/* Overall risk */}
          <div
            className={`card border-0 ${riskStyle[result.overall_risk]?.bg || 'bg-gray-100'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <p className="text-lg font-bold text-gray-900">{result.title}</p>
                <p className="text-sm">
                  Overall Risk:{' '}
                  <span
                    className={`font-bold uppercase ${riskStyle[result.overall_risk]?.text || ''}`}
                  >
                    {result.overall_risk}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Categories grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.categories?.map((cat, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <h4 className="font-semibold text-gray-800">{cat.category}</h4>
                </div>
                <ul className="space-y-2">
                  {cat.tips?.map((tip, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-gray-700 text-sm"
                    >
                      <span className="text-monsoon-500 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
