import { useSkiaFrameProcessor } from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { GeoData } from './geoOverlay';
import { useEffect } from 'react';

/**
 * Custom hook that creates a Skia Frame Processor for drawing GPS overlay on video frames
 * @param geoData - Current GPS data to display
 * @param enabled - Whether to draw the overlay
 * @returns Frame processor function
 */
export const useGPSVideoOverlay = (
    geoData: GeoData | null,
    enabled: boolean
) => {
    // Use shared values to pass data to worklet context efficiently
    const latitude = useSharedValue(0);
    const longitude = useSharedValue(0);
    const altitude = useSharedValue(0);
    const speed = useSharedValue(0);
    const placeName = useSharedValue('');
    const dateTime = useSharedValue('');
    const overlayEnabled = useSharedValue(enabled);

    // Update shared values when GPS data changes
    useEffect(() => {
        if (geoData) {
            latitude.value = geoData.latitude;
            longitude.value = geoData.longitude;
            altitude.value = geoData.altitude ?? 0;
            speed.value = geoData.speed ?? 0;
            placeName.value = geoData.placeName;
            dateTime.value = new Date(geoData.dateTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        }
    }, [geoData, latitude, longitude, altitude, speed, placeName, dateTime]);

    useEffect(() => {
        overlayEnabled.value = enabled;
    }, [enabled, overlayEnabled]);

    return useSkiaFrameProcessor((frame) => {
        'worklet';

        // Always render the camera frame first
        frame.render();

        // Skip overlay if disabled or no data
        if (!overlayEnabled.value || latitude.value === 0) return;

        // Configuration
        const padding = 16;
        const overlayHeight = 130;
        const overlayWidth = frame.width - (padding * 2);
        const overlayY = frame.height - overlayHeight - padding - 80; // 80px from bottom for controls

        // Draw semi-transparent black background
        const bgRect = Skia.XYWHRect(padding, overlayY, overlayWidth, overlayHeight);
        const bgRRect = Skia.RRectXY(bgRect, 8, 8);
        const bgPaint = Skia.Paint();
        bgPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.7)'));
        bgPaint.setAntiAlias(true);
        frame.drawRRect(bgRRect, bgPaint);

        // Create text paint
        const textPaint = Skia.Paint();
        textPaint.setColor(Skia.Color('#FFFFFF'));
        textPaint.setAntiAlias(true);


        // Create fonts for different text sizes
        const titleFont = Skia.Font(undefined, 16);
        const dataFont = Skia.Font(undefined, 14);
        const smallFont = Skia.Font(undefined, 12);

        // Draw place name (title)
        if (placeName.value) {
            const titlePaint = Skia.Paint();
            titlePaint.setColor(Skia.Color('#4CAF50'));
            titlePaint.setAntiAlias(true);
            frame.drawText(placeName.value, padding + 12, overlayY + 24, titlePaint, titleFont);
        }

        // Draw GPS coordinates
        const latText = `Lat: ${latitude.value.toFixed(6)}°`;
        const lonText = `Lon: ${longitude.value.toFixed(6)}°`;
        frame.drawText(latText, padding + 12, overlayY + 50, textPaint, dataFont);
        frame.drawText(lonText, padding + 12, overlayY + 70, textPaint, dataFont);

        // Draw altitude and speed on right side
        const altText = `Alt: ${Math.round(altitude.value)}m`;
        const speedKmh = Math.round(speed.value * 3.6); // Convert m/s to km/h
        const speedText = `Speed: ${speedKmh} km/h`;

        frame.drawText(altText, padding + 12, overlayY + 90, textPaint, dataFont);
        frame.drawText(speedText, padding + 12, overlayY + 110, textPaint, dataFont);

        // Draw timestamp in bottom right
        if (dateTime.value) {
            const timeMetrics = smallFont.getMetrics();
            const timeWidth = smallFont.measureText(dateTime.value);
            const timeX = padding + overlayWidth - timeWidth.width - 12;
            frame.drawText(dateTime.value, timeX, overlayY + 110, textPaint, smallFont);
        }

        // Draw GPS icon indicator (small dot)
        const gpsIndicatorPaint = Skia.Paint();
        gpsIndicatorPaint.setColor(Skia.Color('#4CAF50'));
        gpsIndicatorPaint.setAntiAlias(true);
        const indicatorX = padding + overlayWidth - 16;
        const indicatorY = overlayY + 16;
        frame.drawCircle(indicatorX, indicatorY, 4, gpsIndicatorPaint);
    }, [latitude, longitude, altitude, speed, placeName, dateTime, overlayEnabled]);
};
