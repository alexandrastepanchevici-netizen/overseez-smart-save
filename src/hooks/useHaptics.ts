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

  // Double-punch: success notification + heavy impact for big celebrations
  const tapCelebration = async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
      await new Promise(r => setTimeout(r, 120));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
  };

  return { tapLight, tapMedium, tapSuccess, tapCelebration };
}
