import { NextRequest, NextResponse } from 'next/server';
import { serverFetch } from '@/lib/server-fetch';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Ordered fallback list — try each model until one works
const MODEL_FALLBACKS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

async function callGroq(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<Response> {
  return serverFetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });
}

export async function GET() {
  // Health check endpoint — useful for diagnosing deployment issues
  const hasKey = !!process.env.GROQ_API_KEY;
  const model = process.env.AI_MODEL || MODEL_FALLBACKS[0];
  return NextResponse.json({ status: 'ok', hasKey, model });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI API key not configured. Set GROQ_API_KEY in Vercel environment variables.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { type, weatherData, location, language = 'en', userInput = {} } = body;

    if (!type || !weatherData || !location) {
      return NextResponse.json({ error: 'Missing required fields: type, weatherData, location' }, { status: 400 });
    }

    const validTypes = ['preparedness', 'checklist', 'travel', 'safety'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(type, language);
    const userPrompt = buildUserPrompt(type, weatherData, location, userInput);

    // Try the configured model first, then fallbacks
    const configuredModel = process.env.AI_MODEL;
    const modelsToTry = configuredModel
      ? [configuredModel, ...MODEL_FALLBACKS.filter((m) => m !== configuredModel)]
      : MODEL_FALLBACKS;

    let response: Response | null = null;
    let lastError = '';

    for (const model of modelsToTry) {
      response = await callGroq(apiKey, model, systemPrompt, userPrompt);
      if (response.ok) break;

      const errText = await response.text();
      console.error(`Groq model "${model}" failed (${response.status}):`, errText);
      lastError = errText;

      // Only retry on model-not-found (404); stop on auth/rate/other errors
      if (response.status !== 404) break;
      response = null;
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return NextResponse.json({ error: 'Rate limit reached — please wait a moment and try again.' }, { status: 429 });
      }
      return NextResponse.json(
        { error: `AI service error: ${lastError || 'All models unavailable'}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI route error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ---- prompt builders ---- */

function langSuffix(language: string): string {
  if (language === 'en') return '';
  const names: Record<string, string> = {
    hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali',
  };
  return `\n\nIMPORTANT: Write ALL text values in ${names[language] || 'English'}. Keep JSON keys in English.`;
}

function buildSystemPrompt(type: string, language: string): string {
  const ls = langSuffix(language);

  const prompts: Record<string, string> = {
    preparedness: `You are an expert monsoon preparedness consultant for India. Based on real-time weather data and the user's household profile, create a thorough, personalized monsoon preparedness plan with specific, actionable steps.${ls}

Respond ONLY with valid JSON:
{
  "title": "string",
  "summary": "2-3 sentence overview",
  "sections": [
    {
      "title": "Section name",
      "priority": "high" | "medium" | "low",
      "items": ["Actionable item 1", "Actionable item 2"]
    }
  ]
}

Include 5-7 sections covering: Home Waterproofing, Emergency Supplies, Communication Plan, Water & Sanitation, Electrical Safety, Document Protection, Health Precautions. Tailor priorities to current weather severity.`,

    checklist: `You are an emergency management specialist for Indian monsoon conditions. Generate a dynamic, prioritized emergency checklist reflecting current weather data and severity.${ls}

Respond ONLY with valid JSON:
{
  "title": "string",
  "severity_level": "low" | "moderate" | "high" | "critical",
  "categories": [
    {
      "category": "Category name",
      "phase": "before" | "during" | "after",
      "items": [
        { "text": "Actionable item", "priority": "essential" | "recommended" | "optional" }
      ]
    }
  ]
}

Generate 5-6 categories spanning all three phases with 4-6 items each. Adjust severity and item urgency based on weather.`,

    travel: `You are a travel safety advisor specializing in Indian monsoon conditions. Provide data-driven, specific travel guidance.${ls}

Respond ONLY with valid JSON:
{
  "risk_level": "safe" | "caution" | "warning" | "danger",
  "summary": "Brief assessment",
  "route_conditions": "Expected road/route conditions",
  "recommendations": ["Specific recommendation"],
  "precautions": ["Safety precaution"],
  "alternatives": ["Alternative suggestion"],
  "emergency_contacts": ["Relevant helpline"]
}

Assess risk honestly. Provide 4-6 items per array.`,

    safety: `You are a monsoon safety expert for India. Generate context-aware safety guidance based on real weather data. Focus on practical, potentially life-saving advice.${ls}

Respond ONLY with valid JSON:
{
  "title": "string",
  "overall_risk": "low" | "moderate" | "high" | "critical",
  "categories": [
    {
      "category": "Category name",
      "icon": "single emoji",
      "tips": ["Specific safety tip"]
    }
  ]
}

Include 5-7 categories: Home Safety, Outdoor Safety, Vehicle Safety, Health & Hygiene, Electrical Safety, Water Safety, Children & Elderly. 4-6 tips per category.`,
  };

  return prompts[type] || prompts.safety;
}

function buildUserPrompt(
  type: string,
  weatherData: any,
  location: any,
  userInput: Record<string, string>
): string {
  const weather = `
LIVE WEATHER — ${location.city}, ${location.country || 'India'}
Temperature: ${weatherData.current.temp}°C (feels like ${weatherData.current.feels_like}°C)
Humidity: ${weatherData.current.humidity}%
Wind: ${weatherData.current.wind_speed} m/s
Conditions: ${weatherData.current.description}
Rainfall (1h): ${weatherData.current.rain_1h || 0} mm
Visibility: ${weatherData.current.visibility} m
Pressure: ${weatherData.current.pressure} hPa

5-DAY FORECAST:
${(weatherData.forecast || [])
  .map(
    (f: any) =>
      `  ${f.date}: ${f.description}, ${f.temp_min}–${f.temp_max}°C, rain ${f.rain_probability}% (${f.rain_amount} mm)`
  )
  .join('\n')}

ACTIVE ALERTS: ${
    weatherData.alerts?.length
      ? weatherData.alerts
          .map((a: any) => `[${a.severity.toUpperCase()}] ${a.title}`)
          .join('; ')
      : 'None'
  }`;

  switch (type) {
    case 'preparedness':
      return `${weather}

HOUSEHOLD PROFILE:
- Family size: ${userInput.familySize || 'Not specified'}
- Housing type: ${userInput.housingType || 'Not specified'}
- Area type: ${userInput.areaType || 'Not specified'}
- Special needs: ${userInput.specialNeeds || 'None'}
- Floor level: ${userInput.floorLevel || 'Not specified'}

Create a personalized monsoon preparedness plan for this household.`;

    case 'checklist':
      return `${weather}

Generate a comprehensive emergency checklist for residents of ${location.city} given these conditions.`;

    case 'travel':
      return `${weather}

TRAVEL PLAN:
- From: ${location.city}
- Destination: ${userInput.destination || 'Not specified'}
- Mode: ${userInput.travelMode || 'Not specified'}
- Date: ${userInput.travelDate || 'Today'}

Provide a travel advisory for this route under current monsoon conditions.`;

    case 'safety':
      return `${weather}

Generate comprehensive safety recommendations for ${location.city} residents given these conditions.`;

    default:
      return weather;
  }
}
