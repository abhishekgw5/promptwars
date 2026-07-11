import {
  aggregateForecast,
  mostFrequent,
  deriveAlerts,
  ForecastItem,
} from '@/lib/weather-utils';

describe('mostFrequent', () => {
  it('returns the most common string in an array', () => {
    expect(mostFrequent(['rain', 'rain', 'clear'])).toBe('rain');
  });

  it('handles single-element arrays', () => {
    expect(mostFrequent(['sunny'])).toBe('sunny');
  });

  it('returns first element for empty arrays', () => {
    expect(mostFrequent([])).toBe('');
  });

  it('handles ties by returning first encountered max', () => {
    const result = mostFrequent(['a', 'b', 'a', 'b']);
    expect(['a', 'b']).toContain(result);
  });
});

describe('aggregateForecast', () => {
  const mockList: ForecastItem[] = [
    {
      dt: 1720688400, // 2024-07-11 09:00
      main: { temp_max: 32, temp_min: 26 },
      weather: [{ description: 'light rain', icon: '10d' }],
      pop: 0.6,
      rain: { '3h': 2.5 },
    },
    {
      dt: 1720699200, // 2024-07-11 12:00
      main: { temp_max: 34, temp_min: 27 },
      weather: [{ description: 'moderate rain', icon: '10d' }],
      pop: 0.8,
      rain: { '3h': 5.0 },
    },
    {
      dt: 1720774800, // 2024-07-12 09:00
      main: { temp_max: 30, temp_min: 25 },
      weather: [{ description: 'overcast clouds', icon: '04d' }],
      pop: 0.3,
    },
  ];

  it('groups forecast items by date', () => {
    const result = aggregateForecast(mockList);
    expect(result.length).toBe(2);
  });

  it('computes correct max/min temperatures per day', () => {
    const result = aggregateForecast(mockList);
    expect(result[0].temp_max).toBe(34);
    expect(result[0].temp_min).toBe(26);
  });

  it('sums rainfall per day', () => {
    const result = aggregateForecast(mockList);
    expect(result[0].rain_amount).toBe(7.5);
  });

  it('uses maximum rain probability per day', () => {
    const result = aggregateForecast(mockList);
    expect(result[0].rain_probability).toBe(80);
  });

  it('limits output to 5 days', () => {
    const longList: ForecastItem[] = [];
    for (let i = 0; i < 40; i++) {
      longList.push({
        dt: 1720688400 + i * 10800, // every 3 hours
        main: { temp_max: 30, temp_min: 25 },
        weather: [{ description: 'rain', icon: '10d' }],
        pop: 0.5,
      });
    }
    const result = aggregateForecast(longList);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('handles empty input', () => {
    expect(aggregateForecast([])).toEqual([]);
  });
});

describe('deriveAlerts', () => {
  it('returns extreme alert for heavy rainfall (>30mm/h)', () => {
    const current = { rain: { '1h': 35 }, wind: { speed: 5 }, visibility: 5000 };
    const alerts = deriveAlerts(current, []);
    expect(alerts.some((a) => a.severity === 'extreme')).toBe(true);
    expect(alerts.some((a) => a.title.includes('Extreme'))).toBe(true);
  });

  it('returns high alert for rainfall 15-30mm/h', () => {
    const current = { rain: { '1h': 20 }, wind: { speed: 5 }, visibility: 5000 };
    const alerts = deriveAlerts(current, []);
    expect(alerts.some((a) => a.severity === 'high')).toBe(true);
  });

  it('returns moderate alert for rainfall 5-15mm/h', () => {
    const current = { rain: { '1h': 8 }, wind: { speed: 5 }, visibility: 5000 };
    const alerts = deriveAlerts(current, []);
    expect(alerts.some((a) => a.severity === 'moderate')).toBe(true);
  });

  it('returns wind warning for speeds >20 m/s', () => {
    const current = { wind: { speed: 25 }, visibility: 10000 };
    const alerts = deriveAlerts(current, []);
    expect(alerts.some((a) => a.title.includes('Wind'))).toBe(true);
  });

  it('returns visibility alert for <1000m', () => {
    const current = { wind: { speed: 3 }, visibility: 500 };
    const alerts = deriveAlerts(current, []);
    expect(alerts.some((a) => a.title.includes('Visibility'))).toBe(true);
  });

  it('returns no alerts for clear weather', () => {
    const current = { wind: { speed: 3 }, visibility: 10000, rain: { '1h': 0 } };
    const alerts = deriveAlerts(current, []);
    expect(alerts.length).toBe(0);
  });

  it('generates forecast-based alert when no immediate alerts exist', () => {
    const current = { wind: { speed: 3 }, visibility: 10000 };
    const forecast: ForecastItem[] = Array(8).fill({
      dt: Date.now() / 1000,
      main: { temp_max: 30, temp_min: 25 },
      weather: [{ description: 'rain', icon: '10d' }],
      pop: 0.9,
      rain: { '3h': 60 },
    });
    const alerts = deriveAlerts(current, forecast);
    expect(alerts.length).toBeGreaterThan(0);
  });
});
