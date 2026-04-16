import React, { useState, useEffect } from 'react';
import AppNav from '@/components/AppNav';
import FloatingOvals from '@/components/FloatingOvals';
import { Button } from '@/components/ui/button';
import { Check, Zap, Loader2, ArrowRight, Coffee } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';

const TESTIMONIAL_IMAGES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
];

export default function Subscription() {
  const { t } = useTranslation();
  const { subscribed, subscriptionEnd, checkSubscription } = useAuth();
  const testimonials = Array.from({ length: 6 }, (_, i) => ({
    text: t(`testimonials.items.${i}.text`),
    image: TESTIMONIAL_IMAGES[i],
    name: t(`testimonials.items.${i}.name`),
    role: t(`testimonials.items.${i}.role`),
  }));
  const testimonialsCol1 = testimonials.slice(0, 3);
  const testimonialsCol2 = testimonials.slice(3, 6);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') { toast.success(t('subscription.title')); checkSubscription(); }
    if (searchParams.get('canceled') === 'true') { toast.info('Checkout was canceled.'); }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) await openExternalUrl(data.url);
    } catch (e: any) { toast.error(e.message || 'Failed to start checkout'); }
    finally { setLoading(false); }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) await openExternalUrl(data.url);
    } catch (e: any) { toast.error(e.message || 'Failed to open portal'); }
    finally { setPortalLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background relative pb-20 md:pb-0">
      <FloatingOvals />
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">{t('subscription.title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('subscription.subtitle')}</p>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-overseez-gold/15 flex items-center justify-center flex-shrink-0"><Coffee className="w-5 h-5 text-overseez-gold" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-overseez-gold font-medium mb-1">{t('subscription.realExample')}</p>
              <h3 className="font-display font-semibold text-lg">{t('subscription.caseTitle')}</h3>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-5 mb-4 space-y-3 text-sm text-foreground/85 leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t('subscription.caseP1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('subscription.caseP2') }} />
            <div className="grid grid-cols-3 gap-3 py-3">
              <div className="text-center bg-card border border-border rounded-lg p-3">
                <p className="text-xl font-display font-bold text-overseez-green">$2.65</p>
                <p className="text-[11px] text-muted-foreground">{t('subscription.savedPerDay')}</p>
              </div>
              <div className="text-center bg-card border border-border rounded-lg p-3">
                <p className="text-xl font-display font-bold text-overseez-green">$79+</p>
                <p className="text-[11px] text-muted-foreground">{t('subscription.savedPerMonth')}</p>
              </div>
              <div className="text-center bg-card border border-overseez-green/30 rounded-lg p-3">
                <p className="text-xl font-display font-bold text-overseez-green">7.9×</p>
                <p className="text-[11px] text-muted-foreground">{t('subscription.subscriptionCost')}</p>
              </div>
            </div>
            <p className="font-semibold text-foreground flex items-center gap-1.5"><ArrowRight className="w-4 h-4 text-overseez-blue flex-shrink-0" /> {t('subscription.caseConclusion')}</p>
          </div>
          <p className="text-xs text-muted-foreground italic">{t('subscription.caseQuote')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`bg-card border rounded-xl p-6 overseez-card-hover ${!subscribed ? 'border-foreground/20' : 'border-border'}`}>
            {!subscribed && <span className="text-[10px] bg-foreground/10 text-foreground px-2 py-0.5 rounded-full font-semibold mb-3 inline-block">{t('subscription.yourPlan')}</span>}
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">{t('subscription.free')}</p>
            <p className="text-3xl font-display font-bold mb-1">$0<span className="text-sm font-normal text-muted-foreground">{t('subscription.month')}</span></p>
            <p className="text-xs text-muted-foreground mb-6">{t('subscription.freeSubtitle')}</p>
            <div className="space-y-2.5 mb-6">
              <Feature text={t('subscription.feature1')} />
              <Feature text={t('subscription.feature2')} />
              <Feature text={t('subscription.feature3')} />
              <Feature text={t('subscription.feature4')} />
            </div>
            <Button variant="outline" className="w-full" disabled>{!subscribed ? t('subscription.currentPlan') : t('subscription.downgrade')}</Button>
          </div>

          <div className={`bg-card rounded-xl p-6 overseez-card-hover relative overflow-hidden ${subscribed ? 'border-2 border-overseez-green/40' : 'border-2 border-overseez-blue/40'}`}>
            <div className="absolute top-3 right-3">
              <span className="text-[10px] bg-overseez-blue/15 text-overseez-blue px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> {subscribed ? t('subscription.active') : t('subscription.recommended')}
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider text-overseez-blue font-medium mb-2">{t('subscription.premiumLabel')}</p>
            <p className="text-3xl font-display font-bold mb-1">$10<span className="text-sm font-normal text-muted-foreground">{t('subscription.month')}</span></p>
            <p className="text-xs text-muted-foreground mb-6">{t('subscription.premiumSubtitle')}</p>
            <div className="space-y-2.5 mb-6">
              <Feature text={t('subscription.premiumF1')} highlight />
              <Feature text={t('subscription.premiumF2')} highlight />
              <Feature text={t('subscription.premiumF3')} highlight />
              <Feature text={t('subscription.premiumF4')} highlight />
              <Feature text={t('subscription.premiumF5')} highlight />
            </div>
            {subscribed ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleManage} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('subscription.manageSubscription')}
                </Button>
                {subscriptionEnd && <p className="text-[11px] text-muted-foreground text-center">{t('subscription.renews', { date: new Date(subscriptionEnd).toLocaleDateString() })}</p>}
              </div>
            ) : (
              <Button variant="accent" className="w-full group" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('subscription.upgradeNow')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="ghost" size="sm" onClick={() => checkSubscription()} className="text-xs text-muted-foreground">{t('subscription.refreshStatus')}</Button>
        </div>
      </div>

      {/* Testimonials */}
      <div className="border-t border-border bg-overseez-mid py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-2 text-center">{t('testimonials.label')}</p>
          <h2 className="text-2xl font-display font-bold tracking-tight mb-10 text-center">{t('testimonials.title')}</h2>
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[480px] overflow-hidden">
            <TestimonialsColumn testimonials={testimonialsCol1} duration={15} />
            <TestimonialsColumn testimonials={testimonialsCol2} duration={19} className="hidden sm:block" />
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
