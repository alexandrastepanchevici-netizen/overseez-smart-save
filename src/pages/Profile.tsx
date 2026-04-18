import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import { getCurrencySymbol } from '@/components/CurrencySwitcher';
import BadgeShelf from '@/components/BadgeShelf';
import GoalCard from '@/components/GoalCard';
import { User, Calendar, Wallet, Star, Shield, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useXP } from '@/hooks/useXP';
import ReviewSection from '@/components/ReviewSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Profile() {
  const { t } = useTranslation();
  const { profile, user, subscribed } = useAuth();
  const { xp, levelInfo } = useXP();
  const navigate = useNavigate();

  const profileCurrency = profile?.currency || 'USD';

  return (
    <div className="min-h-screen bg-transparent relative pb-20 md:pb-0">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-6">{t('profile.title')}</h1>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-overseez-blue/20 flex items-center justify-center">
                <User className="w-8 h-8 text-overseez-blue" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-overseez-blue text-white rounded-full px-1.5 py-0.5 leading-none">
                {levelInfo.level}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">@{profile?.nickname || 'user'}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-overseez-blue">{levelInfo.name}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-overseez-blue transition-all duration-700"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {xp} XP{levelInfo.nextLevelXP ? ` / ${levelInfo.nextLevelXP}` : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label={t('profile.birthDate')} value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '—'} />
            <InfoItem icon={<User className="w-4 h-4" />} label={t('profile.email')} value={user?.email || '—'} />
            <InfoItem icon={<Wallet className="w-4 h-4" />} label={t('profile.currency')} value={`${getCurrencySymbol(profileCurrency)} (${profileCurrency})`} />
            <InfoItem icon={<Star className="w-4 h-4" />} label={t('profile.subscriptionLabel')} value={subscribed ? t('profile.premium') : t('profile.freePlan')} />
          </div>
        </div>

        <BadgeShelf />

        {/* Streak button */}
        <button
          onClick={() => navigate('/streak')}
          className="w-full bg-card border border-border rounded-xl p-5 mb-6 flex items-center justify-between overseez-card-hover group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${((profile as any)?.current_streak || 0) > 0 ? 'bg-orange-400/15' : 'bg-muted/40'}`}>
              <Flame className={`w-5 h-5 ${((profile as any)?.current_streak || 0) > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">
                {(profile as any)?.current_streak || 0} day streak
              </p>
              <p className="text-xs text-muted-foreground">Tap to view activity calendar</p>
            </div>
          </div>
          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-lg">→</span>
        </button>

        <GoalCard />

        {/* Account settings */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-muted-foreground" /><h3 className="font-display font-semibold">{t('profile.account')}</h3></div>
          <div className="space-y-3">
            <button
              onClick={async () => {
                const nick = profile?.nickname;
                if (!nick) return;
                const link = `https://overseez.co/?ref=${encodeURIComponent(nick)}#/register`;
                const text = `Join me on Overseez — the app that finds you the best prices near you!\n${link}`;
                if (navigator.share) {
                  try { await navigator.share({ title: 'Join Overseez', text, url: link }); } catch {}
                } else {
                  await navigator.clipboard.writeText(link);
                  const { toast } = await import('sonner');
                  toast.success('Invite link copied!');
                }
              }}
              className="flex items-center justify-between w-full bg-overseez-blue/10 border border-overseez-blue/30 rounded-lg p-3 hover:bg-overseez-blue/20 transition-colors">
              <span className="text-sm text-overseez-blue font-medium flex items-center gap-1.5"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Invite a Friend</span>
              <span className="text-xs text-muted-foreground">Share your link →</span>
            </button>
            <Link to="/subscription" className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm">{t('profile.manageSubscription')}</span>
              <span className="text-xs text-muted-foreground">{subscribed ? t('profile.premium') : t('profile.freePlan')} →</span>
            </Link>
            <Link to="/terms" className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm">{t('profile.termsConditions')}</span>
              <span className="text-xs text-muted-foreground">{t('profile.view')}</span>
            </Link>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <span className="text-sm">Language</span>
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>

        {/* Help us improve — bottom of page */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-display font-semibold mb-4">{t('feedback.title')}</h3>
          <ReviewSection />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-xs uppercase tracking-wider font-medium">{label}</span></div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
