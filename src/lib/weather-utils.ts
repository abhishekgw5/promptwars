/**
 * Weather data processing utilities.
 * Extracted from the API route for testability and reuse.
 */

export interface ForecastItem {
  dt: number;
  main: { temp_max: number; temp_min: number };
  weather: { description: string; icon: string }[];
  pop?: number;
  rain?: { '3h'?: number };
}

export interface ProcessedForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
  rain_probability: number;
  rain_amount: number;
}

export interface WeatherAlert {
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  description: string;
}

/**
 * Aggregates 3-hourly forecast data into daily summaries.
 * Groups data by date, picks the most frequent weather description,
 * and computes min/max temps, max rain probability, and total rainfall.
 */
export function aggregateForecast(list: ForecastItem[]): ProcessedForecastDay[] {
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

/**
 * Returns the most frequently occurring string in an array.
 * Used to determine the predominant weather condition for a day.
 */
export function mostFrequent(arr: string[]): string {
  if (!arr.length) return '';
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

/** Typed shape of the OWM current weather object used by deriveAlerts */
interface CurrentWeather {
  rain?: { '1h'?: number };
  wind?: { speed?: number };
  visibility?: number;
}

/**
 * Derives weather alerts from current conditions and forecast data.
 * Evaluates rainfall intensity, wind speed, visibility, and upcoming forecast
 * to produce actionable warnings with severity levels.
 */
export function deriveAlerts(
  current: CurrentWeather,
  forecastList: ForecastItem[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  const rain1h: number = current.rain?.['1h'] ?? 0;
  const windSpeed: number = current.wind?.speed ?? 0;
  const visibility: number = current.visibility ?? 10000;

  // Rainfall alerts
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

  // Wind alerts
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

  // Visibility alerts
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

  // Forecast-based alerts (only if no immediate alerts)
  const next24h = forecastList.slice(0, 8);
  if (next24h.length > 0) {
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
  }

  return alerts;
}
