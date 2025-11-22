import { useEffect, useRef, useState, useCallback } from 'react';
import { VolumeManager } from 'react-native-volume-manager';

interface UseVolumeZoomProps {
    enabled: boolean;
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
    onZoomChange?: (zoom: number) => void;
}

/**
 * Custom hook to control camera zoom using volume buttons
 * Properly detects volume up/down to increase/decrease zoom
 */
export function useVolumeZoom({
    enabled,
    minZoom = 1,
    maxZoom = 10,
    zoomStep = 0.5,
    onZoomChange,
}: UseVolumeZoomProps) {
    const [zoom, setZoom] = useState<number>(minZoom);
    const previousVolumeRef = useRef<number | null>(null);
    const volumeListenerRef = useRef<any>(null);

    const updateZoom = useCallback((newZoom: number) => {
        const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
        setZoom(clampedZoom);
        onZoomChange?.(clampedZoom);
    }, [minZoom, maxZoom, onZoomChange]);

    useEffect(() => {
        if (!enabled) {
            // Clean up and restore native volume UI
            if (volumeListenerRef.current) {
                volumeListenerRef.current.remove();
                volumeListenerRef.current = null;
            }
            VolumeManager.showNativeVolumeUI({ enabled: true });
            previousVolumeRef.current = null;
            return;
        }

        // Initialize volume tracking
        const initializeVolumeTracking = async () => {
            try {
                // Hide native volume UI
                await VolumeManager.showNativeVolumeUI({ enabled: false });

                // Get initial volume
                const initialVolume = await VolumeManager.getVolume();
                previousVolumeRef.current = initialVolume.volume;

                // Add volume listener
                volumeListenerRef.current = VolumeManager.addVolumeListener((result) => {
                    const currentVolume = result.volume;

                    if (previousVolumeRef.current !== null) {
                        const volumeDelta = currentVolume - previousVolumeRef.current;

                        // Determine zoom direction based on volume change
                        if (Math.abs(volumeDelta) > 0.001) { // Threshold to avoid floating point issues
                            if (volumeDelta > 0) {
                                // Volume Up -> Zoom In
                                setZoom((prevZoom) => {
                                    const newZoom = Math.min(maxZoom, prevZoom + zoomStep);
                                    onZoomChange?.(newZoom);
                                    return newZoom;
                                });
                            } else {
                                // Volume Down -> Zoom Out
                                setZoom((prevZoom) => {
                                    const newZoom = Math.max(minZoom, prevZoom - zoomStep);
                                    onZoomChange?.(newZoom);
                                    return newZoom;
                                });
                            }

                            // Restore volume to previous level to keep it constant
                            setTimeout(() => {
                                VolumeManager.setVolume(previousVolumeRef.current!, {
                                    showUI: false,
                                    playSound: false,
                                });
                            }, 50);
                        }
                    }

                    previousVolumeRef.current = currentVolume;
                });
            } catch (error) {
                console.error('Failed to initialize volume tracking:', error);
            }
        };

        initializeVolumeTracking();

        // Cleanup
        return () => {
            if (volumeListenerRef.current) {
                volumeListenerRef.current.remove();
                volumeListenerRef.current = null;
            }
            VolumeManager.showNativeVolumeUI({ enabled: true });
            previousVolumeRef.current = null;
        };
    }, [enabled, minZoom, maxZoom, zoomStep, onZoomChange]);

    return {
        zoom,
        setZoom: updateZoom,
    };
}
