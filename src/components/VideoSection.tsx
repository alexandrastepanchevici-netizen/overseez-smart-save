import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Globe, ChevronDown, Gauge, Captions, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOOM_EMBED_URL = 'https://www.loom.com/embed/8bb55a899df14beaad431d4adebae672?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true';

// Captions with timestamps (seconds) based on the video content
const CAPTIONS: { start: number; end: number; key: string }[] = [
  { start: 0, end: 5, key: 'c1' },
  { start: 5, end: 12, key: 'c2' },
  { start: 12, end: 20, key: 'c3' },
  { start: 20, end: 28, key: 'c4' },
  { start: 28, end: 36, key: 'c5' },
  { start: 36, end: 45, key: 'c6' },
  { start: 45, end: 55, key: 'c7' },
  { start: 55, end: 65, key: 'c8' },
  { start: 65, end: 75, key: 'c9' },
  { start: 75, end: 85, key: 'c10' },
  { start: 85, end: 94, key: 'c11' },
  { start: 94, end: 105, key: 'c12' },
  { start: 105, end: 115, key: 'c13' },
  { start: 115, end: 125, key: 'c14' },
  { start: 125, end: 135, key: 'c15' },
  { start: 135, end: 145, key: 'c16' },
  { start: 145, end: 155, key: 'c17' },
  { start: 155, end: 165, key: 'c18' },
];

const CAPTION_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoSection() {
  const { t, i18n } = useTranslation();
  const [captionLang, setCaptionLang] = useState(i18n.language || 'en');
  const [showCaptions, setShowCaptions] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentCaption, setCurrentCaption] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const langRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll captions based on elapsed time
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 0.1 * speed;
          // Find current caption
          const idx = CAPTIONS.findIndex(c => next >= c.start && next < c.end);
          if (idx >= 0) setCurrentCaption(idx);
          return next;
        });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync caption language with site language
  useEffect(() => {
    setCaptionLang(i18n.language);
  }, [i18n.language]);

  const getCaptionText = (key: string, lang: string) => {
    return t(`video.captions.${key}`, { lng: lang });
  };

  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-background via-overseez-mid/50 to-background">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-overseez-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-overseez-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-overseez-blue/10 border border-overseez-blue/20 rounded-full px-4 py-1.5 mb-6 text-xs font-medium text-overseez-blue">
            <Play className="w-3.5 h-3.5" />
            {t('video.badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
            {t('video.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            {t('video.subtitle')}
          </p>
        </div>

        {/* Video container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glow effect behind video */}
          <div className="absolute -inset-4 bg-gradient-to-r from-overseez-blue/20 via-overseez-gold/10 to-overseez-blue/20 rounded-3xl blur-2xl opacity-40" />
          
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-overseez-blue/10">
            {/* Video iframe */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={LOOM_EMBED_URL}
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute inset-0 w-full h-full"
                title="Overseez Demo Video"
              />

              {/* Caption overlay */}
              {showCaptions && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pointer-events-none z-20">
                  <div className="bg-black/75 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center">
                    <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
                      {getCaptionText(CAPTIONS[currentCaption]?.key || 'c1', captionLang)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card/95 border-t border-border/50">
              {/* Play/caption timer */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-overseez-blue/10 hover:bg-overseez-blue/20 text-overseez-blue text-xs font-medium transition-colors"
                >
                  {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isPlaying ? t('video.pauseCaptions') : t('video.playCaptions')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Caption toggle */}
                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    showCaptions
                      ? 'bg-overseez-blue/10 text-overseez-blue'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Captions className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CC</span>
                </button>

                {/* Speed control */}
                <div ref={speedRef} className="relative">
                  <button
                    onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowLangMenu(false); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    {speed}x
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-28 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                      {SPEEDS.map(s => (
                        <button
                          key={s}
                          onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                          className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${
                            s === speed ? 'text-overseez-blue font-medium bg-overseez-blue/5' : 'text-muted-foreground'
                          }`}
                        >
                          {s}x {s === 1 ? `(${t('video.normal')})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Caption language selector */}
                <div ref={langRef} className="relative">
                  <button
                    onClick={() => { setShowLangMenu(!showLangMenu); setShowSpeedMenu(false); }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {CAPTION_LANGUAGES.find(l => l.code === captionLang)?.flag}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-44 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                        {t('video.captionLanguage')}
                      </div>
                      {CAPTION_LANGUAGES.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { setCaptionLang(lang.code); setShowLangMenu(false); }}
                          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors ${
                            lang.code === captionLang ? 'text-overseez-blue font-medium bg-overseez-blue/5' : 'text-muted-foreground'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Caption transcript scroll */}
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 max-h-40 overflow-y-auto scrollbar-thin">
              <div className="space-y-1">
                {CAPTIONS.map((cap, i) => (
                  <button
                    key={cap.key}
                    onClick={() => { setCurrentCaption(i); setElapsed(cap.start); }}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      i === currentCaption
                        ? 'bg-overseez-blue/10 text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="inline-block w-12 text-xs text-muted-foreground/60 font-mono">
                      {Math.floor(cap.start / 60)}:{String(Math.floor(cap.start % 60)).padStart(2, '0')}
                    </span>
                    {getCaptionText(cap.key, captionLang)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
