import React, { useState } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, LayoutDashboard, CreditCard, LogOut, ChevronDown, Search, Home } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useHaptics } from '@/hooks/useHaptics';

const NAV_LINKS = [
  { to: '/home', labelKey: 'nav.home', icon: Home },
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/search', labelKey: 'nav.aiAssistant', icon: Search },
  { to: '/subscription', labelKey: 'nav.subscription', icon: CreditCard },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
];

export default function AppNav() {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { tapLight } = useHaptics();

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/dashboard" className="flex items-center gap-0">
            <OverseezLogo size={96} color="white" />
            <span className="font-display text-lg font-bold tracking-tight leading-none -ml-3">Overseez</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                  <link.icon className="w-3.5 h-3.5" />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <div className="relative">
              <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors text-sm">
                <div className="w-7 h-7 rounded-full bg-overseez-blue/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-overseez-blue" />
                </div>
                <span className="hidden sm:inline text-muted-foreground">
                  {profile?.nickname || t('nav.account')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                  {/* Logout only — nav links are in the bottom tab bar on mobile */}
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left text-overseez-red">
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom tab bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <LayoutGroup>
          <div className="flex items-center justify-around h-16">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} onClick={() => tapLight()}
                  className={`relative flex flex-col items-center gap-1 px-3 py-2 transition-colors ${active ? 'text-overseez-blue' : 'text-muted-foreground'}`}>
                  {active && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-0 right-0 h-0.5 bg-overseez-blue rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <link.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{t(link.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </>
  );
}
