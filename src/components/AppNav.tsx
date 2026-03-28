import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, LayoutDashboard, CreditCard, LogOut, ChevronDown, Search, Home } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
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
                {/* Mobile-only nav links */}
                <div className="md:hidden border-b border-border pb-1 mb-1">
                  {NAV_LINKS.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <link.icon className="w-4 h-4 text-muted-foreground" /> {t(link.labelKey)}
                    </Link>
                  ))}
                </div>
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
  );
}
