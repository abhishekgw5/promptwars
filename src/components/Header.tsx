'use client';

import { Language, LANGUAGES } from '@/lib/types';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-monsoon-500 to-cyan-500 flex items-center justify-center text-white text-xl">
            🌧️
          </div>
          <div>
            <h1 className="text-xl font-bold text-monsoon-900 leading-tight">
              MonsoonGuard
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              AI-Powered Monsoon Preparedness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="lang-select" className="sr-only">
            Language
          </label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="select-field text-sm py-1.5 px-3 w-auto"
            aria-label="Select language"
          >
            {(Object.entries(LANGUAGES) as [Language, string][]).map(
              ([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    </header>
  );
}
