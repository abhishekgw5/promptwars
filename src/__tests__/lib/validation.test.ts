import {
  sanitizeCity,
  isValidLatitude,
  isValidLongitude,
  parseCoordinates,
  isValidApiKey,
  sanitizeUserInput,
  isValidAIType,
} from '@/lib/validation';

describe('sanitizeCity', () => {
  it('trims whitespace', () => {
    expect(sanitizeCity('  Mumbai  ')).toBe('Mumbai');
  });

  it('removes potentially dangerous characters', () => {
    expect(sanitizeCity('Pune<script>')).toBe('Punescript');
  });

  it('preserves Unicode characters (Hindi, Marathi, etc.)', () => {
    expect(sanitizeCity('पुणे')).toBe('पुणे');
  });

  it('truncates long input', () => {
    const longInput = 'A'.repeat(200);
    expect(sanitizeCity(longInput).length).toBeLessThanOrEqual(100);
  });

  it('removes SQL injection characters', () => {
    expect(sanitizeCity("'; DROP TABLE--")).toBe(' DROP TABLE--');
  });

  it('handles empty string', () => {
    expect(sanitizeCity('')).toBe('');
  });
});

describe('isValidLatitude', () => {
  it('accepts valid latitudes', () => {
    expect(isValidLatitude(18.52)).toBe(true);
    expect(isValidLatitude(-33.87)).toBe(true);
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
  });

  it('rejects out-of-range latitudes', () => {
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLatitude(-91)).toBe(false);
  });

  it('rejects non-finite values', () => {
    expect(isValidLatitude(NaN)).toBe(false);
    expect(isValidLatitude(Infinity)).toBe(false);
  });
});

describe('isValidLongitude', () => {
  it('accepts valid longitudes', () => {
    expect(isValidLongitude(73.85)).toBe(true);
    expect(isValidLongitude(-122.42)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
  });

  it('rejects out-of-range longitudes', () => {
    expect(isValidLongitude(181)).toBe(false);
    expect(isValidLongitude(-181)).toBe(false);
  });
});

describe('parseCoordinates', () => {
  it('parses valid coordinate strings', () => {
    const result = parseCoordinates('18.52', '73.85');
    expect(result).toEqual({ lat: 18.52, lon: 73.85 });
  });

  it('returns null for missing values', () => {
    expect(parseCoordinates(null, '73.85')).toBeNull();
    expect(parseCoordinates('18.52', null)).toBeNull();
    expect(parseCoordinates(null, null)).toBeNull();
  });

  it('returns null for invalid numeric strings', () => {
    expect(parseCoordinates('abc', '73.85')).toBeNull();
    expect(parseCoordinates('18.52', 'xyz')).toBeNull();
  });

  it('returns null for out-of-range coordinates', () => {
    expect(parseCoordinates('100', '73.85')).toBeNull();
    expect(parseCoordinates('18.52', '200')).toBeNull();
  });
});

describe('isValidApiKey', () => {
  it('accepts valid API keys', () => {
    expect(isValidApiKey('gsk_abc123def456')).toBe(true);
    expect(isValidApiKey('a'.repeat(50))).toBe(true);
  });

  it('rejects undefined', () => {
    expect(isValidApiKey(undefined)).toBe(false);
  });

  it('rejects too-short keys', () => {
    expect(isValidApiKey('short')).toBe(false);
  });

  it('rejects too-long keys', () => {
    expect(isValidApiKey('a'.repeat(201))).toBe(false);
  });
});

describe('sanitizeUserInput', () => {
  it('trims and limits length', () => {
    const result = sanitizeUserInput('  hello world  ', 10);
    expect(result).toBe('hello worl');
  });

  it('removes control characters', () => {
    expect(sanitizeUserInput('test\x00\x01\x02')).toBe('test');
  });

  it('removes angle brackets', () => {
    expect(sanitizeUserInput('<script>alert("xss")</script>')).toBe(
      'script alert("xss") /script'
    );
  });

  it('preserves normal text', () => {
    expect(sanitizeUserInput('3-4 people, ground floor')).toBe(
      '3-4 people, ground floor'
    );
  });
});

describe('isValidAIType', () => {
  it('accepts valid types', () => {
    expect(isValidAIType('preparedness')).toBe(true);
    expect(isValidAIType('checklist')).toBe(true);
    expect(isValidAIType('travel')).toBe(true);
    expect(isValidAIType('safety')).toBe(true);
  });

  it('rejects invalid types', () => {
    expect(isValidAIType('hack')).toBe(false);
    expect(isValidAIType('')).toBe(false);
    expect(isValidAIType('PREPAREDNESS')).toBe(false);
  });
});
