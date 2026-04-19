import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAchievements, ALL_BADGES } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { convertCurrency } from '@/components/CurrencySwitcher';
import type { LucideIcon } from 'lucide-react';

// ─── Badge metadata ───────────────────────────────────────────────────────────

type BadgeField = 'searches' | 'savings' | 'streak' | 'cities' | 'countries' | 'referrals' | 'top3' | 'binary';

interface BadgeMeta {
  threshold: number;
  field:     BadgeField;
  ctaText:   string;
}

const BADGE_META: Record<string, BadgeMeta> = {
  first_search:       { threshold: 1,    field: 'searches',  ctaText: 'Search Now →' },
  power_user:         { threshold: 50,   field: 'searches',  ctaText: 'Search Now →' },
  search_master:      { threshold: 200,  field: 'searches',  ctaText: 'Search Now →' },
  first_saving:       { threshold: 1,    field: 'savings',   ctaText: 'Log a Saving →' },
  century_saver:      { threshold: 100,  field: 'savings',   ctaText: 'Log a Saving →' },
  diamond_saver:      { threshold: 500,  field: 'savings',   ctaText: 'Log a Saving →' },
  savings_king:       { threshold: 1000, field: 'savings',   ctaText: 'Log a Saving →' },
  high_roller:        { threshold: 5000, field: 'savings',   ctaText: 'Log a Saving →' },
  week_warrior:       { threshold: 7,    field: 'streak',    ctaText: 'Open Daily →' },
  overseez_legend:    { threshold: 30,   field: 'streak',    ctaText: 'Open Daily →' },
  century_streak:     { threshold: 100,  field: 'streak',    ctaText: 'Open Daily →' },
  globe_trotter:      { threshold: 3,    field: 'cities',    ctaText: 'Search a New City →' },
  world_explorer:     { threshold: 5,    field: 'countries', ctaText: 'Search a New City →' },
  referral_star:      { threshold: 1,    field: 'referrals', ctaText: 'Invite a Friend →' },
  community_builder:  { threshold: 3,    field: 'referrals', ctaText: 'Invite a Friend →' },
  student_smart:      { threshold: 1,    field: 'binary',    ctaText: '' },
  premium_member:     { threshold: 1,    field: 'binary',    ctaText: '' },
  night_owl:          { threshold: 1,    field: 'binary',    ctaText: '' },
  show_off:           { threshold: 1,    field: 'binary',    ctaText: '' },
  challenge_crusher:  { threshold: 1,    field: 'binary',    ctaText: '' },
  challenge_champion: { threshold: 1,    field: 'binary',    ctaText: '' },
  // Leaderboard
  top3_debut:         { threshold: 1,    field: 'top3',      ctaText: 'View Leaderboard →' },
  top3_hat_trick:     { threshold: 3,    field: 'top3',      ctaText: 'View Leaderboard →' },
  top3_veteran:       { threshold: 10,   field: 'top3',      ctaText: 'View Leaderboard →' },
  weekly_champion:    { threshold: 1,    field: 'binary',    ctaText: '' },
};

// Format progress values: integers stay as integers, floats get 2 decimal places
function fmtProgress(n: number): string {
  return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
}

// ─── SVG progress ring ────────────────────────────────────────────────────────

function ProgressRing({ progressPct, size = 48 }: { progressPct: number; size?: number }) {
  const r = (size / 2) - 3;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(progressPct, 100) / 100);
  const isNearComplete = progressPct >= 80;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(200 80% 55% / 0.12)" strokeWidth="2" />
      {progressPct > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={isNearComplete ? 'hsl(160 60% 45%)' : 'hsl(200 80% 55%)'}
          strokeWidth="2" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={isNearComplete ? { filter: 'drop-shadow(0 0 4px hsl(160 60% 45%))' } : undefined}
        />
      )}
    </svg>
  );
}

// ─── Up Next card ─────────────────────────────────────────────────────────────

interface ClosestBadge {
  key:         string;
  icon:        LucideIcon;
  name:        string;
  description: string;
  current:     number;
  threshold:   number;
  progressPct: number;
  ctaText:     string;
}

function UpNextCard({ badge, onCta }: { badge: ClosestBadge; onCta: (ctaText: string) => void }) {
  const progressPct = Math.min(badge.progressPct, 100);
  const Icon = badge.icon;

  return (
    <div className="flex-1 min-w-0 bg-muted/30 border border-border rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 opacity-70">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold truncate">{badge.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {fmtProgress(badge.current)} / {badge.threshold}
          </p>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-overseez-blue to-overseez-green transition-all duration-700"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {badge.ctaText && (
        <button
          onClick={() => onCta(badge.ctaText)}
          className="text-[10px] text-overseez-blue hover:underline text-left leading-none"
        >
          {badge.ctaText}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BadgeShelf() {
  const { fetchUnlocked } = useAchievements();
  const { user, profile, subscribed } = useAuth();
  const navigate = useNavigate();

  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [searchCount, setSearchCount]   = useState(0);
  const [cityCount, setCityCount]       = useState(0);
  const [countryCount, setCountryCount] = useState(0);
  const [showAll, setShowAll]           = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchUnlocked().then(keys => setUnlockedKeys(new Set(keys)));

    supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setSearchCount(count || 0));

    supabase
      .from('ai_usage')
      .select('city, country_code')
      .eq('user_id', user.id)
      .not('city', 'is', null)
      .then(({ data }) => {
        if (!data) return;
        setCityCount(new Set(data.map((r: any) => r.city).filter(Boolean)).size);
        setCountryCount(new Set(data.map((r: any) => r.country_code).filter(Boolean)).size);
      });
  }, [user, fetchUnlocked]);

  const totalSavedUSD = convertCurrency(
    (profile as any)?.total_saved || 0,
    profile?.currency || 'USD',
    'USD',
  );
  const streakDays    = (profile as any)?.current_streak   || 0;
  const referralCount = (profile as any)?.referral_count   || 0;
  const top3Count     = (profile as any)?.top3_weekly_count || 0;

  const progressByField: Record<BadgeField, number> = useMemo(() => ({
    searches:  searchCount,
    savings:   totalSavedUSD,
    streak:    streakDays,
    cities:    cityCount,
    countries: countryCount,
    referrals: referralCount,
    top3:      top3Count,
    binary:    0,
  }), [searchCount, totalSavedUSD, streakDays, cityCount, countryCount, referralCount, top3Count]);

  const top3: ClosestBadge[] = useMemo(() => {
    return ALL_BADGES
      .filter(b => !unlockedKeys.has(b.key))
      .filter(b => BADGE_META[b.key] && BADGE_META[b.key].field !== 'binary')
      .map(b => {
        const meta = BADGE_META[b.key];
        const current = progressByField[meta.field];
        const progressPct = (current / meta.threshold) * 100;
        return {
          key: b.key, icon: b.icon, name: b.name, description: b.description,
          current, threshold: meta.threshold, progressPct, ctaText: meta.ctaText,
        };
      })
      .sort((a, b) => {
        if (Math.abs(b.progressPct - a.progressPct) > 0.001) return b.progressPct - a.progressPct;
        return BADGE_META[a.key].threshold - BADGE_META[b.key].threshold;
      })
      .slice(0, 3);
  }, [unlockedKeys, progressByField]);

  const handleCta = (ctaText: string) => {
    if (ctaText === 'Search Now →' || ctaText === 'Search a New City →') navigate('/search');
    else if (ctaText === 'Log a Saving →') navigate('/search');
    else if (ctaText === 'Open Daily →') { /* streak */ }
    else if (ctaText === 'Invite a Friend →') navigate('/profile');
    else if (ctaText === 'View Leaderboard →') navigate('/leaderboard');
  };

  const unlockedCount = unlockedKeys.size;
  const lockedCount   = ALL_BADGES.length - unlockedCount;

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Badges</h3>
        <span className="text-xs text-muted-foreground">{unlockedCount} / {ALL_BADGES.length} unlocked</span>
      </div>

      {top3.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Up Next</p>
          <div className="flex gap-2">
            {top3.map(b => <UpNextCard key={b.key} badge={b} onCta={handleCta} />)}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowAll(v => !v)}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5 border border-border/50 rounded-lg hover:border-border"
      >
        {showAll
          ? <>Hide badges ↑</>
          : <>{lockedCount > 0 ? `See all ${ALL_BADGES.length} badges (${lockedCount} locked)` : `See all ${ALL_BADGES.length} badges`} ↓</>
        }
      </button>

      {showAll && (
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-3 mt-4">
          {ALL_BADGES.map(badge => {
            const unlocked = unlockedKeys.has(badge.key);
            const meta = BADGE_META[badge.key];
            const current = progressByField[meta.field];
            const progressPct = meta.field === 'binary' ? 0 : (current / meta.threshold) * 100;
            const progressLabel = meta.field !== 'binary'
              ? `${fmtProgress(Math.min(current, meta.threshold))}/${meta.threshold}`
              : null;
            const Icon = badge.icon;

            return (
              <div key={badge.key} className="flex flex-col items-center gap-1 group relative">
                <div className="relative w-12 h-12">
                  {!unlocked && meta.field !== 'binary' && (
                    <ProgressRing progressPct={progressPct} size={48} />
                  )}
                  <div
                    className={`w-full h-full rounded-xl flex items-center justify-center transition-all ${
                      unlocked
                        ? 'bg-overseez-blue/15 border border-overseez-blue/30'
                        : 'bg-muted/40 border border-border opacity-40'
                    }`}
                    title={badge.name}
                  >
                    <Icon className={`w-5 h-5 ${unlocked ? 'text-overseez-gold' : 'text-muted-foreground'}`} />
                  </div>
                </div>

                <span className={`text-[9px] text-center leading-tight max-w-[48px] ${unlocked ? 'text-foreground/70' : 'text-muted-foreground/40'}`}>
                  {badge.name}
                </span>

                {!unlocked && progressLabel && (
                  <span className="text-[8px] text-muted-foreground/50 tabular-nums">{progressLabel}</span>
                )}

                {/* Hover tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1.5 text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity">
                  <p className="font-medium flex items-center gap-1">
                    <Icon className="w-3 h-3 text-overseez-gold" /> {badge.name}
                  </p>
                  <p className="text-muted-foreground text-[10px]">{badge.description}</p>
                  {!unlocked && progressLabel && (
                    <p className="text-[10px] text-overseez-blue mt-0.5">Progress: {progressLabel}</p>
                  )}
                  {!unlocked && !progressLabel && (
                    <p className="text-[10px] text-overseez-blue mt-0.5">Locked</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
