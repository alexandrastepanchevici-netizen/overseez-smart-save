import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Instagram, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingOvals from '@/components/FloatingOvals';
import OverseezLogo from '@/components/OverseezLogo';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function Movement() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-0">
            <OverseezLogo size={96} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none -ml-3">Overseez</span>
          </Link>
          <Link to={user ? '/dashboard' : '/register'}>
            <Button variant="hero" size="sm">{user ? t('nav.dashboard') : t('footer.signUp')}</Button>
          </Link>
        </div>
      </nav>

      <FloatingOvals />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-4">{t('community.label')}</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-6">{t('community.title')}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-10 text-sm sm:text-lg leading-relaxed">
            {t('community.subtitle')}
          </p>

          {/* Social links */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
            <button
              onClick={() => openExternalUrl('https://www.instagram.com/overseez.co')}
              className="flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3 hover:border-overseez-blue/40 transition-colors group">
              <Instagram className="w-5 h-5 text-overseez-blue" />
              <span className="text-sm font-medium">@overseez.co</span>
            </button>
            <button
              onClick={() => openExternalUrl('https://www.tiktok.com/@overseez.co')}
              className="flex items-center gap-2 bg-card border border-border rounded-full px-6 py-3 hover:border-overseez-blue/40 transition-colors group">
              <svg className="w-5 h-5 text-overseez-blue" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12V9.01a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.26 8.26 0 004.77 1.51V7.12a4.83 4.83 0 01-1.01-.43z" />
              </svg>
              <span className="text-sm font-medium">@overseez.co</span>
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {[
              { value: '400+', label: t('hero.activeUsers') },
              { value: '25+', label: t('hero.countries') },
              { value: '$657', label: t('hero.savedPerUser') },
              { value: '4.9★', label: t('hero.userRating') },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.3, ease: 'easeOut' }}
                className="bg-card border border-border rounded-xl p-5 text-center"
              >
                <p className="text-2xl font-display font-bold tracking-tight mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Link to={user ? '/dashboard' : '/register'}>
            <Button variant="hero" size="xl" className="group">
              {user ? 'Go to Dashboard' : t('footer.signUp')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
