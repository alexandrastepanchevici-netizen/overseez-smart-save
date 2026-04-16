import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-transparent">
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-0">
            <OverseezLogo size={96} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none -ml-3">Overseez</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link to="/register" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> {t('terms.back')}
            </Link>
          </div>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">{t('terms.title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('terms.lastUpdated')}</p>
        <div className="space-y-8 text-sm text-foreground/85 leading-relaxed">
          {[1,2,3,4,5,6,7,8].map(n => (
            <section key={n}>
              <h2 className="text-lg font-display font-semibold mb-3">{t(`terms.s${n}Title`)}</h2>
              <p>{t(`terms.s${n}Text`)}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-4">{t('terms.agreeNote')}</p>
          <Link to="/register" className="text-sm text-overseez-blue hover:underline">{t('terms.backToReg')}</Link>
        </div>
      </div>
    </div>
  );
}
