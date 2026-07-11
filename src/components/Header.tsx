'use client';

import { useSession, signOut } from 'next-auth/react';
import { Language, LANGUAGES } from '@/lib/types';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: Props) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-sm">
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

          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600">
                <span className="w-7 h-7 rounded-full bg-monsoon-100 text-monsoon-700 flex items-center justify-center font-semibold text-xs">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="hidden md:inline">{session.user?.name}</span>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="btn-primary text-sm py-1.5 px-4"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
