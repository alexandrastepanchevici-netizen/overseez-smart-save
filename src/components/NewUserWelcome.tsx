import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTipsForCountry } from '@/data/countryTips';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'overseez_welcome_shown';

export default function NewUserWelcome() {
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) {
      // Slight delay so the dashboard renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [user]);

  if (!visible) return null;

  const countryCode = (profile as any)?.country_code || (profile as any)?.cc || 'GB';
  const tips = getTipsForCountry(countryCode);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold">Welcome to Overseez!</h2>
            <p className="text-sm text-muted-foreground mt-1">Here are some quick tips for saving in your area:</p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 bg-muted/40 rounded-xl p-3">
              <span className="text-overseez-blue font-bold text-sm flex-shrink-0">{i + 1}.</span>
              <p className="text-sm text-foreground/90 leading-snug">{tip}</p>
            </div>
          ))}
        </div>

        <Button onClick={handleDismiss} variant="hero" className="w-full">
          Let's start saving!
        </Button>
      </div>
    </div>
  );
}
