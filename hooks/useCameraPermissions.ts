import { useState, useEffect, useCallback } from 'react';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';

/**
 * Consolidated permissions hook for camera app
 */
export function useCameraPermissions() {
    const { hasPermission: cameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: microphonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions({
        granularPermissions: ['photo', 'video']
    });
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [allPermissionsGranted, setAllPermissionsGranted] = useState<boolean>(false);

    // Check if all permissions are granted
    useEffect(() => {
        const allGranted =
            cameraPermission &&
            microphonePermission &&
            locationPermission?.granted &&
            mediaLibraryPermission?.granted;

        setAllPermissionsGranted(!!allGranted);
    }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission]);

    // Request camera permission on mount if not granted
    useEffect(() => {
        if (!cameraPermission) {
            requestCameraPermission();
        }
    }, [cameraPermission, requestCameraPermission]);

    const requestAllPermissions = useCallback(async () => {
        if (!cameraPermission) await requestCameraPermission();
        if (!microphonePermission) await requestMicrophonePermission();
        if (!locationPermission?.granted) await requestLocationPermission();
        if (!mediaLibraryPermission?.granted) await requestMediaLibraryPermission();
    }, [
        cameraPermission,
        microphonePermission,
        locationPermission,
        mediaLibraryPermission,
        requestCameraPermission,
        requestMicrophonePermission,
        requestLocationPermission,
        requestMediaLibraryPermission,
    ]);

    return {
        cameraPermission,
        microphonePermission,
        locationPermission,
        mediaLibraryPermission,
        allPermissionsGranted,
        requestAllPermissions,
    };
}
