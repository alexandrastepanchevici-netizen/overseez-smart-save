import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import logoImg from '@/assets/overseez-logo.png';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', birthDate: '', nickname: '', email: '', password: '', terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.birthDate) e.birthDate = 'Birth date is required';
    if (!form.nickname.trim()) e.nickname = 'Nickname is required';
    if (form.nickname.length < 3) e.nickname = 'Nickname must be at least 3 characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.terms) e.terms = 'You must accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(form.email, form.password, {
      full_name: form.fullName,
      nickname: form.nickname,
      birth_date: form.birthDate,
    });
    setLoading(false);
    if (error) {
      setErrors({ submit: error.message });
    } else {
      navigate('/dashboard');
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <img src={logoImg} alt="Overseez" className="w-12 h-12 mx-auto mb-3 invert" />
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Join Overseez
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Finance shouldn't be confusing — it should be intelligent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="Your full name" className="mt-1 bg-muted/50 border-border" />
            {errors.fullName && <p className="text-xs text-overseez-red mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="birthDate">Birth Date</Label>
            <Input id="birthDate" type="date" value={form.birthDate}
              onChange={e => set('birthDate', e.target.value)}
              className="mt-1 bg-muted/50 border-border" />
            {errors.birthDate && <p className="text-xs text-overseez-red mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={form.nickname} onChange={e => set('nickname', e.target.value)}
              placeholder="Choose a unique nickname" className="mt-1 bg-muted/50 border-border" />
            {errors.nickname && <p className="text-xs text-overseez-red mt-1">{errors.nickname}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="you@example.com" className="mt-1 bg-muted/50 border-border" />
            {errors.email && <p className="text-xs text-overseez-red mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="At least 6 characters" className="mt-1 bg-muted/50 border-border" />
            {errors.password && <p className="text-xs text-overseez-red mt-1">{errors.password}</p>}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={form.terms}
              onCheckedChange={v => set('terms', v === true)} className="mt-1" />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
              I agree to the{' '}
              <button type="button" onClick={() => setShowTerms(true)}
                className="text-overseez-blue hover:underline">
                Terms and Conditions
              </button>
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-overseez-red">{errors.terms}</p>}

          {errors.submit && (
            <p className="text-sm text-overseez-red bg-overseez-red/10 rounded-lg p-3">{errors.submit}</p>
          )}

          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-overseez-blue hover:underline">Log in</Link>
          </p>
        </form>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTerms(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold mb-4">Terms and Conditions</h2>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>By using Overseez, you agree to the following terms:</p>
              <p><strong>1. Price Accuracy:</strong> Overseez provides AI-generated price comparisons based on available data. We do not guarantee the accuracy of prices displayed. Actual prices may vary.</p>
              <p><strong>2. No Liability:</strong> Overseez is not responsible for any financial decisions made based on the information provided. Always verify prices at the point of sale.</p>
              <p><strong>3. Offers May Change:</strong> Promotions, sales, and offers displayed are subject to change without notice. Overseez is not affiliated with any retailers shown.</p>
              <p><strong>4. Data Usage:</strong> Your search queries and savings data are stored securely and used to improve your experience. We do not sell personal data to third parties.</p>
              <p><strong>5. Subscription:</strong> Premium features require a paid subscription. You can cancel at any time.</p>
            </div>
            <Button onClick={() => setShowTerms(false)} variant="hero" className="w-full mt-6">
              I Understand
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
