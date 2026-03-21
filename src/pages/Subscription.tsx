import React from 'react';
import AppNav from '@/components/AppNav';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';

export default function Subscription() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Subscription</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose the plan that works for you.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-card border border-border rounded-xl p-6 overseez-card-hover">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Free</p>
            <p className="text-3xl font-display font-bold mb-1">{'\u00A3'}0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mb-6">Perfect for getting started</p>
            <div className="space-y-2.5 mb-6">
              <Feature text="10 AI questions per 24 hours" />
              <Feature text="Location-based search" />
              <Feature text="Basic savings tracking" />
              <Feature text="Google Maps links" />
            </div>
            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
          </div>

          {/* Premium */}
          <div className="bg-card border-2 border-overseez-blue/40 rounded-xl p-6 overseez-card-hover relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] bg-overseez-blue/15 text-overseez-blue px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Recommended
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider text-overseez-blue font-medium mb-2">Premium</p>
            <p className="text-3xl font-display font-bold mb-1">{'\u00A3'}10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <p className="text-xs text-muted-foreground mb-6">For serious savers</p>
            <div className="space-y-2.5 mb-6">
              <Feature text="Unlimited AI questions" highlight />
              <Feature text="Priority AI responses" highlight />
              <Feature text="Advanced savings analytics" highlight />
              <Feature text="Bank fee integration" highlight />
              <Feature text="Sale alerts & notifications" highlight />
            </div>
            <Button variant="accent" className="w-full">
              Upgrade Now
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Stripe checkout coming in Phase 2</p>
          </div>
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
