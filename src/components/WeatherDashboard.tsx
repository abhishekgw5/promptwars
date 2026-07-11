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
  const severityGrad = {
    low: 'from-blue-600 via-monsoon-600 to-cyan-600',
    moderate: 'from-blue-700 via-monsoon-700 to-teal-600',
    high: 'from-orange-600 via-red-600 to-rose-600',
    critical: 'from-red-700 via-rose-700 to-red-900',
  }[severity];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Hero card ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${severityGrad} text-white shadow-xl`}>
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Weather icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-150" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://openweathermap.org/img/wn/${current.icon}@4x.png`}
                alt={current.description}
                className="relative w-32 h-32 drop-shadow-2xl animate-float"
                width={128} height={128}
              />
            </div>

            {/* Temperature & description */}
            <div className="text-center sm:text-left flex-1">
              <p className="text-7xl font-black tracking-tight leading-none">
                {current.temp}<span className="text-4xl font-light opacity-80">°C</span>
              </p>
              <p className="text-xl capitalize font-medium mt-2 opacity-95">
                {current.description}
              </p>
              <p className="text-sm opacity-70 mt-1">
                Feels like {current.feels_like}°C · Pressure {current.pressure} hPa
              </p>
            </div>

            {/* Risk badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${severityPulse(severity)} opacity-40 animate-ping`} />
                <div className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm ${severityBadgeBg(severity)}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${severityDot(severity)}`} />
                  {severity.toUpperCase()} RISK
                </div>
              </div>
              <p className="text-xs opacity-60 text-center">Monsoon severity</p>
            </div>
          </div>

          {/* Mini metrics row inside hero */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
            {[
              { icon: '💧', label: 'Humidity', val: `${current.humidity}%` },
              { icon: '💨', label: 'Wind',     val: `${current.wind_speed} m/s` },
              { icon: '🌧️', label: 'Rain/h',  val: `${current.rain_1h} mm` },
              { icon: '👁️', label: 'Visibility', val: `${(current.visibility / 1000).toFixed(1)} km` },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-xl">{m.icon}</p>
                <p className="text-base font-bold">{m.val}</p>
                <p className="text-xs opacity-60">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5-day forecast ── */}
      <div>
        <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          5-Day Forecast
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 stagger">
          {forecast.map((day) => {
            const pop = day.rain_probability;
            const barColor = pop > 70 ? 'bg-blue-500' : pop > 40 ? 'bg-blue-400' : 'bg-blue-200';
            return (
              <div key={day.date} className="card text-center py-5 px-3 space-y-2 hover:scale-105 transition-transform duration-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {formatDate(day.date)}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                  alt={day.description}
                  className="w-12 h-12 mx-auto"
                  width={48} height={48}
                />
                <p className="text-sm font-bold text-gray-800">
                  {day.temp_max}° <span className="text-gray-400 font-normal">/ {day.temp_min}°</span>
                </p>
                <p className="text-xs capitalize text-gray-400 leading-tight">
                  {day.description}
                </p>
                {/* Rain probability bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-blue-500 font-semibold">
                    🌧️ {pop}%
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pop}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ── helpers ── */

function getMonsoonSeverity(weather: WeatherData): 'low' | 'moderate' | 'high' | 'critical' {
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

function severityBadgeBg(s: string) {
  return { critical: 'bg-red-950/50', high: 'bg-orange-950/40', moderate: 'bg-amber-950/40', low: 'bg-green-950/40' }[s] || 'bg-green-950/40';
}
function severityPulse(s: string) {
  return { critical: 'bg-red-400', high: 'bg-orange-400', moderate: 'bg-amber-400', low: 'bg-green-400' }[s] || 'bg-green-400';
}
function severityDot(s: string) {
  return { critical: 'bg-red-300', high: 'bg-orange-300', moderate: 'bg-amber-300', low: 'bg-green-300' }[s] || 'bg-green-300';
}
function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default WeatherDashboard;
