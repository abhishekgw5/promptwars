import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const city = searchParams.get('city');

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Weather API key not configured' },
      { status: 500 }
    );
  }

  try {
    let resolvedLat = lat;
    let resolvedLon = lon;

    // Geocode city name if coordinates not provided
    if (city && (!lat || !lon)) {
      const geoRes = await serverFetch(
        `${GEO_BASE}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
      );
      if (!geoRes.ok) {
        return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
      }
      const geoData = await geoRes.json();
      if (!geoData.length) {
        return NextResponse.json(
          {
            error: 'City not found',
            suggestion:
              'Try a nearby major city or district headquarters (e.g. Akola, Aurangabad, Pune, Mumbai).',
          },
          { status: 404 }
        );
      }
      resolvedLat = String(geoData[0].lat);
      resolvedLon = String(geoData[0].lon);
    }

    if (!resolvedLat || !resolvedLon) {
      return NextResponse.json(
        { error: 'Location required — provide lat/lon or city name' },
        { status: 400 }
      );
    }

    // Fetch current weather + 5-day forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      serverFetch(
        `${OWM_BASE}/weather?lat=${resolvedLat}&lon=${resolvedLon}&units=metric&appid=${apiKey}`
      ),
      serverFetch(
        `${OWM_BASE}/forecast?lat=${resolvedLat}&lon=${resolvedLon}&units=metric&appid=${apiKey}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 502 }
      );
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const weatherData = {
      location: {
        city: current.name,
        country: current.sys?.country || '',
        lat: current.coord.lat,
        lon: current.coord.lon,
      },
      current: {
        temp: Math.round(current.main.temp),
        feels_like: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        wind_speed: current.wind.speed,
        description: current.weather[0]?.description || '',
        icon: current.weather[0]?.icon || '01d',
        rain_1h: current.rain?.['1h'] || 0,
        visibility: current.visibility || 10000,
        pressure: current.main.pressure,
      },
      forecast: aggregateForecast(forecast.list || []),
      alerts: deriveAlerts(current, forecast.list || []),
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ---- helpers ---- */

interface ForecastItem {
  dt: number;
  main: { temp_max: number; temp_min: number };
  weather: { description: string; icon: string }[];
  pop?: number;
  rain?: { '3h'?: number };
}

function aggregateForecast(list: ForecastItem[]) {
  const days = new Map<
    string,
    {
      date: string;
      temps_max: number[];
      temps_min: number[];
      descriptions: string[];
      icons: string[];
      pops: number[];
      rain: number;
    }
  >();

  for (const item of list) {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0];
    const entry = days.get(date) || {
      date,
      temps_max: [],
      temps_min: [],
      descriptions: [],
      icons: [],
      pops: [],
      rain: 0,
    };
    entry.temps_max.push(item.main.temp_max);
    entry.temps_min.push(item.main.temp_min);
    entry.descriptions.push(item.weather[0]?.description || '');
    entry.icons.push(item.weather[0]?.icon || '01d');
    entry.pops.push(item.pop || 0);
    entry.rain += item.rain?.['3h'] || 0;
    days.set(date, entry);
  }

  return Array.from(days.values())
    .slice(0, 5)
    .map((d) => ({
      date: d.date,
      temp_max: Math.round(Math.max(...d.temps_max)),
      temp_min: Math.round(Math.min(...d.temps_min)),
      description: mostFrequent(d.descriptions),
      icon: mostFrequent(d.icons),
      rain_probability: Math.round(Math.max(...d.pops) * 100),
      rain_amount: Math.round(d.rain * 10) / 10,
    }));
}

function mostFrequent(arr: string[]): string {
  const freq = new Map<string, number>();
  for (const v of arr) freq.set(v, (freq.get(v) || 0) + 1);
  let best = arr[0];
  let max = 0;
  for (const [k, c] of freq) {
    if (c > max) {
      max = c;
      best = k;
    }
  }
  return best;
}

function deriveAlerts(
  current: Record<string, any>,
  forecastList: ForecastItem[]
) {
  const alerts: { severity: string; title: string; description: string }[] = [];

  const rain1h: number = current.rain?.['1h'] || 0;
  const windSpeed: number = current.wind?.speed || 0;
  const visibility: number = current.visibility || 10000;

  if (rain1h > 30) {
    alerts.push({
      severity: 'extreme',
      title: 'Extreme Rainfall',
      description: `Rainfall at ${rain1h} mm/h — very high flood risk. Stay indoors and avoid low-lying areas.`,
    });
  } else if (rain1h > 15) {
    alerts.push({
      severity: 'high',
      title: 'Heavy Rainfall Warning',
      description: `Rainfall at ${rain1h} mm/h — monitor water levels and stay alert.`,
    });
  } else if (rain1h > 5) {
    alerts.push({
      severity: 'moderate',
      title: 'Moderate Rainfall',
      description: `Rainfall at ${rain1h} mm/h — carry rain gear and drive carefully.`,
    });
  }

  if (windSpeed > 20) {
    alerts.push({
      severity: 'high',
      title: 'High Wind Warning',
      description: `Wind speed ${windSpeed} m/s — secure loose objects and avoid open areas.`,
    });
  } else if (windSpeed > 12) {
    alerts.push({
      severity: 'moderate',
      title: 'Strong Winds',
      description: `Wind speed ${windSpeed} m/s — exercise caution outdoors.`,
    });
  }

  if (visibility < 1000) {
    alerts.push({
      severity: 'high',
      title: 'Very Low Visibility',
      description: `Visibility only ${visibility}m — avoid driving if possible.`,
    });
  } else if (visibility < 3000) {
    alerts.push({
      severity: 'moderate',
      title: 'Reduced Visibility',
      description: `Visibility ${visibility}m — drive with headlights on.`,
    });
  }

  // Forecast-based
  const next24h = forecastList.slice(0, 8);
  const maxForecastRain = next24h.reduce(
    (m, i) => Math.max(m, i.rain?.['3h'] || 0),
    0
  );
  const maxPop = next24h.reduce((m, i) => Math.max(m, i.pop || 0), 0);

  if (maxForecastRain > 50 && alerts.length === 0) {
    alerts.push({
      severity: 'high',
      title: 'Heavy Rain Expected',
      description: `Up to ${Math.round(maxForecastRain)} mm of rain forecast in the next 24 hours.`,
    });
  } else if (maxPop > 0.8 && alerts.length === 0) {
    alerts.push({
      severity: 'moderate',
      title: 'Rain Expected',
      description: `${Math.round(maxPop * 100)}% chance of rain in the next 24 hours. Plan accordingly.`,
    });
  }

  return alerts;
}
