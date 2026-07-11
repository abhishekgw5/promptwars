'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherData, Location, Language, ChecklistResult } from '@/lib/types';
import LanguageChangeBanner from './LanguageChangeBanner';

interface Props {
  weather: WeatherData;
  location: Location;
  language: Language;
}

const STORAGE_KEY = 'monsoonguard_checklist';

export default function EmergencyChecklist({ weather, location, language }: Props) {
  const [result, setResult] = useState<ChecklistResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [filterPhase, setFilterPhase] = useState<string>('all');

  // Load checked state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // Save checked state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checklist',
          weatherData: weather,
          location,
          language,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate checklist');
      }
      const data: ChecklistResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [weather, location, language]);

  const toggleItem = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalItems =
    result?.categories?.reduce((s, c) => s + (c.items?.length || 0), 0) || 0;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const filteredCategories =
    filterPhase === 'all'
      ? result?.categories
      : result?.categories?.filter((c) => c.phase === filterPhase);

  const severityColor: Record<string, string> = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    moderate: 'text-amber-600',
    low: 'text-green-600',
  };

  const phaseIcon: Record<string, string> = {
    before: '🔜',
    during: '⚡',
    after: '✅',
  };

  const priorityStyle: Record<string, string> = {
    essential: 'font-semibold text-gray-900',
    recommended: 'text-gray-700',
    optional: 'text-gray-500',
  };

  return (
    <div className="space-y-6">
      <LanguageChangeBanner language={language} hasContent={!!result} onRegenerate={generate} />
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Emergency Monsoon Checklist
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          AI generates a dynamic checklist based on current weather conditions in{' '}
          <strong>{location.city}</strong>. Your progress is saved locally.
        </p>
        <button onClick={generate} disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating…
            </span>
          ) : result ? (
            '🔄 Regenerate Checklist'
          ) : (
            '🤖 Generate Checklist'
          )}
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>
        )}
      </div>

      {result && (
        <>
          {/* Summary bar */}
          <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800">{result.title}</p>
              <p className="text-sm">
                Severity:{' '}
                <span
                  className={`font-bold uppercase ${severityColor[result.severity_level] || ''}`}
                >
                  {result.severity_level}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {checkedCount}/{totalItems} completed
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-monsoon-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalItems ? (checkedCount / totalItems) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Phase filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'before', 'during', 'after'].map((phase) => (
              <button
                key={phase}
                onClick={() => setFilterPhase(phase)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterPhase === phase
                    ? 'bg-monsoon-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {phase === 'all' ? '📋 All' : `${phaseIcon[phase] || ''} ${capitalize(phase)}`}
              </button>
            ))}
          </div>

          {/* Checklist categories */}
          {filteredCategories?.map((cat, ci) => (
            <div key={ci} className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>{phaseIcon[cat.phase] || '📋'}</span>
                <h4 className="font-semibold text-gray-800">{cat.category}</h4>
                <span className="badge bg-gray-100 text-gray-600 text-xs">
                  {cat.phase}
                </span>
              </div>
              <ul className="space-y-2">
                {cat.items?.map((item, ii) => {
                  const key = `${ci}-${ii}`;
                  return (
                    <li key={ii} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!checked[key]}
                        onChange={() => toggleItem(key)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-monsoon-600 focus:ring-monsoon-500 cursor-pointer flex-shrink-0"
                        aria-label={item.text}
                      />
                      <span
                        className={`${priorityStyle[item.priority] || ''} ${
                          checked[key] ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {item.text}
                      </span>
                      {item.priority === 'essential' && (
                        <span className="badge-high ml-auto flex-shrink-0">
                          essential
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
