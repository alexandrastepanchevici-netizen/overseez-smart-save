import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const register = async () => {
      const { receive } = await FirebaseMessaging.requestPermissions();
      if (receive !== 'granted') return;

      const { token } = await FirebaseMessaging.getToken();
      if (!token) return;

      await supabase.from('device_tokens').upsert(
        { user_id: user.id, token, platform: 'android' },
        { onConflict: 'token' }
      );
    };

    register().catch(console.error);

    const actionListenerPromise = FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (event) => {
        const data = event.notification.data as Record<string, string> | undefined;
        const route = data?.route;
        if (route) window.location.hash = route;
      }
    );

    return () => {
      actionListenerPromise.then((l) => l.remove()).catch(() => {});
    };
  }, [user]);
}
