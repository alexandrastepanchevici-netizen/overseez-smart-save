import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Globe, ChevronDown, Gauge, Captions, Volume2, VolumeX, Maximize } from 'lucide-react';

const STORAGE_BASE = 'https://vcjiiynnziranklnnqon.supabase.co/storage/v1/object/public/videos';
const VIDEO_URL = `${STORAGE_BASE}/demo.mp4`;

const CAPTION_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'es', label: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', speechLang: 'ru-RU' },
  { code: 'zh', label: '中文', flag: '🇨🇳', speechLang: 'zh-CN' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
];

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type Cue = { start: number; end: number; text: string };

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.split('\n\n');
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/(\d{2}):(\d{2}):(\d{2}\.\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/);
      if (match) {
        const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
        const end = parseInt(match[4]) * 3600 + parseInt(match[5]) * 60 + parseFloat(match[6]);
        const textLines = lines.slice(i + 1).join(' ').replace(/<[^>]*>/g, '').trim();
        if (textLines) cues.push({ start, end, text: textLines });
        break;
      }
    }
  }
  return cues;
}

// Get best matching voice for a language
function getVoiceForLang(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Try exact match first
  let voice = voices.find(v => v.lang === lang);
  // Then prefix match (e.g. "fr" matches "fr-FR")
  if (!voice) {
    const prefix = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(prefix));
  }
  return voice || null;
}

export default function VideoSection() {
  const { t, i18n } = useTranslation();
  const [captionLang, setCaptionLang] = useState(i18n.language || 'en');
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
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const lastSpokenCueRef = useRef<number>(-1);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload SpeechSynthesis voices (they load async in Chrome)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    };

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Load captions for all languages
  useEffect(() => {
    const loadCaptions = async () => {
      const loaded: Record<string, Cue[]> = {};
      const promises = CAPTION_LANGUAGES.map(async (lang) => {
        try {
          const resp = await fetch(`${STORAGE_BASE}/captions_${lang.code}.vtt`);
          if (resp.ok) {
            const text = await resp.text();
            loaded[lang.code] = parseVTT(text);
          }
        } catch (e) {
          console.warn(`Failed to load captions for ${lang.code}`);
        }
      });
      await Promise.all(promises);
      setCaptions(loaded);
    };
    loadCaptions();
  }, []);

  // Sync caption language with site language
  useEffect(() => {
    setCaptionLang(i18n.language);
    lastSpokenCueRef.current = -1;
    window.speechSynthesis?.cancel();
  }, [i18n.language]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setShowSpeedMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Chrome bug: speechSynthesis stops after ~15s. Keep-alive workaround.
  useEffect(() => {
    if (isTTSActive && isPlaying) {
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    } else {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
    }
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [isTTSActive, isPlaying]);

  // Speak a caption cue
  const speakCue = useCallback((text: string, langCode: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langConfig = CAPTION_LANGUAGES.find(l => l.code === langCode);
    const speechLang = langConfig?.speechLang || 'en-US';
    utterance.lang = speechLang;

    // Set a specific voice if available
    const voice = getVoiceForLang(speechLang);
    if (voice) utterance.voice = voice;

    utterance.rate = Math.min(speed * 1.1, 2); // Slightly faster to keep pace
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    synth.speak(utterance);
  }, [speed]);

  // Update current caption and trigger TTS
  useEffect(() => {
    const langCues = captions[captionLang] || [];
    const cueIdx = langCues.findIndex(c => currentTime >= c.start && currentTime < c.end);
    const cue = cueIdx >= 0 ? langCues[cueIdx] : null;

    setCurrentCaption(cue?.text || '');

    // TTS for non-English languages
    if (captionLang !== 'en' && isTTSActive && cue && isPlaying && voicesReady) {
      if (cueIdx !== lastSpokenCueRef.current) {
        lastSpokenCueRef.current = cueIdx;
        speakCue(cue.text, captionLang);
      }
    }
  }, [currentTime, captionLang, captions, isTTSActive, isPlaying, voicesReady, speakCue]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    }
  }, []);

  const handleSpeedChange = useCallback((s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  }, []);

  const handleLangChange = useCallback((code: string) => {
    setCaptionLang(code);
    lastSpokenCueRef.current = -1;
    window.speechSynthesis?.cancel();

    if (code !== 'en') {
      setIsTTSActive(true);
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      setIsTTSActive(false);
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
    }
    setShowLangMenu(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
    lastSpokenCueRef.current = -1;
    window.speechSynthesis?.cancel();
  }, [duration]);

  const handleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (container?.requestFullscreen) container.requestFullscreen();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-background via-overseez-mid/50 to-background">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-overseez-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-overseez-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-overseez-blue/20 via-overseez-gold/10 to-overseez-blue/20 rounded-3xl blur-2xl opacity-40" />

          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-overseez-blue/10">
            <div className="relative w-full bg-black cursor-pointer" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={VIDEO_URL}
                className="w-full h-auto block"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => { setIsPlaying(false); window.speechSynthesis?.cancel(); }}
                onEnded={() => { setIsPlaying(false); window.speechSynthesis?.cancel(); }}
                playsInline
                preload="metadata"
              />

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-overseez-blue/90 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white ml-1" fill="white" />
                  </div>
                </div>
              )}

              {showCaptions && currentCaption && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pointer-events-none z-20">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2.5 text-center">
                    <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
                      {currentCaption}
                    </p>
                  </div>
                </div>
              )}

              {isTTSActive && isPlaying && captionLang !== 'en' && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-overseez-blue/90 text-white text-xs px-3 py-1.5 rounded-full z-20">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  {CAPTION_LANGUAGES.find(l => l.code === captionLang)?.flag} {t('video.voiceTranslation')}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div
              ref={progressRef}
              className="h-1.5 bg-muted/30 cursor-pointer group relative"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-overseez-blue transition-all duration-100 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-overseez-blue rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-card/95 border-t border-border/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={togglePlay} className="flex items-center justify-center w-8 h-8 rounded-lg bg-overseez-blue/10 hover:bg-overseez-blue/20 text-overseez-blue transition-colors">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button onClick={toggleMute} className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${showCaptions ? 'bg-overseez-blue/10 text-overseez-blue' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                >
                  <Captions className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CC</span>
                </button>

                <div ref={speedRef} className="relative">
                  <button onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowLangMenu(false); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors">
                    <Gauge className="w-3.5 h-3.5" />{speed}x<ChevronDown className="w-3 h-3" />
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-28 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                      {SPEEDS.map(s => (
                        <button key={s} onClick={() => handleSpeedChange(s)} className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${s === speed ? 'text-overseez-blue font-medium bg-overseez-blue/5' : 'text-muted-foreground'}`}>
                          {s}x {s === 1 ? `(${t('video.normal')})` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div ref={langRef} className="relative">
                  <button onClick={() => { setShowLangMenu(!showLangMenu); setShowSpeedMenu(false); }} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium transition-colors">
                    <Globe className="w-3.5 h-3.5" />{CAPTION_LANGUAGES.find(l => l.code === captionLang)?.flag}<ChevronDown className="w-3 h-3" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                        {t('video.captionLanguage')}
                      </div>
                      {CAPTION_LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors ${lang.code === captionLang ? 'text-overseez-blue font-medium bg-overseez-blue/5' : 'text-muted-foreground'}`}>
                          <span>{lang.flag}</span>
                          <span className="flex-1 text-left">{lang.label}</span>
                          {lang.code !== 'en' && lang.code === captionLang && <Volume2 className="w-3 h-3 text-overseez-blue" />}
                        </button>
                      ))}
                      <div className="px-3 py-1.5 text-[10px] text-muted-foreground/50 border-t border-border/50 mt-1">
                        {t('video.autoVoice')}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleFullscreen} className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                  <Maximize className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
