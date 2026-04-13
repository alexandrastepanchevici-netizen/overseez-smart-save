import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    CapApp.addListener('appUrlOpen', async ({ url }) => {
      // Handle Supabase auth callback (email confirmation)
      if (url.includes('auth/callback')) {
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) navigate('/dashboard');
          }
        } catch {
          // ignore malformed URLs
        }
      }
    });

    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

  return null;
}
