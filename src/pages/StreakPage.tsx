import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import FloatingOvals from '@/components/FloatingOvals';
import StreakCalendar from '@/components/StreakCalendar';

export default function StreakPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const streak = (profile as any)?.current_streak || 0;
  const longestStreak = (profile as any)?.longest_streak || 0;

  return (
    <div className="min-h-screen bg-background relative pb-20 md:pb-0">
      <FloatingOvals />
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${streak > 0 ? 'bg-orange-400/15' : 'bg-muted/40'}`}>
            <Flame className={`w-10 h-10 ${streak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-5xl font-display font-bold tracking-tight mb-1">
            {streak}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            day streak{streak !== 1 ? 's' : ''}
          </p>
          {streak === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 inline-block">
              Make a search today to start your streak 🔍
            </p>
          ) : streak >= 7 ? (
            <p className="text-xs text-overseez-gold bg-overseez-gold/10 border border-overseez-gold/25 rounded-full px-4 py-1.5 inline-block font-medium">
              🏆 Keep it going — you're on fire!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 inline-block">
              Search daily to build your streak
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold tracking-tight text-orange-400">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">Current streak</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold tracking-tight text-overseez-gold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground mt-1">Longest streak</p>
          </div>
        </div>

        {/* Milestone hints */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Streak milestones</p>
          <div className="space-y-2">
            {[
              { days: 1, label: 'First search', emoji: '🌱' },
              { days: 7, label: '1 week streak', emoji: '🔥' },
              { days: 14, label: '2 week streak', emoji: '⚡' },
              { days: 30, label: '1 month streak', emoji: '🏆' },
              { days: 60, label: '2 month streak', emoji: '💎' },
              { days: 100, label: '100 days', emoji: '👑' },
            ].map(m => (
              <div key={m.days} className={`flex items-center gap-3 py-1.5 ${streak >= m.days ? 'opacity-100' : 'opacity-40'}`}>
                <span className="text-lg w-7">{m.emoji}</span>
                <span className="text-sm flex-1">{m.label}</span>
                {streak >= m.days
                  ? <span className="text-xs text-overseez-green font-medium">✓ Done</span>
                  : <span className="text-xs text-muted-foreground">{m.days - streak}d to go</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <StreakCalendar />
      </div>
    </div>
  );
}
