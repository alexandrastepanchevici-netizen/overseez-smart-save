import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Globe, ChevronDown, Gauge, Captions, Volume2, VolumeX, Maximize } from 'lucide-react';

const STORAGE_BASE = 'https://vcjiiynnziranklnnqon.supabase.co/storage/v1/object/public/videos';
const CAPTION_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
] as const;

const SUPPORTED_LANGUAGES = CAPTION_LANGUAGES.map(({ code }) => code);
type SupportedLanguage = (typeof CAPTION_LANGUAGES)[number]['code'];

type Cue = { start: number; end: number; text: string };
type PendingSourceSwap = {
  time: number;
  shouldResume: boolean;
  muted: boolean;
  volume: number;
};

const VIDEO_ASSET_VERSION = '20260331-audio-fix-2';

const ENGLISH_VIDEO_SOURCE = `${STORAGE_BASE}/demo.mp4?v=${VIDEO_ASSET_VERSION}`;

const VIDEO_SOURCES: Record<SupportedLanguage, string> = {
  en: ENGLISH_VIDEO_SOURCE,
  fr: ENGLISH_VIDEO_SOURCE,
  es: ENGLISH_VIDEO_SOURCE,
  ru: ENGLISH_VIDEO_SOURCE,
  zh: ENGLISH_VIDEO_SOURCE,
  hi: ENGLISH_VIDEO_SOURCE,
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function normalizeLanguage(language?: string | null): SupportedLanguage {
  const baseLanguage = language?.toLowerCase().split('-')[0] ?? 'en';
  return SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)
    ? (baseLanguage as SupportedLanguage)
    : 'en';
}

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.split('\n\n');

  for (const block of blocks) {
    const lines = block.trim().split('\n');

    for (let i = 0; i < lines.length; i += 1) {
      const match = lines[i].match(/(\d{2}):(\d{2}):(\d{2}\.\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/);
      if (!match) continue;

      const start = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
      const end = parseInt(match[4], 10) * 3600 + parseInt(match[5], 10) * 60 + parseFloat(match[6]);
      const textLines = lines.slice(i + 1).join(' ').replace(/<[^>]*>/g, '').trim();

      if (textLines) {
        cues.push({ start, end, text: textLines });
      }
      break;
    }
  }

  return cues;
}

export default function VideoSection() {
  const { t, i18n } = useTranslation();
  const initialLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  const [captionLang, setCaptionLang] = useState<SupportedLanguage>(initialLanguage);
  const [videoSource, setVideoSource] = useState(VIDEO_SOURCES[initialLanguage]);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentCaption, setCurrentCaption] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [captions, setCaptions] = useState<Record<string, Cue[]>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const pendingSourceSwapRef = useRef<PendingSourceSwap | null>(null);

  useEffect(() => {
    const loadCaptions = async () => {
      const loaded: Record<string, Cue[]> = {};

      await Promise.all(
        CAPTION_LANGUAGES.map(async (language) => {
          try {
            const response = await fetch(`${STORAGE_BASE}/captions_${language.code}.vtt`);
            if (!response.ok) return;

            const text = await response.text();
            loaded[language.code] = parseVTT(text);
          } catch (error) {
            console.warn(`Failed to load captions for ${language.code}`, error);
          }
        }),
      );

      setCaptions(loaded);
    };

    void loadCaptions();
  }, []);

  useEffect(() => {
    const nextLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
    setCaptionLang((currentLanguage) => (currentLanguage === nextLanguage ? currentLanguage : nextLanguage));
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    const nextSource = VIDEO_SOURCES[captionLang];
    if (videoSource === nextSource) return;

    const video = videoRef.current;
    if (video) {
      pendingSourceSwapRef.current = {
        time: video.currentTime,
        shouldResume: !video.paused && !video.ended,
        muted: video.muted,
        volume: video.volume,
      };

      video.pause();
    }

    setIsPlaying(false);
    setVideoSource(nextSource);
    setCurrentCaption('');
  }, [captionLang, videoSource]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (speedRef.current && !speedRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
  }, [speed, videoSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = false;
    video.muted = isMuted;

    if (!isMuted) {
      video.volume = 1;
    }
  }, [isMuted, videoSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
  }, [videoSource]);

  useEffect(() => {
    const languageCues = captions[captionLang] ?? [];
    const cue = languageCues.find(({ start, end }) => currentTime >= start && currentTime < end);
    setCurrentCaption(cue?.text ?? '');
  }, [captionLang, captions, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const pendingSwap = pendingSourceSwapRef.current;
    const nextMuted = pendingSwap?.muted ?? isMuted;
    const nextVolume = pendingSwap?.volume ?? 1;

    setDuration(video.duration);
    video.playbackRate = speed;
    video.defaultMuted = false;
    video.muted = nextMuted;

    if (!nextMuted) {
      video.volume = nextVolume > 0 ? nextVolume : 1;
    }

    setIsMuted(nextMuted);

    if (!pendingSwap) return;

    pendingSourceSwapRef.current = null;
    const safeTime = Math.min(pendingSwap.time, Math.max(video.duration - 0.05, 0));
    if (Number.isFinite(safeTime) && safeTime > 0) {
      video.currentTime = safeTime;
      setCurrentTime(safeTime);
    }

    if (!pendingSwap.shouldResume) return;

    void video.play()
      .then(() => {
        video.defaultMuted = false;
        video.muted = pendingSwap.muted;

        if (!pendingSwap.muted) {
          video.volume = pendingSwap.volume > 0 ? pendingSwap.volume : 1;
        }

        setIsMuted(pendingSwap.muted);
        setIsPlaying(true);
      })
      .catch((error) => {
        console.warn('Translated video playback failed to resume', error);
        setIsPlaying(false);
      });
  }, [isMuted, speed]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.defaultMuted = false;
      video.muted = isMuted;

      if (!isMuted) {
        video.volume = 1;
      }

      void video.play()
        .then(() => {
          setIsMuted(video.muted);
          setIsPlaying(true);
        })
        .catch((error) => {
          console.warn('Video playback failed', error);
          setIsPlaying(false);
        });
      return;
    }

    video.pause();
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((nextSpeed: number) => {
    setSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    setShowSpeedMenu(false);
  }, []);

  const handleLangChange = useCallback((languageCode: string) => {
    const nextLanguage = normalizeLanguage(languageCode);
    localStorage.setItem('overseez_language', nextLanguage);
    setCaptionLang(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
    setShowLangMenu(false);
  }, [i18n]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.defaultMuted = nextMuted;
    video.muted = nextMuted;

    if (!nextMuted) {
      video.volume = 1;
    }

    setIsMuted(nextMuted);
  }, []);

  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const nextTime = Math.max(0, Math.min(duration, ratio * duration));

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

  const handleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (container?.requestFullscreen) {
      void container.requestFullscreen();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentLanguage = CAPTION_LANGUAGES.find(({ code }) => code === captionLang) ?? CAPTION_LANGUAGES[0];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-overseez-mid/50 to-background px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-overseez-blue/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-overseez-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-overseez-blue/20 bg-overseez-blue/10 px-4 py-1.5 text-xs font-medium text-overseez-blue">
            <Play className="h-3.5 w-3.5" />
            {t('video.badge')}
          </div>
          <h2 className="mb-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t('video.title')}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            {t('video.subtitle')}
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-overseez-blue/20 via-overseez-gold/10 to-overseez-blue/20 opacity-40 blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl shadow-overseez-blue/10">
            <div className="relative w-full cursor-pointer bg-foreground" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={videoSource}
                className="block h-auto w-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onVolumeChange={() => setIsMuted(videoRef.current?.muted ?? false)}
                playsInline
                preload="auto"
              />

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 transition-opacity">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-overseez-blue/90 shadow-2xl backdrop-blur-sm sm:h-20 sm:w-20">
                    <Play className="ml-1 h-7 w-7 fill-current text-background sm:h-9 sm:w-9" />
                  </div>
                </div>
              )}

              {showCaptions && currentCaption && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[90%] max-w-2xl -translate-x-1/2">
                  <div className="rounded-lg bg-foreground/80 px-4 py-2.5 text-center backdrop-blur-sm">
                    <p className="text-sm font-medium leading-relaxed text-background sm:text-base">
                      {currentCaption}
                    </p>
                  </div>
                </div>
              )}

            </div>

            <div ref={progressRef} className="group relative h-1.5 cursor-pointer bg-muted/30" onClick={handleProgressClick}>
              <div className="relative h-full bg-overseez-blue transition-all duration-100" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-overseez-blue opacity-0 shadow-md transition-opacity group-hover:opacity-100" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/50 bg-card/95 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={togglePlay} className="flex h-8 w-8 items-center justify-center rounded-lg bg-overseez-blue/10 text-overseez-blue transition-colors hover:bg-overseez-blue/20">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </button>
                <button onClick={toggleMute} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowCaptions((value) => !value)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${showCaptions ? 'bg-overseez-blue/10 text-overseez-blue' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                >
                  <Captions className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">CC</span>
                </button>

                <div ref={speedRef} className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu((value) => !value);
                      setShowLangMenu(false);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Gauge className="h-3.5 w-3.5" />
                    {speed}x
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 z-50 mb-2 w-28 animate-fade-in rounded-xl border border-border bg-card py-1 shadow-lg">
                      {SPEEDS.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSpeedChange(option)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${option === speed ? 'bg-overseez-blue/5 font-medium text-overseez-blue' : 'text-muted-foreground'}`}
                        >
                          {option}x {option === 1 ? `(${t('video.normal')})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={langRef} className="relative">
                  <button
                    onClick={() => {
                      setShowLangMenu((value) => !value);
                      setShowSpeedMenu(false);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {currentLanguage.flag}
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {showLangMenu && (
                    <div className="absolute bottom-full right-0 z-50 mb-2 w-48 animate-fade-in rounded-xl border border-border bg-card py-1 shadow-lg">
                      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                        {t('video.captionLanguage')}
                      </div>
                      {CAPTION_LANGUAGES.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => handleLangChange(language.code)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted ${language.code === captionLang ? 'bg-overseez-blue/5 font-medium text-overseez-blue' : 'text-muted-foreground'}`}
                        >
                          <span>{language.flag}</span>
                          <span className="flex-1 text-left">{language.label}</span>
                          {language.code === captionLang && <Captions className="h-3 w-3 text-overseez-blue" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleFullscreen} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors hover:bg-muted">
                  <Maximize className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
