import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

    // 9A: Show toast for FCM messages received while app is in foreground
    const messageListenerPromise = FirebaseMessaging.addListener(
      'notificationReceived',
      (event) => {
        const { title, body } = event.notification;
        if (title || body) {
          toast(title || 'Overseez', {
            description: body,
            duration: 5000,
          });
        }
      }
    );

    // 9C: Deep-link routing when user taps a notification
    const actionListenerPromise = FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (event) => {
        const data = event.notification.data as Record<string, string> | undefined;
        const route = data?.route;
        if (route) window.location.hash = route;
      }
    );

    return () => {
      messageListenerPromise.then((l) => l.remove()).catch(() => {});
      actionListenerPromise.then((l) => l.remove()).catch(() => {});
    };
  }, [user]);
}

/**
 * Call after a successful save to optionally send a savings-confirmation
 * local toast (web) or trigger a FCM data message (native handled above).
 */
export function notifySaved(storeName: string, amount: string) {
  // On web / during dev, show an in-app toast as a stand-in
  if (!Capacitor.isNativePlatform()) {
    toast.success(`Saved at ${storeName}`, { description: `You saved ${amount}` });
  }
  // On native the FCM message sent by the Edge Function will display via the listener above
}
