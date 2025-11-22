import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import { usePermissions as useMediaLibraryPermissions, PermissionStatus } from 'expo-media-library';

export interface PermissionState {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    mediaLibrary: boolean;
    allGranted: boolean;
    isRequesting: boolean;
}

/**
 * Custom hook for automatically requesting app permissions one by one
 * Similar to how standard apps request permissions
 */
export function useAutoPermissions() {
    const [permissionState, setPermissionState] = useState<PermissionState>({
        camera: false,
        microphone: false,
        location: false,
        mediaLibrary: false,
        allGranted: false,
        isRequesting: false,
    });

    const [locationPermission, requestLocation] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibrary] = useMediaLibraryPermissions();
    const hasRequestedRef = useRef(false);

    /**
     * Check all permission statuses
     */
    const checkPermissions = useCallback(async () => {
        const cameraStatus = await Camera.getCameraPermissionStatus();
        const micStatus = await Camera.getMicrophonePermissionStatus();
        const locationGranted = locationPermission?.granted ?? false;
        const mediaGranted = mediaLibraryPermission?.status === PermissionStatus.GRANTED;

        const newState = {
            camera: cameraStatus === 'granted',
            microphone: micStatus === 'granted',
            location: locationGranted,
            mediaLibrary: mediaGranted,
            allGranted: false,
            isRequesting: false,
        };

        newState.allGranted = newState.camera && newState.microphone && newState.location && newState.mediaLibrary;

        setPermissionState(newState);
        return newState;
    }, [locationPermission, mediaLibraryPermission]);

    /**
     * Request permissions sequentially, one by one
     */
    const requestPermissionsSequentially = useCallback(async () => {
        if (hasRequestedRef.current) return;
        hasRequestedRef.current = true;

        setPermissionState(prev => ({ ...prev, isRequesting: true }));

        try {
            // 1. Request Camera Permission
            const currentCamera = await Camera.getCameraPermissionStatus();
            if (currentCamera !== 'granted') {
                console.log('Requesting camera permission...');
                const cameraResult = await Camera.requestCameraPermission();
                if (cameraResult === 'denied') {
                    console.log('Camera permission denied');
                    await checkPermissions();
                    return;
                }
            }

            // Small delay to feel natural
            await new Promise(resolve => setTimeout(resolve, 300));

            // 2. Request Microphone Permission
            const currentMic = await Camera.getMicrophonePermissionStatus();
            if (currentMic !== 'granted') {
                console.log('Requesting microphone permission...');
                const micResult = await Camera.requestMicrophonePermission();
                if (micResult === 'denied') {
                    console.log('Microphone permission denied');
                    await checkPermissions();
                    return;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Request Location Permission
            if (!locationPermission?.granted) {
                console.log('Requesting location permission...');
                const locationResult = await requestLocation();
                if (!locationResult.granted) {
                    console.log('Location permission denied');
                    await checkPermissions();
                    return;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. Request Media Library Permission
            if (mediaLibraryPermission?.status !== PermissionStatus.GRANTED) {
                console.log('Requesting media library permission...');
                const mediaResult = await requestMediaLibrary();
                if (mediaResult.status !== PermissionStatus.GRANTED) {
                    console.log('Media library permission denied');
                    await checkPermissions();
                    return;
                }
            }

            // Final check
            const finalState = await checkPermissions();
            console.log('All permissions requested. Final state:', finalState);
        } catch (error) {
            console.error('Error requesting permissions:', error);
        } finally {
            setPermissionState(prev => ({ ...prev, isRequesting: false }));
        }
    }, [locationPermission, mediaLibraryPermission, requestLocation, requestMediaLibrary, checkPermissions]);

    /**
     * Initial permission check and request on mount
     */
    useEffect(() => {
        const initPermissions = async () => {
            const currentState = await checkPermissions();

            // If not all granted and haven't requested yet, request them
            if (!currentState.allGranted && !hasRequestedRef.current) {
                // Small delay to let the app settle
                setTimeout(() => {
                    requestPermissionsSequentially();
                }, 500);
            }
        };

        initPermissions();
    }, [checkPermissions, requestPermissionsSequentially]);

    /**
     * Re-check permissions when app comes back to foreground
     */
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });

        return () => subscription.remove();
    }, [checkPermissions]);

    return {
        ...permissionState,
        retryPermissions: requestPermissionsSequentially,
        checkPermissions,
    };
}
