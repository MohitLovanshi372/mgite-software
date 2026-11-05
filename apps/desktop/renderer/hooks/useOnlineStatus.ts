/**
 * Hook to track browser online state and backend connectivity.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.ts';

export function useOnlineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [manualOfflineMode, setManualOfflineMode] = useState<boolean>(false);
  const [cloudAiAvailable, setCloudAiAvailable] = useState<boolean>(true);

  const checkConnectivity = useCallback(async () => {
    try {
      const health = await apiService.getHealth();
      setIsBackendHealthy(health.status === 'ok');

      const status = await apiService.getStatus();
      setCloudAiAvailable(status.cloud_ai_available);
      if (status.offline_mode_enforced) {
        setManualOfflineMode(true);
      }
    } catch {
      setIsBackendHealthy(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkConnectivity();
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  const toggleManualOffline = async () => {
    const nextState = !manualOfflineMode;
    setManualOfflineMode(nextState);
    try {
      await apiService.updateConfig({ offline_mode: nextState });
    } catch (e) {
      console.error('Failed to persist offline toggle:', e);
    }
  };

  const isFullyOnline = isBrowserOnline && isBackendHealthy && !manualOfflineMode && cloudAiAvailable;

  return {
    isOnline: isFullyOnline,
    isBrowserOnline,
    isBackendHealthy,
    manualOfflineMode,
    cloudAiAvailable,
    toggleManualOffline,
    refreshStatus: checkConnectivity,
  };
}
