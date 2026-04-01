import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

export default function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('overseez_language', code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative z-[100]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors text-xs"
      >
        <span>{current.flag}</span>
        {!compact && <span className="hidden sm:inline">{current.label}</span>}
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 max-h-[60vh] overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-[100] py-1 animate-fade-in">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors ${
                lang.code === i18n.language ? 'text-foreground font-medium bg-muted/50' : 'text-muted-foreground'
              }`}
            >
              <span>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
