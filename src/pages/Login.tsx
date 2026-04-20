import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OverseezLogo from '@/components/OverseezLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError(t('login.allRequired')); return; }
    setLoading(true); setError('');
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError(t('login.emailNotConfirmed'));
      } else { setError(err.message); }
    } else { navigate('/dashboard'); }
  };

  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <OverseezLogo size={112} className="mx-auto mb-3" color="white" />
          <h1 className="text-3xl font-display font-bold tracking-tight">{t('login.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
          <div>
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} className="mt-1 bg-muted/50 border-border" />
          </div>
          <div>
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} className="mt-1 bg-muted/50 border-border" />
          </div>
          {error && <p className="text-sm text-overseez-red bg-overseez-red/10 rounded-lg p-3">{error}</p>}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>{loading ? t('login.loggingIn') : t('login.loginBtn')}</Button>
          <p className="text-center text-sm text-muted-foreground">{t('login.noAccount')}{' '}<Link to="/register" className="text-overseez-blue hover:underline">{t('login.signUp')}</Link></p>
        </form>
      </div>
    </div>
  );
}
