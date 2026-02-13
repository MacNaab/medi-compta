import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Global online status for non-React code
let globalOnlineCallback: ((online: boolean) => void) | null = null;

export const setGlobalOnlineCallback = (callback: ((online: boolean) => void) | null) => {
  globalOnlineCallback = callback;
};

export const notifyOnlineStatusChange = (online: boolean) => {
  globalOnlineCallback?.(online);
};

// Initialize global listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notifyOnlineStatusChange(true));
  window.addEventListener('offline', () => notifyOnlineStatusChange(false));
}
