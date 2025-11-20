import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';

const isExpoGo = (typeof expo !== 'undefined' && globalThis.expo?.modules?.ExponentConstants?.executionEnvironment === 'STORE_CLIENT') ||
    (Constants?.expoConfig?.extra?.eas?.projectId == null && Constants?.appOwnership === 'expo');

// Custom hook to handle media library permissions differently in Expo Go
const useMediaLibraryPermissions = (): [MediaLibrary.PermissionResponse | null, () => Promise<MediaLibrary.PermissionResponse>] => {
    const [permission, requestPermission] = MediaLibrary.usePermissions({
        granularPermissions: ['photo', 'video']
    });

    // In Expo Go, return a mock permission object without calling the real hook
    if (isExpoGo) {
        const mockResponse: MediaLibrary.PermissionResponse = {
            granted: true,
            canAskAgain: true,
            status: MediaLibrary.PermissionStatus.GRANTED,
            expires: 'never',
            accessPrivileges: 'all'
        };
        return [mockResponse, async () => mockResponse];
    }

    return [permission, requestPermission];
};

interface PermissionsScreenProps {
    onAllPermissionsGranted: () => void;
}

export default function PermissionsScreen({ onAllPermissionsGranted }: PermissionsScreenProps) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();

    const checkAndRequestPermissions = useCallback(async () => {
        // Check all statuses
        const cameraGranted = cameraPermission?.granted;
        const micGranted = microphonePermission?.granted;
        const locationGranted = locationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.granted;

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
            await requestLocationPermission();
        }
        if (!mediaGranted && mediaLibraryPermission?.canAskAgain) {
            await requestMediaLibraryPermission();
        }
    }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission, requestCameraPermission, requestMicrophonePermission, requestLocationPermission, requestMediaLibraryPermission, onAllPermissionsGranted]);

    // Auto-request permissions on mount
    useEffect(() => {
        checkAndRequestPermissions();
    }, [checkAndRequestPermissions]);

    // Check permissions when they change
    useEffect(() => {
        const cameraGranted = cameraPermission?.granted;
        const micGranted = microphonePermission?.granted;
        const locationGranted = locationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.granted;

        if (cameraGranted && micGranted && locationGranted && mediaGranted) {
            onAllPermissionsGranted();
        }
    }, [cameraPermission?.granted, microphonePermission?.granted, locationPermission?.granted, mediaLibraryPermission?.granted, onAllPermissionsGranted]);

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
