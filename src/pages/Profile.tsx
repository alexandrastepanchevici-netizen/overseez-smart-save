import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import { getCurrencySymbol } from '@/components/CurrencySwitcher';
import BadgeShelf from '@/components/BadgeShelf';
import GoalCard from '@/components/GoalCard';
import ProfileAvatar from '@/components/ProfileAvatar';
import ProfileFrameSheet from '@/components/ProfileFrameSheet';
import { Calendar, Wallet, Star, Shield, Flame, X, Loader2, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useXP } from '@/hooks/useXP';
import ReviewSection from '@/components/ReviewSection';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { t } = useTranslation();
  const { profile, user, subscribed, refreshProfile } = useAuth();
  const { xp, levelInfo } = useXP();
  const navigate = useNavigate();

  const profileCurrency = profile?.currency || 'USD';
  const avatarUrl = (profile as any)?.avatar_url as string | null;

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [frameSheetOpen, setFrameSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = () => {
    setEditName(profile?.full_name || '');
    setPreviewUrl(null);
    setAvatarFile(null);
    setEditOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        newAvatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
      }

      const updates: Record<string, any> = {};
      if (editName.trim() && editName.trim() !== profile?.full_name) {
        updates.full_name = editName.trim();
      }
      if (newAvatarUrl !== avatarUrl) {
        updates.avatar_url = newAvatarUrl;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('profiles').update(updates as any).eq('user_id', user.id);
        if (error) throw error;
        await refreshProfile();
      }

      toast.success('Profile updated');
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative pb-20 md:pb-0">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-6">{t('profile.title')}</h1>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {/* Tappable avatar — opens frame sheet */}
            <ProfileAvatar
              size="md"
              avatarUrl={avatarUrl}
              nickname={profile?.nickname || profile?.full_name || 'U'}
              weeklyRank={(profile as any)?.weekly_rank ?? null}
              showLevel
              level={levelInfo.level}
              onClick={() => setFrameSheetOpen(true)}
            />
            <ProfileFrameSheet
              open={frameSheetOpen}
              onOpenChange={setFrameSheetOpen}
              weeklyRank={(profile as any)?.weekly_rank ?? null}
              avatarUrl={avatarUrl}
              nickname={profile?.nickname || profile?.full_name || 'U'}
              onChangePhoto={() => { setFrameSheetOpen(false); openEdit(); }}
            />

            <div className="flex-1 min-w-0">
              <button onClick={openEdit} className="text-left">
                <h2 className="text-xl font-display font-semibold hover:text-overseez-blue transition-colors">{profile?.full_name || 'User'}</h2>
              </button>
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
              <p className="text-sm font-semibold">{(profile as any)?.current_streak || 0} day streak</p>
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

        {/* Help us improve */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-display font-semibold mb-4">{t('feedback.title')}</h3>
          <ReviewSection />
        </div>
      </div>

      {/* Edit profile modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setEditOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">Edit Profile</h3>
              <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar picker */}
            <div className="flex flex-col items-center mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-full overflow-hidden mb-2"
              >
                <div className="w-full h-full bg-overseez-blue/20 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-overseez-blue" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Tap to change photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Name field */}
            <div className="mb-5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-1.5">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-overseez-blue/50 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="hero" className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
