import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Mail } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const CURRENCIES = [
  { code: 'GB', symbol: '£', label: 'United Kingdom (£)' },
  { code: 'US', symbol: '$', label: 'United States ($)' },
  { code: 'EU', symbol: '€', label: 'Eurozone (€)' },
  { code: 'CA', symbol: 'C$', label: 'Canada (C$)' },
  { code: 'AU', symbol: 'A$', label: 'Australia (A$)' },
  { code: 'JP', symbol: '¥', label: 'Japan (¥)' },
  { code: 'IN', symbol: '₹', label: 'India (₹)' },
  { code: 'NG', symbol: '₦', label: 'Nigeria (₦)' },
  { code: 'GH', symbol: '₵', label: 'Ghana (₵)' },
  { code: 'KE', symbol: 'KSh', label: 'Kenya (KSh)' },
  { code: 'ZA', symbol: 'R', label: 'South Africa (R)' },
  { code: 'BR', symbol: 'R$', label: 'Brazil (R$)' },
  { code: 'MX', symbol: '$', label: 'Mexico ($)' },
  { code: 'KR', symbol: '₩', label: 'South Korea (₩)' },
  { code: 'CN', symbol: '¥', label: 'China (¥)' },
  { code: 'AE', symbol: 'AED', label: 'UAE (AED)' },
  { code: 'TR', symbol: '₺', label: 'Turkey (₺)' },
  { code: 'PL', symbol: 'zł', label: 'Poland (zł)' },
  { code: 'SE', symbol: 'kr', label: 'Sweden (kr)' },
  { code: 'CH', symbol: 'CHF', label: 'Switzerland (CHF)' },
  { code: 'SG', symbol: 'S$', label: 'Singapore (S$)' },
  { code: 'HK', symbol: 'HK$', label: 'Hong Kong (HK$)' },
];

export default function Register() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', birthDate: '', nickname: '', email: '', password: '', currency: 'GB', terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = t('register.errFullName');
    if (!form.birthDate) e.birthDate = t('register.errBirthDate');
    if (!form.nickname.trim()) e.nickname = t('register.errNickname');
    if (form.nickname.length < 3) e.nickname = t('register.errNicknameLen');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = t('register.errEmail');
    if (form.password.length < 6) e.password = t('register.errPassword');
    if (!form.currency) e.currency = t('register.errCurrency');
    if (!form.terms) e.terms = t('register.errTerms');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === form.currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const referredBy = localStorage.getItem('overseez_ref') || '';
    const metadata: Record<string, string> = {
      full_name: form.fullName, nickname: form.nickname, birth_date: form.birthDate, currency: selectedCurrency?.symbol || '£',
    };
    if (referredBy) metadata.referred_by = referredBy;
    const { error } = await signUp(form.email, form.password, metadata);
    if (!error) localStorage.removeItem('overseez_ref');
    setLoading(false);
    if (error) { setErrors({ submit: error.message }); } else { setSuccess(true); }
  };

  const set = (key: string, value: string | boolean) => setForm(p => ({ ...p, [key]: value }));

  if (success) {
    return (
      <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up text-center">
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-8">
            <div className="w-16 h-16 rounded-full bg-overseez-green/15 flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-overseez-green" /></div>
            <h2 className="text-2xl font-display font-bold tracking-tight mb-2">{t('register.checkEmail')}</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{t('register.verifyMsg')} <strong className="text-foreground">{form.email}</strong>.</p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3 text-xs text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-overseez-green flex-shrink-0 mt-0.5" /><span>{t('register.verifyNote')}</span></div>
            </div>
            <Button onClick={() => navigate('/login')} variant="hero" size="xl" className="w-full">{t('register.goToLogin')}</Button>
            <p className="text-xs text-muted-foreground mt-4">{t('register.noEmail')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overseez-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <OverseezLogo size={112} className="mx-auto mb-3" color="white" />
          <h1 className="text-3xl font-display font-bold tracking-tight">{t('register.title')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t('register.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
          <div>
            <Label htmlFor="fullName">{t('register.fullName')}</Label>
            <Input id="fullName" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder={t('register.fullNamePlaceholder')} className="mt-1 bg-muted/50 border-border" />
            {errors.fullName && <p className="text-xs text-overseez-red mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <Label htmlFor="birthDate">{t('register.birthDate')}</Label>
            <Input id="birthDate" type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className="mt-1 bg-muted/50 border-border" />
            {errors.birthDate && <p className="text-xs text-overseez-red mt-1">{errors.birthDate}</p>}
          </div>
          <div>
            <Label htmlFor="nickname">{t('register.nickname')}</Label>
            <Input id="nickname" value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder={t('register.nicknamePlaceholder')} className="mt-1 bg-muted/50 border-border" />
            {errors.nickname && <p className="text-xs text-overseez-red mt-1">{errors.nickname}</p>}
          </div>
          <div>
            <Label htmlFor="currency">{t('register.currency')}</Label>
            <select id="currency" value={form.currency} onChange={e => set('currency', e.target.value)} className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            {errors.currency && <p className="text-xs text-overseez-red mt-1">{errors.currency}</p>}
          </div>
          <div>
            <Label htmlFor="email">{t('register.email')}</Label>
            <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('register.emailPlaceholder')} className="mt-1 bg-muted/50 border-border" />
            {errors.email && <p className="text-xs text-overseez-red mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">{t('register.password')}</Label>
            <Input id="password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={t('register.passwordPlaceholder')} className="mt-1 bg-muted/50 border-border" />
            {errors.password && <p className="text-xs text-overseez-red mt-1">{errors.password}</p>}
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={form.terms} onCheckedChange={v => set('terms', v === true)} className="mt-1" />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">{t('register.terms')}{' '}<Link to="/terms" className="text-overseez-blue hover:underline">{t('register.termsLink')}</Link></Label>
          </div>
          {errors.terms && <p className="text-xs text-overseez-red">{errors.terms}</p>}
          {errors.submit && <p className="text-sm text-overseez-red bg-overseez-red/10 rounded-lg p-3">{errors.submit}</p>}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>{loading ? t('register.creating') : t('register.createAccount')}</Button>
          <p className="text-center text-sm text-muted-foreground">{t('register.hasAccount')}{' '}<Link to="/login" className="text-overseez-blue hover:underline">{t('register.logIn')}</Link></p>
        </form>
      </div>
    </div>
  );
}
