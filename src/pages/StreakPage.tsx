import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, Sprout, Zap, Trophy, Gem, Crown, Medal, Target, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import StreakCalendar from '@/components/StreakCalendar';
import type { LucideIcon } from 'lucide-react';

function MilestoneRow({ icon: Icon, label, reached, detail }: {
  icon:    LucideIcon;
  label:   string;
  reached: boolean;
  detail:  string;
}) {
  return (
    <div className={`flex items-center gap-3 py-1.5 ${reached ? 'opacity-100' : 'opacity-40'}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${reached ? 'text-overseez-gold' : 'text-muted-foreground'}`} />
      <span className="text-sm flex-1">{label}</span>
      {reached
        ? <span className="text-xs text-overseez-green font-medium">Done</span>
        : <span className="text-xs text-muted-foreground">{detail}</span>
      }
    </div>
  );
}

export default function StreakPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const streak    = (profile as any)?.current_streak   || 0;
  const longestStreak  = (profile as any)?.longest_streak  || 0;
  const top3Count = (profile as any)?.top3_weekly_count || 0;

  return (
    <div className="min-h-screen bg-transparent relative pb-20 md:pb-0">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Header card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${streak > 0 ? 'bg-orange-400/15' : 'bg-muted/40'}`}>
            <Flame className={`w-10 h-10 ${streak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-5xl font-display font-bold tracking-tight mb-1">{streak}</p>
          <p className="text-sm text-muted-foreground mb-4">day streak{streak !== 1 ? 's' : ''}</p>
          {streak === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 inline-block">
              Make a search today to start your streak
            </p>
          ) : streak >= 7 ? (
            <p className="text-xs text-overseez-gold bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-4 py-1.5 inline-block font-medium">
              Keep it going — you're on fire!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 inline-block">
              Search daily to build your streak
            </p>
          )}
        </div>

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold tracking-tight text-orange-400">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">Current streak</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold tracking-tight text-overseez-gold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">Longest streak</p>
          </div>
        </div>

        {/* Top 3 weekly finishes card */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 mb-6">
          <Medal className="w-8 h-8 text-overseez-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Top 3 Weekly Finishes</p>
            <p className="font-display text-2xl font-bold">{top3Count}</p>
          </div>
          {top3Count > 0 && (
            <span className="text-xs font-semibold text-overseez-gold bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-2.5 py-0.5">
              {top3Count === 1 ? '1st finish!' : `${top3Count}x`}
            </span>
          )}
        </div>

        {/* Streak milestones */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Streak milestones</p>
          <div className="space-y-2">
            <MilestoneRow icon={Search}  label="First search"   reached={streak >= 1}   detail="1d to go" />
            <MilestoneRow icon={Flame}   label="1 week streak"  reached={streak >= 7}   detail={`${7 - streak}d to go`} />
            <MilestoneRow icon={Zap}     label="2 week streak"  reached={streak >= 14}  detail={`${14 - streak}d to go`} />
            <MilestoneRow icon={Trophy}  label="1 month streak" reached={streak >= 30}  detail={`${30 - streak}d to go`} />
            <MilestoneRow icon={Gem}     label="2 month streak" reached={streak >= 60}  detail={`${60 - streak}d to go`} />
            <MilestoneRow icon={Crown}   label="100 days"       reached={streak >= 100} detail={`${100 - streak}d to go`} />
          </div>
        </div>

        {/* Leaderboard milestones */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Leaderboard milestones</p>
          <div className="space-y-2">
            <MilestoneRow icon={Medal}  label="First top 3 finish"  reached={top3Count >= 1}  detail="Finish top 3 this week" />
            <MilestoneRow icon={Target} label="3 top 3 finishes"    reached={top3Count >= 3}  detail={`${Math.max(0, 3 - top3Count)} more to go`} />
            <MilestoneRow icon={Trophy} label="10 top 3 finishes"   reached={top3Count >= 10} detail={`${Math.max(0, 10 - top3Count)} more to go`} />
            <MilestoneRow icon={Crown}  label="Weekly Champion"     reached={top3Count >= 1 && (profile as any)?.weekly_rank === 1} detail="Finish #1 this week" />
          </div>
          <button
            onClick={() => navigate('/leaderboard')}
            className="mt-3 w-full text-xs text-overseez-blue py-2 text-center"
          >
            View Leaderboard →
          </button>
        </div>

        {/* Calendar */}
        <StreakCalendar />
      </div>
    </div>
  );
}
