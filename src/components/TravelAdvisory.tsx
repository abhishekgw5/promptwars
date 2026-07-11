'use client';

import { useState } from 'react';
import { WeatherData, Location, Language, TravelResult } from '@/lib/types';

interface Props {
  weather: WeatherData;
  location: Location;
  language: Language;
}

export default function TravelAdvisory({ weather, location, language }: Props) {
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [result, setResult] = useState<TravelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!destination.trim()) {
      setError('Please enter a destination');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'travel',
          weatherData: weather,
          location,
          language,
          userInput: {
            destination: destination.trim(),
            travelMode,
            travelDate: travelDate || 'Today',
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate advisory');
      }
      const data: TravelResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const riskConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    safe: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Safe to Travel' },
    caution: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⚠️', label: 'Travel with Caution' },
    warning: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🟠', label: 'Travel Not Recommended' },
    danger: { bg: 'bg-red-100', text: 'text-red-800', icon: '🚫', label: 'Do Not Travel' },
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monsoon Travel Advisory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Destination *
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Mumbai, Lonavala"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Mode of Travel
            </label>
            <select
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value)}
              className="select-field"
            >
              <option value="">Select…</option>
              <option value="car">Car / Taxi</option>
              <option value="two_wheeler">Two-wheeler</option>
              <option value="bus">Bus</option>
              <option value="train">Train</option>
              <option value="flight">Flight</option>
              <option value="walking">Walking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Travel Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary mt-4 w-full sm:w-auto">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing Route…
            </span>
          ) : (
            '🤖 Get Travel Advisory'
          )}
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Risk level banner */}
          {(() => {
            const cfg = riskConfig[result.risk_level] || riskConfig.caution;
            return (
              <div className={`card ${cfg.bg} border-0`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cfg.icon}</span>
                  <div>
                    <p className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-gray-700 mt-1">{result.summary}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Route conditions */}
          {result.route_conditions && (
            <div className="card">
              <h4 className="font-semibold text-gray-800 mb-2">🛣️ Route Conditions</h4>
              <p className="text-gray-700">{result.route_conditions}</p>
            </div>
          )}

          {/* Recommendations & Precautions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.recommendations?.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-3">📌 Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-monsoon-500 mt-0.5">▸</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.precautions?.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-3">🛡️ Safety Precautions</h4>
                <ul className="space-y-2">
                  {result.precautions.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-orange-500 mt-0.5">▸</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Alternatives & Emergency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.alternatives?.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-3">🔄 Alternatives</h4>
                <ul className="space-y-2">
                  {result.alternatives.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-cyan-500 mt-0.5">▸</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.emergency_contacts?.length > 0 && (
              <div className="card">
                <h4 className="font-semibold text-gray-800 mb-3">📞 Emergency Contacts</h4>
                <ul className="space-y-2">
                  {result.emergency_contacts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 mt-0.5">▸</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
