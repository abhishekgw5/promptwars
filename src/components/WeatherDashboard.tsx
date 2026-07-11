'use client';

import { memo } from 'react';
import { WeatherData } from '@/lib/types';

interface Props {
  weather: WeatherData;
}

/** Memoized weather dashboard — only re-renders when weather data changes */
const WeatherDashboard = memo(function WeatherDashboard({ weather }: Props) {
  const { current, forecast } = weather;
  const severity = getMonsoonSeverity(weather);

  return (
    <div className="space-y-6">
      {/* Current conditions hero */}
      <div className="card bg-gradient-to-br from-monsoon-600 to-cyan-600 text-white border-0">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://openweathermap.org/img/wn/${current.icon}@4x.png`}
            alt={current.description}
            className="w-28 h-28 -my-4"
            width={112}
            height={112}
          />
          <div className="text-center sm:text-left flex-1">
            <p className="text-5xl font-bold">{current.temp}°C</p>
            <p className="text-lg capitalize opacity-90 mt-1">
              {current.description}
            </p>
            <p className="text-sm opacity-75">
              Feels like {current.feels_like}°C
            </p>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${severityBadge(severity)}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${severityDot(severity)} animate-pulse`}
              />
              {severity.toUpperCase()} RISK
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon="💧" label="Humidity" value={`${current.humidity}%`} />
        <MetricCard
          icon="💨"
          label="Wind"
          value={`${current.wind_speed} m/s`}
        />
        <MetricCard
          icon="🌧️"
          label="Rain (1h)"
          value={`${current.rain_1h} mm`}
        />
        <MetricCard
          icon="👁️"
          label="Visibility"
          value={`${(current.visibility / 1000).toFixed(1)} km`}
        />
      </div>

      {/* 5-day forecast */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          5-Day Forecast
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {forecast.map((day) => (
            <div
              key={day.date}
              className="card text-center py-4 px-3 space-y-1"
            >
              <p className="text-xs font-medium text-gray-500">
                {formatDate(day.date)}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
                className="w-12 h-12 mx-auto"
                width={48}
                height={48}
              />
              <p className="text-sm font-semibold">
                {day.temp_max}° / {day.temp_min}°
              </p>
              <p className="text-xs capitalize text-gray-500">
                {day.description}
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
                <span>🌧️</span>
                <span>{day.rain_probability}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ---- sub-components ---- */

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-3 py-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

/* ---- helpers ---- */

function getMonsoonSeverity(
  weather: WeatherData
): 'low' | 'moderate' | 'high' | 'critical' {
  let score = 0;
  const { current, forecast } = weather;

  if (current.rain_1h > 20) score += 3;
  else if (current.rain_1h > 5) score += 2;
  else if (current.rain_1h > 0) score += 1;

  if (current.humidity > 85) score += 2;
  else if (current.humidity > 70) score += 1;

  if (current.wind_speed > 15) score += 2;
  else if (current.wind_speed > 8) score += 1;

  const maxPop = Math.max(...forecast.map((f) => f.rain_probability));
  if (maxPop > 80) score += 2;
  else if (maxPop > 50) score += 1;

  if (score >= 7) return 'critical';
  if (score >= 5) return 'high';
  if (score >= 3) return 'moderate';
  return 'low';
}

function severityBadge(s: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-900/30 text-red-100',
    high: 'bg-orange-900/30 text-orange-100',
    moderate: 'bg-amber-900/30 text-amber-100',
    low: 'bg-green-900/30 text-green-100',
  };
  return map[s] || map.low;
}

function severityDot(s: string) {
  const map: Record<string, string> = {
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    moderate: 'bg-amber-400',
    low: 'bg-green-400',
  };
  return map[s] || map.low;
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default WeatherDashboard;
