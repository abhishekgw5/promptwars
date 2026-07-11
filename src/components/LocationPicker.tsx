'use client';

import { useState, useCallback, useEffect } from 'react';
import { Location } from '@/lib/types';

interface Props {
  location: Location | null;
  onLocationChange: (loc: Location) => void;
}

export default function LocationPicker({ location, onLocationChange }: Props) {
  const [city, setCity] = useState(location?.city || '');
  const [detecting, setDetecting] = useState(false);

  // Keep input in sync with resolved city name (e.g. after geolocation resolves)
  useEffect(() => {
    if (location?.city) setCity(location.city);
  }, [location?.city]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = city.trim();
      if (!trimmed) return;
      onLocationChange({ lat: 0, lon: 0, city: trimmed });
    },
    [city, onLocationChange]
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    setCity(''); // clear stale city text immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          city: '',
        });
        setDetecting(false);
      },
      () => {
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  }, [onLocationChange]);

  return (
    <section aria-label="Location selection">
      <form onSubmit={handleSearch} className="flex gap-2 items-stretch">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            📍
          </span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name (e.g. Pune, Mumbai)"
            className="input-field pl-10"
            aria-label="City name"
          />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">
          Search
        </button>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={detecting}
          className="btn-secondary whitespace-nowrap flex items-center gap-1.5"
          aria-label="Detect my location"
        >
          {detecting ? (
            <span className="inline-block w-4 h-4 border-2 border-monsoon-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>📡</span>
          )}
          <span className="hidden sm:inline">
            {detecting ? 'Detecting…' : 'My Location'}
          </span>
        </button>
      </form>

      {location?.city && location.city !== '' && (
        <p className="mt-2 text-sm text-gray-500">
          Showing data for{' '}
          <span className="font-semibold text-monsoon-700">
            {location.city}
            {location.country ? `, ${location.country}` : ''}
          </span>
        </p>
      )}
    </section>
  );
}
