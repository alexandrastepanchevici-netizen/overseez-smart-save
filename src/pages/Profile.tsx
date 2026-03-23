import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppNav from '@/components/AppNav';
import CurrencySwitcher, { convertCurrency, getCurrencySymbol } from '@/components/CurrencySwitcher';
import { User, Calendar, Wallet, Star, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const MILESTONES = [5, 25, 50, 100, 250, 500, 1000];

export default function Profile() {
  const { profile, user, subscribed } = useAuth();
  const [usageLeft, setUsageLeft] = useState(5);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    supabase.from('ai_usage').select('id', { count: 'exact' })
      .eq('user_id', user.id).gte('created_at', since)
      .then(({ count }) => setUsageLeft(Math.max(0, 5 - (count || 0))));
  }, [user]);

  const profileCurrency = profile?.currency || 'USD';
  const sym = getCurrencySymbol(displayCurrency);
  const totalSaved = convertCurrency(profile?.total_saved || 0, profileCurrency, displayCurrency);

  useEffect(() => {
    if (totalSaved === 0) { setAnimatedTotal(0); return; }
    const dur = 800;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimatedTotal(totalSaved * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [totalSaved]);

  const goalMax = MILESTONES[MILESTONES.length - 1];
  const pct = Math.min((totalSaved / goalMax) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold tracking-tight">Your Profile</h1>
          <CurrencySwitcher value={displayCurrency} onChange={setDisplayCurrency} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-overseez-blue/20 flex items-center justify-center">
              <User className="w-8 h-8 text-overseez-blue" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">@{profile?.nickname || 'user'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Birth Date"
              value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : '—'} />
            <InfoItem icon={<User className="w-4 h-4" />} label="Email"
              value={user?.email || '—'} />
            <InfoItem icon={<Wallet className="w-4 h-4" />} label="Currency"
              value={`${getCurrencySymbol(profileCurrency)} (${profileCurrency})`} />
            <InfoItem icon={<Star className="w-4 h-4" />} label="Subscription"
              value={subscribed ? 'Premium' : 'Free Plan'} />
          </div>
        </div>

        {/* Savings Progress */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-overseez-blue" />
            <h3 className="font-display font-semibold">Savings Progress</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-2xl font-display font-bold tracking-tight">
              {sym}{animatedTotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Goal: {sym}{goalMax.toLocaleString()}</p>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full bg-gradient-to-r from-overseez-blue to-overseez-green transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            {MILESTONES.map(m => (
              <div key={m} className="flex flex-col items-center gap-0.5">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${totalSaved >= m ? 'bg-overseez-green' : 'bg-muted-foreground/30'}`} />
                <span className={`text-[10px] ${totalSaved >= m ? 'text-foreground/80' : 'text-muted-foreground/40'}`}>
                  {m >= 1000 ? `${sym}1k` : `${sym}${m}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">AI Usage</h3>
            <span className="text-sm text-muted-foreground">
              {subscribed ? 'Unlimited' : `${usageLeft} / 5 remaining`}
            </span>
          </div>
          {!subscribed && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${usageLeft <= 1 ? 'bg-overseez-red' : usageLeft <= 2 ? 'bg-overseez-gold' : 'bg-overseez-blue'}`}
                style={{ width: `${(usageLeft / 5) * 100}%` }} />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {subscribed ? 'Premium subscribers have unlimited AI access.' : 'Free questions reset every 24 hours.'}
          </p>
        </div>

        {/* Account */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-display font-semibold">Account</h3>
          </div>
          <div className="space-y-3">
            <Link to="/subscription" className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm">Manage Subscription</span>
              <span className="text-xs text-muted-foreground">{subscribed ? 'Premium' : 'Free Plan'} →</span>
            </Link>
            <Link to="/terms" className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm">Terms & Conditions</span>
              <span className="text-xs text-muted-foreground">View →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
