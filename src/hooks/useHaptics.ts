import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function useHaptics() {
  const isNative = Capacitor.isNativePlatform();

  const tapLight = async () => {
    if (!isNative) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
  };

  const tapMedium = async () => {
    if (!isNative) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
  };

  const tapSuccess = async () => {
    if (!isNative) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
  };

  return { tapLight, tapMedium, tapSuccess };
}
