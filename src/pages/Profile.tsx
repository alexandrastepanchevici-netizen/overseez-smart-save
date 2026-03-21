import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppNav from '@/components/AppNav';
import { User, Calendar, Wallet, Star, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { profile, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-6">Your Profile</h1>

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
            <InfoItem icon={<Wallet className="w-4 h-4" />} label="Total Saved"
              value={`${profile?.currency || '£'}${Number(profile?.total_saved || 0).toFixed(2)}`} />
            <InfoItem icon={<Star className="w-4 h-4" />} label="Subscription"
              value="Free Plan" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-display font-semibold">Account</h3>
          </div>
          <div className="space-y-3">
            <Link to="/subscription" className="flex items-center justify-between bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <span className="text-sm">Manage Subscription</span>
              <span className="text-xs text-muted-foreground">Free Plan →</span>
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
