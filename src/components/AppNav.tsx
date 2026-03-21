import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, LayoutDashboard, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import OverseezLogo from '@/components/OverseezLogo';

export default function AppNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/dashboard" className="flex items-center gap-2">
          <OverseezLogo size={28} color="white" />
          <span className="font-display text-lg font-bold tracking-tight">Overseez</span>
        </Link>

        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors text-sm">
            <div className="w-7 h-7 rounded-full bg-overseez-blue/20 flex items-center justify-center">
              <User className="w-4 h-4 text-overseez-blue" />
            </div>
            <span className="hidden sm:inline text-muted-foreground">
              {profile?.nickname || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                <Link to="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" /> Profile
                </Link>
                <Link to="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Dashboard
                </Link>
                <Link to="/subscription" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <CreditCard className="w-4 h-4 text-muted-foreground" /> Subscription
                </Link>
                <div className="border-t border-border my-1" />
                <button onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left text-overseez-red">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
