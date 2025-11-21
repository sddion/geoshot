import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { usePermissions, PermissionStatus } from 'expo-media-library';

interface PermissionsScreenProps {
    onAllPermissionsGranted: () => void;
}

export default function PermissionsScreen({ onAllPermissionsGranted }: PermissionsScreenProps) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [backgroundLocationPermission, requestBackgroundLocationPermission] = Location.useBackgroundPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = usePermissions();

    const checkAndRequestPermissions = useCallback(async () => {
        const cameraGranted = cameraPermission?.granted;
        const micGranted = microphonePermission?.granted;
        const locationGranted = locationPermission?.granted;
        const backgroundLocationGranted = backgroundLocationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.status === PermissionStatus.GRANTED;

        if (cameraGranted && micGranted && locationGranted && mediaGranted) {
            onAllPermissionsGranted();
            return;
        }

        // Request permissions one by one
        if (!cameraGranted && cameraPermission?.canAskAgain) {
            await requestCameraPermission();
        }
        if (!micGranted && microphonePermission?.canAskAgain) {
            await requestMicrophonePermission();
        }
        if (!locationGranted && locationPermission?.canAskAgain) {
            const result = await requestLocationPermission();
            // If foreground granted, request background immediately
            if (result.granted && backgroundLocationPermission?.canAskAgain) {
                await requestBackgroundLocationPermission();
            }
        } else if (locationGranted && !backgroundLocationGranted && backgroundLocationPermission?.canAskAgain) {
            // If foreground already granted but background not, request background
            await requestBackgroundLocationPermission();
        }

        if (!mediaGranted && mediaLibraryPermission?.canAskAgain !== false) {
            await requestMediaLibraryPermission();
        }
    }, [cameraPermission, microphonePermission, locationPermission, backgroundLocationPermission, mediaLibraryPermission, requestCameraPermission, requestMicrophonePermission, requestLocationPermission, requestBackgroundLocationPermission, requestMediaLibraryPermission, onAllPermissionsGranted]);

    // Auto-request permissions on mount
    useEffect(() => {
        checkAndRequestPermissions();
    }, [checkAndRequestPermissions]);

    // Check permissions when they change
    useEffect(() => {
        const cameraGranted = cameraPermission?.granted;
        const micGranted = microphonePermission?.granted;
        const locationGranted = locationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.status === PermissionStatus.GRANTED;

        if (cameraGranted && micGranted && locationGranted && mediaGranted) {
            onAllPermissionsGranted();
        }
    }, [cameraPermission?.granted, microphonePermission?.granted, locationPermission?.granted, mediaLibraryPermission?.status, onAllPermissionsGranted]);

    // Re-check when app comes to foreground (in case user changed settings)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAndRequestPermissions();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkAndRequestPermissions]);

    // Return nothing - just handle permissions in background
    return null;
}
