import { useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { GeoData } from './geoOverlay';

/**
 * Simplified frame processor factory - returns overlay data for external rendering
 * This works with VisionCamera frame processors but focuses on data, not pixel manipulation
 */
export const createGPSOverlayProcessor = (geoData: GeoData | null) => {
  return {
    isEnabled: !!geoData,
    overlayData: geoData
      ? {
          location: `${geoData.latitude.toFixed(6)}°, ${geoData.longitude.toFixed(6)}°`,
          altitude: `${Math.round(geoData.altitude ?? 0)}m`,
          speed: `${Math.round((geoData.speed ?? 0) * 3.6)}km/h`,
          timestamp: new Date(geoData.dateTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          placeName: geoData.placeName,
          address: geoData.address,
          plusCode: geoData.plusCode,
        }
      : null,
  };
};

/**
 * Hook for managing frame processor state
 */
export const useFrameProcessorState = () => {
  const isProcessing = useSharedValue(false);

  const setProcessing = useCallback((value: boolean) => {
    'worklet';
    isProcessing.value = value;
  }, [isProcessing]);

  return {
    isProcessing,
    setProcessing,
  };
};
