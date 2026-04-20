import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import OverseezLogo from '@/components/OverseezLogo';
import AnimatedCounter from '@/components/AnimatedCounter';
import { ArrowRight } from 'lucide-react';
import GlobeComponent from '@/components/ui/globe';
import { useTranslation } from 'react-i18next';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const COMPARISONS = [
  { key: 'morningCoffee', before: '5.90', after: '2.60' },
  { key: 'weeklyGroceries', before: '97.50', after: '64.30' },
  { key: 'monthlyTransport', before: '175.00', after: '109.00' },
];

export default function Index() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const goAI = () => navigate(user ? '/search' : '/register');

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-card/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-0">
            <OverseezLogo size={96} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none -ml-3">Overseez</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">{t('footer.howItWorks')}</a>
            {user && <Link to="/dashboard" className="hover:text-foreground transition-colors">{t('nav.dashboard')}</Link>}
            {user && <Link to="/search" className="hover:text-foreground transition-colors">{t('nav.aiAssistant')}</Link>}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="hero" size="sm">{t('nav.dashboard')}</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t('login.loginBtn')}</Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="sm">{t('footer.signUp')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overseez-gradient-hero" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-24 pb-16">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-muted/20 border border-border/50 rounded-full px-4 py-1.5 mb-8 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-overseez-green animate-pulse" />
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] mb-6">
              {t('hero.title1')}{' '}
              <span className="overseez-text-gradient">{t('hero.titleHighlight')}</span>
              <br className="hidden sm:block" />
              {t('hero.title2')}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 px-2">
              {t('hero.subtitle')}
            </p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } }} className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="group w-full" onClick={() => navigate(user ? '/dashboard' : '/register')}>
                  {t('footer.signUp')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <div className="mt-14 sm:mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex flex-wrap justify-center gap-6 sm:gap-12 border border-border/30 bg-card/20 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-5">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={26.2} suffix="%" decimals={1} /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.avgSavings')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight">$<AnimatedCounter end={657} decimals={0} /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.savedPerUser')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={400} decimals={0} suffix="+" /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.activeUsers')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={25} decimals={0} suffix="+" /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.countries')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={4.9} decimals={1} />★</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.userRating')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-10">
          <OverseezLogo size={128} color="white" />
        </div>
      </section>

      {/* ─── BEFORE / AFTER PRICE CARDS ─── */}
      <section className="py-20 px-4 sm:px-6 bg-overseez-mid relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <RevealSection className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-overseez-gold font-medium mb-3">{t('beforeAfter.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('beforeAfter.title')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
              {t('beforeAfter.subtitle')}
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {COMPARISONS.map((c, i) => {
              const saved = (parseFloat(c.before) - parseFloat(c.after)).toFixed(2);
              return (
                <RevealSection key={c.key} delay={i * 120}>
                  <div className="bg-card border border-border rounded-2xl p-6 overseez-card-hover text-center relative overflow-hidden group">
                    <svg className="absolute -top-8 -right-8 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500" viewBox="0 0 100 100" fill="none">
                      <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(200 80% 55%)" strokeWidth="4" />
                    </svg>
                    <h3 className="font-display font-semibold text-sm mb-4">{t(`beforeAfter.${c.key}`)}</h3>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('beforeAfter.before')}</p>
                        <p className="text-lg font-display font-bold text-overseez-red line-through opacity-70">${c.before}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('beforeAfter.after')}</p>
                        <p className="text-lg font-display font-bold text-overseez-green">${c.after}</p>
                      </div>
                    </div>
                    <div className="bg-overseez-green/10 border border-overseez-green/20 rounded-full px-4 py-1.5 inline-block">
                      <span className="text-xs font-semibold text-overseez-green">{t('beforeAfter.saveEveryTime', { amount: saved })}</span>
                    </div>
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PAIN POINTS ─── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <RevealSection className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-overseez-red font-medium mb-3">{t('pain.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('pain.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              {t('pain.subtitle')}
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <RevealSection key={i} delay={(i - 1) * 100}>
                <div className="bg-card border border-overseez-red/15 rounded-xl p-6 text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-overseez-red/30 to-transparent" />
                  <p className="text-base sm:text-lg font-display font-bold leading-snug">"{t(`pain.q${i}`)}"</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={300} className="text-center mt-10">
            <Button variant="hero" size="xl" className="group w-full sm:w-auto" onClick={goAI}>
              {t('pain.startSaving')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </RevealSection>
        </div>
      </section>

      {/* ─── GLOBE ─── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('globe.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('globe.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              {t('globe.subtitle')}
            </p>
          </RevealSection>
          <RevealSection delay={200}>
            <div className="w-full h-[400px] sm:h-[500px] lg:h-[550px] rounded-2xl border border-border bg-card/30 overflow-hidden">
              <GlobeComponent />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <RevealSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('howItWorks.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('howItWorks.title')}
            </h2>
          </RevealSection>

          <div className="space-y-6">
            {[1, 2, 3].map((step, i) => (
              <RevealSection key={step} delay={i * 120}>
                <div className="flex gap-4 sm:gap-6 items-start bg-card border border-border rounded-xl p-5 sm:p-6 overseez-card-hover relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-overseez-blue/40 to-transparent rounded-l-xl" />
                  <span className="text-3xl sm:text-4xl font-display font-bold text-overseez-blue/20 flex-shrink-0 w-12 sm:w-16">{String(step).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-display font-semibold text-base sm:text-lg mb-1">{t(`howItWorks.step${step}Title`)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`howItWorks.step${step}Desc`)}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY / SOCIAL ─── */}
      <section className="py-20 px-4 sm:px-6 bg-overseez-mid">
        <div className="max-w-4xl mx-auto text-center">
          <RevealSection>
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('community.label')}</p>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-4">{t('community.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm sm:text-base">{t('community.subtitle')}</p>
            <Link to="/movement">
              <Button variant="hero-outline" size="lg" className="group">
                Join the Movement <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card/50 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-0">
              <OverseezLogo size={96} color="white" />
              <span className="font-display font-bold -ml-3">Overseez</span>
            </Link>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">{t('footer.howItWorks')}</a>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">{t('footer.signUp')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground/60">
            {t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
