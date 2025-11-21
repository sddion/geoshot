import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import type { FocusPoint } from '@/types/camera';

/**
 * Custom hook for managing camera zoom and focus controls
 */
export function useCameraControls() {
    const [zoom, setZoom] = useState<number>(0); // 0-1 normalized
    const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
    const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
    const focusAnimation = useRef(new Animated.Value(0)).current;
    const zoomSliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // Map 0-1 slider to 0.5-10 zoom range
        const zoomValue = 0.5 + (value * 9.5);
        setZoom(Math.min(1, zoomValue / 10)); // Normalize to 0-1

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
