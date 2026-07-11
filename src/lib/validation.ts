/**
 * Input validation and sanitization utilities.
 * Provides centralized validation for user inputs to prevent
 * injection attacks and ensure data integrity.
 */

/** Maximum allowed city name length */
const MAX_CITY_LENGTH = 100;

/** Valid latitude range */
const LAT_RANGE = { min: -90, max: 90 } as const;

/** Valid longitude range */
const LON_RANGE = { min: -180, max: 180 } as const;

/**
 * Sanitizes a city name by trimming whitespace and removing
 * potentially dangerous characters while preserving Unicode letters.
 */
export function sanitizeCity(input: string): string {
  return input
    .trim()
    .slice(0, MAX_CITY_LENGTH)
    .replace(/[<>"'`;\\{}]/g, '');
}

/**
 * Validates latitude value is within valid range.
 */
export function isValidLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= LAT_RANGE.min && lat <= LAT_RANGE.max;
}

/**
 * Validates longitude value is within valid range.
 */
export function isValidLongitude(lon: number): boolean {
  return Number.isFinite(lon) && lon >= LON_RANGE.min && lon <= LON_RANGE.max;
}

/**
 * Validates and parses coordinate strings from query parameters.
 * Returns null if coordinates are invalid.
 */
export function parseCoordinates(
  lat: string | null,
  lon: string | null
): { lat: number; lon: number } | null {
  if (!lat || !lon) return null;
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (!isValidLatitude(parsedLat) || !isValidLongitude(parsedLon)) return null;
  return { lat: parsedLat, lon: parsedLon };
}

/**
 * Validates that an API key has the expected format.
 * Does not verify the key is active — only structural check.
 */
export function isValidApiKey(key: string | undefined): key is string {
  return typeof key === 'string' && key.length >= 10 && key.length <= 200;
}

/**
 * Sanitizes free-text user input for AI prompts.
 * Removes control characters and limits length.
 */
export function sanitizeUserInput(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control chars
    .replace(/[<>]/g, ''); // Remove angle brackets
}

/**
 * Validates the AI request type against the allowed values.
 */
export function isValidAIType(type: string): boolean {
  const validTypes = ['preparedness', 'checklist', 'travel', 'safety'];
  return validTypes.includes(type);
}
