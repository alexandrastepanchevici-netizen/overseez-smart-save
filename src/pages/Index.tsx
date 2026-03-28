import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import OverseezLogo from '@/components/OverseezLogo';
import FloatingOvals from '@/components/FloatingOvals';
import AnimatedCounter from '@/components/AnimatedCounter';
import { Search, MapPin, TrendingDown, Shield, Zap, Globe, Star, ArrowRight, ChevronRight, Instagram } from 'lucide-react';
import ReviewSection from '@/components/ReviewSection';
import { TestimonialsColumn } from '@/components/ui/testimonials-columns-1';
import GlobeComponent from '@/components/ui/globe';
import LanguageSwitcher from '@/components/LanguageSwitcher';
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

const FEATURE_ICONS = [
  <Search className="w-5 h-5" />,
  <MapPin className="w-5 h-5" />,
  <TrendingDown className="w-5 h-5" />,
  <Shield className="w-5 h-5" />,
  <Zap className="w-5 h-5" />,
  <Globe className="w-5 h-5" />,
];

const FEATURE_KEYS = ['aiPrice', 'locationAware', 'savingsTracker', 'bankFee', 'saleAlerts', 'worksGlobally'];

const COMPARISONS = [
  { key: 'morningCoffee', before: '5.90', after: '2.60' },
  { key: 'weeklyGroceries', before: '97.50', after: '64.30' },
  { key: 'monthlyTransport', before: '175.00', after: '109.00' },
];

const TESTIMONIAL_IMAGES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=100&h=100&fit=crop",
];

const testimonialsCol1 = TESTIMONIALS.slice(0, 3);
const testimonialsCol2 = TESTIMONIALS.slice(3, 6);
const testimonialsCol3 = TESTIMONIALS.slice(6, 9);

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
  const goSub = () => navigate(user ? '/subscription' : '/register');

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-card/90 backdrop-blur-xl border-b border-border' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to={user ? '/home' : '/'} className="flex items-center gap-0">
            <OverseezLogo size={96} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none -ml-3">Overseez</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{t('footer.features')}</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">{t('footer.howItWorks')}</a>
            <a href="#reviews" className="hover:text-foreground transition-colors">{t('footer.reviews')}</a>
            {user && <Link to="/dashboard" className="hover:text-foreground transition-colors">{t('nav.dashboard')}</Link>}
            {user && <Link to="/search" className="hover:text-foreground transition-colors">{t('nav.aiAssistant')}</Link>}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
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
        <FloatingOvals />

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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto" onClick={goAI}>
                {t('hero.tryAI')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto" onClick={goSub}>
                {t('hero.seeOptions')}
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-14 sm:mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex flex-wrap justify-center gap-6 sm:gap-12 border border-border/30 bg-card/20 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-5">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={47.2} suffix="%" decimals={1} /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.avgSavings')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight">$<AnimatedCounter end={2340} decimals={0} /></p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('hero.savedPerUser')}</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-display font-bold tracking-tight"><AnimatedCounter end={200} decimals={0} suffix="+" /></p>
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
        <FloatingOvals className="opacity-50" />
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

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-overseez-mid relative overflow-hidden">
        <FloatingOvals className="opacity-30" />
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('features.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('features.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              {t('features.subtitle')}
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_KEYS.map((key, i) => (
              <RevealSection key={key} delay={i * 80}>
                <div className="bg-card border border-border rounded-xl p-6 overseez-card-hover h-full relative overflow-hidden group">
                  <svg className="absolute -bottom-6 -right-6 w-24 h-24 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500" viewBox="0 0 100 100" fill="none">
                    <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="hsl(200 80% 55%)" strokeWidth="4" />
                  </svg>
                  <div className="w-10 h-10 rounded-lg bg-overseez-blue/10 border border-overseez-blue/15 flex items-center justify-center text-overseez-blue mb-4">
                    {FEATURE_ICONS[i]}
                  </div>
                  <h3 className="font-display font-semibold mb-2">{t(`features.${key}`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`features.${key}Desc`)}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={500} className="text-center mt-10">
            <Button variant="hero-outline" size="xl" className="w-full sm:w-auto" onClick={goAI}>
              {t('features.tryAssistant')} <ChevronRight className="w-4 h-4" />
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

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-overseez-mid">
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('testimonials.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
              {t('testimonials.subtitle')}
            </p>
          </RevealSection>
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
            <TestimonialsColumn testimonials={testimonialsCol1} duration={15} className="hidden md:block" />
            <TestimonialsColumn testimonials={testimonialsCol2} duration={19} />
            <TestimonialsColumn testimonials={testimonialsCol3} duration={17} className="hidden lg:block" />
          </div>
        </div>
      </section>

      <section id="reviews" className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <RevealSection className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('feedback.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('feedback.title')}
            </h2>
          </RevealSection>
          <ReviewSection />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <FloatingOvals />
        <RevealSection className="relative z-10">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-card to-overseez-surface border border-border rounded-2xl p-8 sm:p-12 relative overflow-hidden">
            <svg className="absolute -top-12 -right-12 w-48 h-48 opacity-[0.04]" viewBox="0 0 100 100" fill="none">
              <ellipse cx="50" cy="50" rx="38" ry="34" transform="rotate(-18 50 50)" stroke="white" strokeWidth="3" />
            </svg>
            <OverseezLogo size={112} className="mx-auto mb-6 opacity-30" color="white" />
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm sm:text-base">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto" onClick={goAI}>
                {t('hero.tryAI')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto" onClick={goSub}>
                {t('cta.viewPlans')}
              </Button>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── COMMUNITY / SOCIAL ─── */}
      <section className="py-20 px-4 sm:px-6 bg-overseez-mid">
        <div className="max-w-4xl mx-auto text-center">
          <RevealSection>
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">{t('community.label')}</p>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-4">{t('community.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm sm:text-base">{t('community.subtitle')}</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="https://www.instagram.com/overseez.co" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 hover:border-overseez-blue/40 transition-colors group">
                <Instagram className="w-5 h-5 text-overseez-blue" />
                <span className="text-sm font-medium">@overseez.co</span>
              </a>
              <a href="https://www.tiktok.com/@overseez.co" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 hover:border-overseez-blue/40 transition-colors group">
                <svg className="w-5 h-5 text-overseez-blue" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.12V9.01a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.05a8.26 8.26 0 004.77 1.51V7.12a4.83 4.83 0 01-1.01-.43z"/></svg>
                <span className="text-sm font-medium">@overseez.co</span>
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card/50 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Link to={user ? '/home' : '/'} className="flex items-center gap-0">
              <OverseezLogo size={96} color="white" />
              <span className="font-display font-bold -ml-3">Overseez</span>
            </Link>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">{t('footer.features')}</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">{t('footer.howItWorks')}</a>
              <a href="#reviews" className="hover:text-foreground transition-colors">{t('footer.reviews')}</a>
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
