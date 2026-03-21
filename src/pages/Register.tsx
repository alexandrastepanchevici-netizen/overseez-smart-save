import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Mail } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', birthDate: '', nickname: '', email: '', password: '', terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
    }
  };

  const set = (key: string, value: string | boolean) =>
    setForm(p => ({ ...p, [key]: value }));

  if (success) {
    return (
      <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up text-center">
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8">
            <div className="w-16 h-16 rounded-full bg-overseez-green/15 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-overseez-green" />
            </div>
            <h2 className="text-2xl font-display font-bold tracking-tight mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              We've sent a verification link to <strong className="text-foreground">{form.email}</strong>.
              Please click the link in the email to verify your account.
            </p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-overseez-green flex-shrink-0 mt-0.5" />
                <span>After verifying, you can log in with your email and password to access your dashboard.</span>
              </div>
            </div>
            <Button onClick={() => navigate('/login')} variant="hero" size="xl" className="w-full">
              Go to Login
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <OverseezLogo size={48} className="mx-auto mb-3" color="white" />
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
              <Link to="/terms" className="text-overseez-blue hover:underline">
                Terms and Conditions
              </Link>
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
    </div>
  );
}
