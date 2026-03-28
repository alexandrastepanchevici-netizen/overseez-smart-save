import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  feedback: string;
  created_at: string;
  nickname?: string;
}

export default function ReviewSection() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Fetch nicknames for each review
      const userIds = (data as any[]).map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nickname, full_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const enriched = (data as any[]).map((r: any) => {
        const p = profileMap.get(r.user_id);
        return { ...r, nickname: p?.nickname || p?.full_name || 'User' };
      });

      setReviews(enriched);

      if (user) {
        const mine = enriched.find((r: any) => r.user_id === user.id);
        if (mine) {
          setUserReview(mine);
          setRating(mine.rating);
          setFeedback(mine.feedback);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { toast.error('Please log in to leave a review'); return; }
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (!feedback.trim()) { toast.error('Please write some feedback'); return; }

    setSubmitting(true);
    try {
      if (userReview) {
        const { error } = await supabase
          .from('reviews' as any)
          .update({ rating, feedback } as any)
          .eq('user_id', user.id);
        if (error) throw error;
        toast.success('Review updated!');
      } else {
        const { error } = await supabase
          .from('reviews' as any)
          .insert({ user_id: user.id, rating, feedback } as any);
        if (error) throw error;
        toast.success('Thank you for your review!');
      }
      await fetchReviews();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';

  return (
    <div className="space-y-10">
      {/* Submit form */}
      <div className="max-w-lg mx-auto bg-card border border-border rounded-xl p-6 sm:p-8">
        <h3 className="font-display font-semibold text-lg mb-1 text-center">
          {userReview ? 'Update your review' : 'Rate your experience'}
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Your feedback helps us improve Overseez for everyone.
        </p>

        {/* Star picker */}
        <div className="flex items-center justify-center gap-1 mb-5">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(s)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  s <= (hoverRating || rating)
                    ? 'text-overseez-gold fill-overseez-gold'
                    : 'text-muted-foreground/30'
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Tell us what you think..."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          maxLength={500}
          className="mb-4 bg-background/50 border-border/60 resize-none"
          rows={3}
        />

        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || !feedback.trim()}
          className="w-full bg-overseez-blue hover:bg-overseez-blue/90 text-white"
        >
          {submitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Average */}
      {reviews.length > 0 && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="w-5 h-5 text-overseez-gold fill-overseez-gold" />
            <span className="text-2xl font-display font-bold">{avgRating}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Reviews grid */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 overseez-card-hover flex flex-col">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-overseez-gold fill-overseez-gold' : 'text-muted-foreground/20'}`} />
                ))}
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed flex-1 mb-3">"{r.feedback}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <div className="w-8 h-8 rounded-full bg-overseez-blue/15 flex items-center justify-center text-xs font-bold text-overseez-blue">
                  {(r.nickname || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{r.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
