import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import OverseezLogo from '@/components/OverseezLogo';
import { Search, MapPin, TrendingDown, Shield, Zap, Globe, Star, ArrowRight, ChevronRight, Instagram } from 'lucide-react';

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

const REVIEWS = [
  { name: 'Amara K.', loc: 'London, UK', text: 'Overseez helped me find groceries 30% cheaper just two streets away. I save about £47 a week now.', stars: 5 },
  { name: 'Daniel M.', loc: 'Berlin, DE', text: 'As an exchange student, the bank fee calculator alone is worth it. I avoided €200 in hidden charges.', stars: 5 },
  { name: 'Sofia R.', loc: 'Barcelona, ES', text: 'The AI comparison is surprisingly accurate. I use it every time I travel to find the best local prices.', stars: 5 },
  { name: 'Kwame A.', loc: 'Accra, GH', text: 'Finally a finance tool that actually works for everyday shopping. The savings tracker keeps me motivated.', stars: 4 },
  { name: 'Yuki T.', loc: 'Tokyo, JP', text: 'The location-based search changed how I shop abroad. Clean UI, fast results, and real savings.', stars: 5 },
  { name: 'Liam O.', loc: 'Dublin, IE', text: 'I was sceptical at first, but in three months I\'ve tracked over €380 in savings. The data doesn\'t lie.', stars: 5 },
];

const FEATURES = [
  { icon: <Search className="w-5 h-5" />, title: 'AI Price Comparison', desc: 'Get the top 5 cheapest options near you for anything — groceries, petrol, coffee, hotels.' },
  { icon: <MapPin className="w-5 h-5" />, title: 'Location-Aware', desc: 'Results adjust to your exact location with Google Maps links to every recommendation.' },
  { icon: <TrendingDown className="w-5 h-5" />, title: 'Savings Tracker', desc: 'Log what you spend and watch your savings grow with milestone rewards and analytics.' },
  { icon: <Shield className="w-5 h-5" />, title: 'Bank Fee Calculator', desc: 'Enter your bank and see the true cost of purchases abroad with overseas fee breakdowns.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Sale Alerts', desc: 'Active sales and promotions are merged into your search results automatically.' },
  { icon: <Globe className="w-5 h-5" />, title: 'Works Globally', desc: 'From London to Tokyo — Overseez adapts to local currencies, stores, and pricing.' },
];

const STEPS = [
  { num: '01', title: 'Search anything', desc: 'Type what you need — groceries, petrol, a hotel room. Our AI processes your query instantly.' },
  { num: '02', title: 'Compare prices', desc: 'See the top 5 cheapest options ranked by real price, with distance, sales, and bank fees factored in.' },
  { num: '03', title: 'Save & track', desc: 'Log your purchase and we calculate your saving vs the average. Watch your total grow over time.' },
];

const PAIN_QUOTES = [
  "You're not overspending. You're being overcharged.",
  "Most people lose money before they even realize it.",
  "The 'foreigner tax' is real — and it costs you hundreds every month.",
];

export default function Index() {
  const { user } = useAuth();
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
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <Link to={user ? '/home' : '/'} className="flex items-center gap-2">
            <OverseezLogo size={30} color="white" />
            <span className="font-display text-xl font-bold tracking-tight">Overseez</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#reviews" className="hover:text-foreground transition-colors">Reviews</a>
            {user && <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>}
            {user && <Link to="/search" className="hover:text-foreground transition-colors">AI Assistant</Link>}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="hero" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="sm">Sign Up Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overseez-gradient-hero" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-[0.06] animate-float" style={{ background: 'radial-gradient(circle, hsl(200 80% 55%) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-[0.04] animate-float-delayed" style={{ background: 'radial-gradient(circle, hsl(185 70% 55%) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-24 pb-16">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-muted/20 border border-border/50 rounded-full px-4 py-1.5 mb-8 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-overseez-green animate-pulse" />
              AI-powered price intelligence
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] mb-6">
              Stop paying the{' '}
              <span className="overseez-text-gradient">foreigner tax.</span>{' '}
              Start saving instantly.
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Every day you overpay for groceries, coffee, and transport — simply because you don't know the local prices. Overseez uses AI to find the cheapest options near you, in your currency, so you stop guessing and start keeping your money.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group" onClick={goAI}>
                Try AI Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl" onClick={goSub}>
                See Cheaper Options
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="inline-flex flex-wrap justify-center gap-8 sm:gap-16 border border-border/30 bg-card/20 backdrop-blur-sm rounded-2xl px-8 py-5">
              <Stat value="47.2%" label="avg. savings" />
              <Stat value="£1,847" label="saved per user" />
              <Stat value="32" label="countries" />
              <Stat value="4.9★" label="user rating" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20">
          <OverseezLogo size={48} color="white" />
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4 bg-overseez-mid">
        <div className="max-w-4xl mx-auto">
          <RevealSection className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-overseez-red font-medium mb-3">The problem</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Living abroad costs more than it should.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You pay more for the same products. You get hit with hidden bank fees. You don't know what a fair price looks like. That uncertainty costs real money — every single day.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PAIN_QUOTES.map((q, i) => (
              <RevealSection key={i} delay={i * 100}>
                <div className="bg-card border border-overseez-red/15 rounded-xl p-6 text-center">
                  <p className="text-lg font-display font-bold leading-snug">"{q}"</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={300} className="text-center mt-10">
            <Button variant="hero" size="xl" className="group" onClick={goAI}>
              Start Saving <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </RevealSection>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Built for people who refuse to overpay
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              AI-powered price comparison, overseas bank fee tracking, and savings analytics — all adjusted to your currency.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <RevealSection key={f.title} delay={i * 80}>
                <div className="bg-card border border-border rounded-xl p-6 overseez-card-hover h-full">
                  <div className="w-10 h-10 rounded-lg bg-overseez-blue/10 border border-overseez-blue/15 flex items-center justify-center text-overseez-blue mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-display font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={500} className="text-center mt-10">
            <Button variant="hero-outline" size="xl" onClick={goAI}>
              Try AI Assistant <ChevronRight className="w-4 h-4" />
            </Button>
          </RevealSection>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-overseez-mid">
        <div className="max-w-4xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Three steps to smarter spending
            </h2>
          </RevealSection>

          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <RevealSection key={s.num} delay={i * 120}>
                <div className="flex gap-6 items-start bg-card border border-border rounded-xl p-6 overseez-card-hover">
                  <span className="text-4xl font-display font-bold text-overseez-blue/20 flex-shrink-0 w-16">{s.num}</span>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealSection className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Real people. Real savings. No fluff.
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((r, i) => (
              <RevealSection key={r.name} delay={i * 80}>
                <div className="bg-card border border-border rounded-xl p-6 overseez-card-hover h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-4 h-4 ${si < r.stars ? 'text-overseez-gold fill-overseez-gold' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed flex-1 mb-4">"{r.text}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <div className="w-9 h-9 rounded-full bg-overseez-blue/15 flex items-center justify-center text-xs font-bold text-overseez-blue">
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.loc}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <RevealSection>
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-card to-overseez-surface border border-border rounded-2xl p-12">
            <OverseezLogo size={48} className="mx-auto mb-6 opacity-40" color="white" />
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Your money deserves better.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Stop overpaying. Stop guessing. Start using AI to find cheaper options in seconds — in your currency, near your location. Free to start.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group" onClick={goAI}>
                Try AI Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="hero-outline" size="xl" onClick={goSub}>
                View Plans
              </Button>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* Social / Community */}
      <section className="py-20 px-4 bg-overseez-mid">
        <div className="max-w-4xl mx-auto text-center">
          <RevealSection>
            <p className="text-xs uppercase tracking-widest text-overseez-blue font-medium mb-3">Community</p>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-4">Join the movement</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">Follow us for savings tips, real user stories, and product updates.</p>
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

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2">
              <OverseezLogo size={24} color="white" />
              <span className="font-display font-bold">Overseez</span>
            </Link>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
              <a href="#reviews" className="hover:text-foreground transition-colors">Reviews</a>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 text-xs text-muted-foreground/60">
            © 2026 Overseez. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl sm:text-2xl font-display font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
