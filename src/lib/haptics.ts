/**
 * iOS & Web Native Haptic Feedback controller
 * Works smoothly on iOS standalone PWAs, Web platforms, and Capacitor native platforms.
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (typeof window === 'undefined' || !window.navigator) return;

  try {
    // Fallback if running via Capacitor native engine
    const cap = (window as any).Capacitor;
    if (cap && cap.isPluginAvailable('Haptics')) {
      const haptics = cap.Plugins.Haptics;
      if (type === 'success') {
        haptics.notification({ type: 'SUCCESS' });
      } else if (type === 'warning') {
        haptics.notification({ type: 'WARNING' });
      } else if (type === 'error') {
        haptics.notification({ type: 'ERROR' });
      } else {
        haptics.impact({ style: type.toUpperCase() });
      }
      return;
    }

    // Standard HTML5 Vibrate API fallback
    if ('vibrate' in navigator) {
      if (type === 'light') {
        navigator.vibrate(15);
      } else if (type === 'medium') {
        navigator.vibrate(30);
      } else if (type === 'heavy') {
        navigator.vibrate(50);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 15]);
      } else if (type === 'warning') {
        navigator.vibrate([35, 50, 35]);
      } else if (type === 'error') {
        navigator.vibrate([60, 100, 60]);
      }
    }
  } catch (error) {
    console.debug('Haptics error bypassed gracefully:', error);
  }
}
