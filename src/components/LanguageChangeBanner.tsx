'use client';

import { useState, useEffect, useRef } from 'react';
import { Language, LANGUAGES } from '@/lib/types';

interface Props {
  language: Language;
  /** Called when user clicks "Regenerate in [language]" */
  onRegenerate: () => void;
  /** Whether AI content is already displayed */
  hasContent: boolean;
}

/**
 * Shows a one-time prompt when the language changes while AI content is visible,
 * letting the user regenerate the output in the newly selected language.
 */
export default function LanguageChangeBanner({ language, onRegenerate, hasContent }: Props) {
  const prevLang = useRef<Language>(language);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (prevLang.current !== language && hasContent) {
      setShowBanner(true);
    }
    prevLang.current = language;
  }, [language, hasContent]);

  if (!showBanner) return null;

  const langName = LANGUAGES[language] || language;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-monsoon-50 border border-monsoon-200 rounded-xl animate-fade-up">
      <div className="flex items-center gap-2 text-monsoon-800 text-sm">
        <span>🌐</span>
        <span>
          Language changed to <strong>{langName}</strong>. Regenerate to see AI content in this language.
        </span>
      </div>
      <button
        onClick={() => { setShowBanner(false); onRegenerate(); }}
        className="shrink-0 btn-primary text-xs py-1.5 px-3"
      >
        Regenerate in {langName}
      </button>
    </div>
  );
}
