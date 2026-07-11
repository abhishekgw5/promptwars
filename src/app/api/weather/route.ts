import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';
import { aggregateForecast, deriveAlerts } from '@/lib/weather-utils';
import { sanitizeCity, parseCoordinates, isValidApiKey } from '@/lib/validation';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

/** Cache weather responses for 5 minutes to reduce API calls */
const CACHE_MAX_AGE = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawLat = searchParams.get('lat');
  const rawLon = searchParams.get('lon');
  const rawCity = searchParams.get('city');

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!isValidApiKey(apiKey)) {
    return NextResponse.json(
      { error: 'Weather API key not configured' },
      { status: 500 }
    );
  }

  try {
    let resolvedLat: string | null = rawLat;
    let resolvedLon: string | null = rawLon;

    // Geocode city name if coordinates not provided
    if (rawCity && (!rawLat || !rawLon)) {
      const city = sanitizeCity(rawCity);
      if (!city) {
        return NextResponse.json({ error: 'Invalid city name' }, { status: 400 });
      }

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

    // Validate coordinates
    const coords = parseCoordinates(resolvedLat, resolvedLon);
    if (!coords) {
      return NextResponse.json(
        { error: 'Valid location required — provide lat/lon or city name' },
        { status: 400 }
      );
    }

    // Fetch current weather + 5-day forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      serverFetch(
        `${OWM_BASE}/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
      ),
      serverFetch(
        `${OWM_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data from provider' },
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

    // Return with cache headers for efficiency
    return NextResponse.json(weatherData, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_MAX_AGE * 2}`,
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
