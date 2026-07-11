'use client';

import { useState, useEffect, useCallback } from 'react';
import { Location, WeatherData, Language, TABS } from '@/lib/types';
import Header from '@/components/Header';
import AlertBanner from '@/components/AlertBanner';
import LocationPicker from '@/components/LocationPicker';
import WeatherDashboard from '@/components/WeatherDashboard';
import PreparednessPlanner from '@/components/PreparednessPlanner';
import EmergencyChecklist from '@/components/EmergencyChecklist';
import TravelAdvisory from '@/components/TravelAdvisory';
import SafetyTips from '@/components/SafetyTips';

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'not_found' | 'server' | null>(null);

  /* ---- auto-detect location on first load ---- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            city: '',
          }),
        () => {
          // Fallback to Pune (hackathon city)
          setLocation({ lat: 18.5204, lon: 73.8567, city: 'Pune' });
        },
        { timeout: 8000 }
      );
    } else {
      setLocation({ lat: 18.5204, lon: 73.8567, city: 'Pune' });
    }
  }, []);

  /* ---- fetch weather when location changes ---- */
  const fetchWeather = useCallback(async (loc: Location) => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    // Use a local variable — React state setters are async, reading errorKind
    // state after setErrorKind() would still see the previous value.
    let kind: 'not_found' | 'server' = 'server';
    try {
      const params = new URLSearchParams();
      if (loc.city) {
        params.set('city', loc.city);
      } else {
        params.set('lat', String(loc.lat));
        params.set('lon', String(loc.lon));
      }

      const res = await fetch(`/api/weather?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Weather fetch failed' }));
        if (res.status === 404) {
          kind = 'not_found';
          throw new Error(
            err.suggestion || 'Try a nearby major city or district headquarters.'
          );
        }
        throw new Error(err.error || 'Failed to fetch weather');
      }
      const data: WeatherData = await res.json();
      // Preserve the user's searched city name (OWM often returns a micro-neighbourhood
      // like "Chinchpokli" when the user searched "Mumbai"). Only use OWM's city name
      // when the search was by coordinates (geolocation), i.e. loc.city was empty.
      if (loc.city) {
        data.location.city = loc.city;
      }
      setWeather(data);
      // Sync location with resolved city (display only — does not re-trigger a fetch
      // because the useEffect guard below skips if weather already covers this location)
      setLocation((prev) =>
        prev
          ? {
              ...prev,
              city: loc.city || data.location.city,
              country: data.location.country,
              lat: data.location.lat,
              lon: data.location.lon,
            }
          : prev
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setErrorKind(kind);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    // Skip re-fetch if the weather data already covers this exact location
    // (happens when city name is resolved from lat/lon inside fetchWeather)
    if (
      weather &&
      location.city &&
      location.city === weather.location.city &&
      Math.abs(location.lat - weather.location.lat) < 0.01 &&
      Math.abs(location.lon - weather.location.lon) < 0.01
    ) return;
    fetchWeather(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.city, location?.lat, location?.lon]);

  const handleLocationChange = useCallback((loc: Location) => {
    setLocation(loc);
    setWeather(null);
    setError(null);
    setErrorKind(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />

      {weather?.alerts && weather.alerts.length > 0 && (
        <AlertBanner alerts={weather.alerts} />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Location picker */}
        <LocationPicker
          location={location}
          onLocationChange={handleLocationChange}
        />

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4" aria-label="Loading weather data">
            <div className="skeleton h-40 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && errorKind === 'not_found' && (
          <div className="card bg-amber-50 border border-amber-200 text-amber-900" role="alert">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-semibold">City not found in weather database</p>
                <p className="text-sm mt-1">{error}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Pune', 'Mumbai', 'Aurangabad', 'Nagpur', 'Nashik', 'Kolhapur'].map((city) => (
                    <button
                      key={city}
                      onClick={() => handleLocationChange({ lat: 0, lon: 0, city })}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm rounded-lg border border-amber-300 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {error && !loading && errorKind === 'server' && (
          <div className="card bg-red-50 border-red-200 text-red-800" role="alert">
            <p className="font-semibold">Unable to load weather data</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => location && fetchWeather(location)}
              className="btn-primary mt-3 bg-red-600 hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main content */}
        {weather && !loading && (
          <>
            {/* Tab navigation */}
            <nav
              className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
              role="tablist"
              aria-label="Feature sections"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-monsoon-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Tab content */}
            <section aria-label={`${activeTab} content`}>
              {activeTab === 'dashboard' && (
                <WeatherDashboard weather={weather} />
              )}
              {activeTab === 'preparedness' && (
                <PreparednessPlanner
                  weather={weather}
                  location={location!}
                  language={language}
                />
              )}
              {activeTab === 'checklist' && (
                <EmergencyChecklist
                  weather={weather}
                  location={location!}
                  language={language}
                />
              )}
              {activeTab === 'travel' && (
                <TravelAdvisory
                  weather={weather}
                  location={location!}
                  language={language}
                />
              )}
              {activeTab === 'safety' && (
                <SafetyTips
                  weather={weather}
                  location={location!}
                  language={language}
                />
              )}
            </section>
          </>
        )}

        {/* Empty state */}
        {!weather && !loading && !error && (
          <div className="card text-center py-16">
            <span className="text-6xl block mb-4">🌧️</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to MonsoonGuard
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              AI-powered monsoon preparedness at your fingertips. Enter your city
              or allow location access to get started with real-time weather
              insights and personalized safety guidance.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          MonsoonGuard — Built for PromptWars: Pune Hackathon •
          Powered by Groq AI &amp; OpenWeatherMap
        </div>
      </footer>
    </div>
  );
}
