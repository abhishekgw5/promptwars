'use client';

import { useState } from 'react';
import { WeatherData, Location, Language } from '@/lib/types';

interface Props {
  feature: 'preparedness' | 'checklist' | 'travel' | 'safety';
  weather: WeatherData;
  location: Location;
  language: Language;
}

const SUGGESTIONS: Record<string, string[]> = {
  preparedness: [
    'What if I live on the ground floor near a river?',
    'How should I prepare if I have elderly family members?',
    'What emergency supplies should I stock for 7 days?',
    'How do I waterproof my home before monsoon?',
  ],
  checklist: [
    'Generate a checklist for a family with pets',
    'What items are critical for a flood evacuation kit?',
    'Post-monsoon cleanup — what should I check first?',
    'Hospital and emergency numbers I should save',
  ],
  travel: [
    'Is it safe to drive on the expressway during heavy rain?',
    'Best mode of travel during waterlogging in the city?',
    'Should I postpone my trip if rain is forecast?',
    'What should I keep in my car during monsoon?',
  ],
  safety: [
    'How to stay safe from electrocution during floods?',
    'What diseases spread during monsoon and how to prevent them?',
    'How to identify a landslide-prone area?',
    'Safety tips for children playing outside in rain',
  ],
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function FollowUpSuggestions({ feature, weather, location, language }: Props) {
  const questions = SUGGESTIONS[feature] ?? [];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (question: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feature,
          weatherData: weather,
          location,
          language,
          userInput: { followUpQuestion: question },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'AI request failed');
      }

      const data = await res.json();
      // Extract readable text from structured JSON response
      const text = extractReadableText(data);
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!questions.length) return null;

  return (
    <div className="card bg-gradient-to-r from-monsoon-50 to-blue-50 border-monsoon-100 space-y-4">
      <p className="text-sm font-semibold text-monsoon-800 flex items-center gap-1.5">
        <span>💡</span> Quick Questions — tap to get an instant AI answer
      </p>

      {/* Question chips */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => handleAsk(q)}
            disabled={loading}
            className="text-left text-sm px-3 py-2 bg-white hover:bg-monsoon-50 border border-monsoon-200
                       rounded-xl text-monsoon-700 transition-all hover:shadow-sm hover:scale-[1.01]
                       active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-monsoon-200">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 animate-fade-up ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="w-7 h-7 rounded-full bg-monsoon-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-1">
                  AI
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-monsoon-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-1.5' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              {msg.role === 'user' && (
                <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs flex-shrink-0 mt-1">
                  You
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-center animate-fade-up">
              <span className="w-7 h-7 rounded-full bg-monsoon-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                AI
              </span>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-monsoon-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-monsoon-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-monsoon-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Extracts human-readable text from structured AI JSON responses */
function extractReadableText(data: Record<string, unknown>): string {
  const lines: string[] = [];

  if (data.title) lines.push(String(data.title));
  if (data.summary) lines.push(String(data.summary));

  // Preparedness sections
  if (Array.isArray(data.sections)) {
    for (const section of data.sections) {
      const s = section as Record<string, unknown>;
      lines.push(`\n${s.title}:`);
      if (Array.isArray(s.items)) {
        for (const item of s.items) lines.push(`• ${item}`);
      }
    }
  }

  // Checklist categories
  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      const c = cat as Record<string, unknown>;
      lines.push(`\n${c.category}:`);
      if (Array.isArray(c.items)) {
        for (const item of c.items) {
          const it = item as Record<string, unknown>;
          lines.push(`• ${it.text || item}`);
        }
      }
      if (Array.isArray(c.tips)) {
        for (const tip of c.tips) lines.push(`• ${tip}`);
      }
    }
  }

  // Travel
  if (data.route_conditions) lines.push(`\nRoute: ${data.route_conditions}`);
  if (Array.isArray(data.recommendations)) {
    lines.push('\nRecommendations:');
    for (const r of data.recommendations) lines.push(`• ${r}`);
  }
  if (Array.isArray(data.precautions)) {
    lines.push('\nPrecautions:');
    for (const p of data.precautions) lines.push(`• ${p}`);
  }

  return lines.join('\n').trim() || JSON.stringify(data, null, 2);
}

