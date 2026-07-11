'use client';

import { useState } from 'react';
import { WeatherData, Location, Language, PreparednessResult } from '@/lib/types';
import LanguageChangeBanner from './LanguageChangeBanner';

interface Props {
  weather: WeatherData;
  location: Location;
  language: Language;
}

export default function PreparednessPlanner({ weather, location, language }: Props) {
  const [familySize, setFamilySize] = useState('');
  const [housingType, setHousingType] = useState('');
  const [areaType, setAreaType] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [result, setResult] = useState<PreparednessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'preparedness',
          weatherData: weather,
          location,
          language,
          userInput: { familySize, housingType, areaType, floorLevel, specialNeeds },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate plan');
      }
      const data: PreparednessResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const priorityBadge: Record<string, string> = {
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };

  return (
    <div className="space-y-6">
      <LanguageChangeBanner language={language} hasContent={!!result} onRegenerate={generate} />
      {/* Input form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tell us about your household
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Family Size
            </label>
            <select
              value={familySize}
              onChange={(e) => setFamilySize(e.target.value)}
              className="select-field"
            >
              <option value="">Select…</option>
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="3-4">3–4 people</option>
              <option value="5-6">5–6 people</option>
              <option value="7+">7+ people</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Housing Type
            </label>
            <select
              value={housingType}
              onChange={(e) => setHousingType(e.target.value)}
              className="select-field"
            >
              <option value="">Select…</option>
              <option value="apartment">Apartment/Flat</option>
              <option value="independent_house">Independent House</option>
              <option value="bungalow">Bungalow</option>
              <option value="slum">Slum/Informal Housing</option>
              <option value="chawl">Chawl</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Area Type
            </label>
            <select
              value={areaType}
              onChange={(e) => setAreaType(e.target.value)}
              className="select-field"
            >
              <option value="">Select…</option>
              <option value="flood_prone">Flood-prone / Low-lying</option>
              <option value="hillside">Hillside / Landslide risk</option>
              <option value="coastal">Coastal</option>
              <option value="urban">Urban</option>
              <option value="semi_urban">Semi-urban</option>
              <option value="rural">Rural</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Floor Level
            </label>
            <select
              value={floorLevel}
              onChange={(e) => setFloorLevel(e.target.value)}
              className="select-field"
            >
              <option value="">Select…</option>
              <option value="ground">Ground floor</option>
              <option value="1-2">1st–2nd floor</option>
              <option value="3-5">3rd–5th floor</option>
              <option value="6+">6th floor and above</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Special Needs (elderly, infants, pets, medical conditions…)
            </label>
            <input
              type="text"
              value={specialNeeds}
              onChange={(e) => setSpecialNeeds(e.target.value)}
              placeholder="e.g. elderly parent, infant, pet dog, diabetes"
              className="input-field"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="btn-primary mt-4 w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Plan…
            </span>
          ) : (
            '🤖 Generate Preparedness Plan'
          )}
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="card bg-monsoon-50 border-monsoon-200">
            <h3 className="text-xl font-bold text-monsoon-900">
              {result.title}
            </h3>
            <p className="text-gray-600 mt-1">{result.summary}</p>
          </div>
          {result.sections?.map((section, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800">
                  {section.title}
                </h4>
                <span className={priorityBadge[section.priority] || 'badge-low'}>
                  {section.priority}
                </span>
              </div>
              <ul className="space-y-2">
                {section.items?.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-gray-700">
                    <span className="text-monsoon-500 mt-0.5 flex-shrink-0">
                      ▸
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
