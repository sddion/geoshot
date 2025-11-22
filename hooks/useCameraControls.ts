import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated, Platform } from 'react-native';
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

    // Volume button listener
    useEffect(() => {
        if (volumeAction === 'off') return;

        // Enable volume listener
        VolumeManager.showNativeVolumeUI({ enabled: false }); // Hide system UI

        const listener = VolumeManager.addVolumeListener((result) => {
            if (volumeAction === 'shutter') {
                // Trigger capture on any volume change
                onCapture?.();
            } else if (volumeAction === 'zoom') {
                // Adjust zoom based on volume direction (this is tricky as we only get new volume)
                // Simple zoom step for volume press
                setZoom(prev => Math.min(prev + 0.5, 10));
            }
        });

        return () => {
            listener.remove();
            VolumeManager.showNativeVolumeUI({ enabled: true }); // Restore system UI
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
