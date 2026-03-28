import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ReviewSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('reviews' as any).select('id').eq('user_id', user.id)
      .then(({ data }) => { if (data && (data as any[]).length > 0) setSubmitted(true); });
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { toast.error(t('feedback.loginRequired')); return; }
    if (rating === 0) { toast.error(t('feedback.ratingRequired')); return; }
    if (!feedback.trim()) { toast.error(t('feedback.feedbackRequired')); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews' as any).upsert({ user_id: user.id, rating, feedback } as any, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success(t('feedback.thanks'));
      setSubmitted(true);
    } catch (e: any) { toast.error(e.message || 'Failed to submit review'); }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-6">
        <Star className="w-8 h-8 text-overseez-gold fill-overseez-gold mx-auto mb-3" />
        <p className="font-display font-semibold text-lg mb-1">{t('feedback.thanks')}</p>
        <p className="text-sm text-muted-foreground">{t('feedback.thanksSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 sm:p-8">
      <h3 className="font-display font-semibold text-lg mb-1 text-center">{t('feedback.rateTitle')}</h3>
      <p className="text-sm text-muted-foreground text-center mb-5">{t('feedback.rateSubtitle')}</p>
      <div className="flex items-center justify-center gap-1 mb-5">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
            <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? 'text-overseez-gold fill-overseez-gold' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
      </div>
      <Textarea placeholder={t('feedback.placeholder')} value={feedback} onChange={e => setFeedback(e.target.value)} maxLength={500} className="mb-4 bg-background/50 border-border/60 resize-none" rows={3} />
      <Button onClick={handleSubmit} disabled={submitting || rating === 0 || !feedback.trim()} className="w-full bg-overseez-blue hover:bg-overseez-blue/90 text-white">
        {submitting ? t('feedback.submitting') : t('feedback.submit')}
        <Send className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
