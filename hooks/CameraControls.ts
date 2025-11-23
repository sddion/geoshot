import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import type { FocusPoint } from '@/types/camera';
import { VolumeManager } from 'react-native-volume-manager';
import type { VolumeAction } from '@/contexts/CameraSettingsContext';

/**
 * Custom hook for managing camera zoom and focus controls
 */
export function useCameraControls(
    volumeAction: VolumeAction = 'shutter',
    onCapture?: () => void
) {
    const [zoom, setZoom] = useState<number>(1); // Start at 1x
    const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
    const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
    const focusAnimation = useRef(new Animated.Value(0)).current;
    const zoomSliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previousVolumeRef = useRef<number | null>(null);
    const volumeListenerRef = useRef<any>(null);
    const lastCaptureTimeRef = useRef<number>(0); // For debouncing captures
    const isCapturingRef = useRef<boolean>(false); // Track ongoing captures
    const CAPTURE_DEBOUNCE_MS = 800; // Minimum time between captures (increased for better prevention)

    // Volume button listener
    useEffect(() => {
        if (volumeAction === 'off') {
            // Clean up
            if (volumeListenerRef.current) {
                volumeListenerRef.current.remove();
                volumeListenerRef.current = null;
            }
            VolumeManager.showNativeVolumeUI({ enabled: true });
            previousVolumeRef.current = null;
            return;
        }

        const initializeVolumeListener = async () => {
            try {
                // Hide native volume UI
                await VolumeManager.showNativeVolumeUI({ enabled: false });

                // Get initial volume
                const initialVolume = await VolumeManager.getVolume();
                previousVolumeRef.current = initialVolume.volume;

                // Add volume listener
                volumeListenerRef.current = VolumeManager.addVolumeListener((result) => {
                    const currentVolume = result.volume;

                    if (volumeAction === 'shutter') {
                        // Debounce to prevent multiple rapid captures
                        const now = Date.now();
                        if (now - lastCaptureTimeRef.current < CAPTURE_DEBOUNCE_MS || isCapturingRef.current) {
                            // Too soon or already capturing, ignore this capture
                            return;
                        }
                        lastCaptureTimeRef.current = now;
                        isCapturingRef.current = true;

                        // Trigger capture on any volume change
                        onCapture?.();

                        // Reset capturing flag after debounce period
                        setTimeout(() => {
                            isCapturingRef.current = false;
                        }, CAPTURE_DEBOUNCE_MS);

                        // Restore volume
                        setTimeout(() => {
                            if (previousVolumeRef.current !== null) {
                                VolumeManager.setVolume(previousVolumeRef.current, {
                                    showUI: false,
                                    playSound: false,
                                });
                            }
                        }, 50);
                    } else if (volumeAction === 'zoom') {
                        // Detect zoom direction - ONLY zoom, do not capture
                        if (previousVolumeRef.current !== null) {
                            const volumeDelta = currentVolume - previousVolumeRef.current;

                            if (Math.abs(volumeDelta) > 0.001) {
                                if (volumeDelta > 0) {
                                    // Volume Up -> Zoom In
                                    setZoom((prev) => Math.min(10, prev + 0.5));
                                } else {
                                    // Volume Down -> Zoom Out
                                    setZoom((prev) => Math.max(1, prev - 0.5));
                                }

                                // Restore volume to keep it constant
                                setTimeout(() => {
                                    if (previousVolumeRef.current !== null) {
                                        VolumeManager.setVolume(previousVolumeRef.current, {
                                            showUI: false,
                                            playSound: false,
                                        });
                                    }
                                }, 50);
                            }
                        }
                    }

                    previousVolumeRef.current = currentVolume;
                });
            } catch (error) {
                console.error('Failed to initialize volume listener:', error);
            }
        };

        initializeVolumeListener();

        return () => {
            if (volumeListenerRef.current) {
                volumeListenerRef.current.remove();
                volumeListenerRef.current = null;
            }
            VolumeManager.showNativeVolumeUI({ enabled: true });
            previousVolumeRef.current = null;
        };
    }, [volumeAction, onCapture]);

    const handleZoomButtonTap = useCallback(() => {
        setShowZoomSlider(!showZoomSlider);

        // Auto-hide slider after 1 seconds of inactivity
        if (zoomSliderTimeout.current) {
            clearTimeout(zoomSliderTimeout.current);
        }
        if (!showZoomSlider) {
            zoomSliderTimeout.current = setTimeout(() => {
                setShowZoomSlider(false);
            }, 1000);
        }
    }, [showZoomSlider]);

    const handleZoomSliderChange = useCallback((value: number) => {
        // Map 0-1 slider to 1-10 zoom range
        // value 0 -> 1x
        // value 1 -> 10x
        const zoomValue = 1 + (value * 9);
        setZoom(Math.max(1, Math.min(10, zoomValue)));

        // Reset auto-hide timer
        if (zoomSliderTimeout.current) {
            clearTimeout(zoomSliderTimeout.current);
        }
        zoomSliderTimeout.current = setTimeout(() => {
            setShowZoomSlider(false);
        }, 1000);
    }, []);

    const handleFocusTap = useCallback((point: FocusPoint) => {
        setFocusPoint(point);

        // Animate focus indicator
        Animated.sequence([
            Animated.timing(focusAnimation, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(focusAnimation, {
                toValue: 0,
                duration: 200,
                delay: 800,
                useNativeDriver: true,
            }),
        ]).start(() => setFocusPoint(null));
    }, [focusAnimation]);

    return {
        zoom,
        setZoom,
        showZoomSlider,
        handleZoomButtonTap,
        handleZoomSliderChange,
        focusPoint,
        focusAnimation,
        handleFocusTap,
    };
}
