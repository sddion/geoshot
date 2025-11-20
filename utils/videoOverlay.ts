import { GeoData } from './geoOverlay';

/**
 * Formats GPS data for overlay display on video frames
 */
export const formatGPSOverlay = (geoData: GeoData) => {
  return {
    location: `${geoData.latitude.toFixed(6)}°, ${geoData.longitude.toFixed(6)}°`,
    altitude: `${Math.round(geoData.altitude ?? 0)}m`,
    speed: `${Math.round((geoData.speed ?? 0) * 3.6)}km/h`,
    timestamp: new Date(geoData.dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    placeName: geoData.placeName,
  };
};

/**
 * Creates overlay configuration for frame processor
 */
export const createOverlayConfig = (geoData: GeoData, frameWidth: number, frameHeight: number) => {
  return {
    gpsData: formatGPSOverlay(geoData),
    dimensions: { width: frameWidth, height: frameHeight },
    position: {
      x: 20,
      y: frameHeight - 140,
    },
    style: {
      fontSize: 14,
      fontColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 12,
      borderRadius: 8,
    },
  };
};

/**
 * Exports overlay rendering data for use in video recording with Skia/VisionCamera
 */
export const exportOverlayData = (geoData: GeoData, frameWidth: number, frameHeight: number) => {
  const config = createOverlayConfig(geoData, frameWidth, frameHeight);
  return {
    isValid: true,
    data: config,
    timestamp: new Date().toISOString(),
  };
};
