import React, { useState, useEffect } from 'react';
import AppNav from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Check, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

export default function Subscription() {
  const { subscribed, subscriptionEnd, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Welcome to Premium! Your subscription is now active.');
      checkSubscription();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout was canceled.');
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to open portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Subscription</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose the plan that works for you.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className={`bg-card border rounded-xl p-6 overseez-card-hover ${!subscribed ? 'border-foreground/20' : 'border-border'}`}>
            {!subscribed && (
              <span className="text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-semibold mb-3 inline-block">Your Plan</span>
            )}
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Free</p>
            <p className="text-3xl font-display font-bold mb-1">£0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mb-6">Perfect for getting started</p>
            <div className="space-y-2.5 mb-6">
              <Feature text="10 AI questions per 24 hours" />
              <Feature text="Location-based search" />
              <Feature text="Basic savings tracking" />
              <Feature text="Google Maps links" />
            </div>
            <Button variant="outline" className="w-full" disabled>
              {!subscribed ? 'Current Plan' : 'Downgrade'}
            </Button>
          </div>

          {/* Premium */}
          <div className={`bg-card rounded-xl p-6 overseez-card-hover relative overflow-hidden ${subscribed ? 'border-2 border-overseez-green/40' : 'border-2 border-overseez-blue/40'}`}>
            <div className="absolute top-3 right-3">
              <span className="text-[10px] bg-overseez-blue/15 text-overseez-blue px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> {subscribed ? 'Active' : 'Recommended'}
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider text-overseez-blue font-medium mb-2">Premium</p>
            <p className="text-3xl font-display font-bold mb-1">£10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mb-6">For serious savers</p>
            <div className="space-y-2.5 mb-6">
              <Feature text="Unlimited AI questions" highlight />
              <Feature text="Priority AI responses" highlight />
              <Feature text="Advanced savings analytics" highlight />
              <Feature text="Bank fee integration" highlight />
              <Feature text="Sale alerts & notifications" highlight />
            </div>
            {subscribed ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleManage} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Subscription'}
                </Button>
                {subscriptionEnd && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Renews {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <Button variant="accent" className="w-full" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade Now'}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" onClick={() => checkSubscription()} className="text-xs text-muted-foreground">
            Refresh subscription status
          </Button>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-overseez-blue' : 'text-muted-foreground'}`} />
      <span className={highlight ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}
