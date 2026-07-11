export interface Location {
  lat: number;
  lon: number;
  city: string;
  country?: string;
}

export interface WeatherData {
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    rain_1h: number;
    visibility: number;
    pressure: number;
  };
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
}

export interface ForecastDay {
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

export type Language = 'en' | 'hi' | 'mr' | 'te' | 'ta' | 'kn' | 'bn';

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  bn: 'বাংলা',
};

export interface PreparednessResult {
  title: string;
  summary: string;
  sections: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    items: string[];
  }[];
}

export interface ChecklistResult {
  title: string;
  severity_level: 'low' | 'moderate' | 'high' | 'critical';
  categories: {
    category: string;
    phase: 'before' | 'during' | 'after';
    items: {
      text: string;
      priority: 'essential' | 'recommended' | 'optional';
    }[];
  }[];
}

export interface TravelResult {
  risk_level: 'safe' | 'caution' | 'warning' | 'danger';
  summary: string;
  route_conditions: string;
  recommendations: string[];
  precautions: string[];
  alternatives: string[];
  emergency_contacts: string[];
}

export interface SafetyResult {
  title: string;
  overall_risk: 'low' | 'moderate' | 'high' | 'critical';
  categories: {
    category: string;
    icon: string;
    tips: string[];
  }[];
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'preparedness', label: 'Preparedness', icon: '📋' },
  { id: 'checklist', label: 'Checklist', icon: '✅' },
  { id: 'travel', label: 'Travel', icon: '🚗' },
  { id: 'safety', label: 'Safety', icon: '🛡️' },
] as const;
