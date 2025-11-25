import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

/**
 * Custom hook for automatically requesting app permissions one by one
 * Similar to how standard apps request permissions
 */

export interface PermissionState {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    mediaLibrary: boolean;
    allGranted: boolean;
    isRequesting: boolean;
}

export function useAutoPermissions() {
    const [permissionState, setPermissionState] = useState<PermissionState>({
        camera: false,
        microphone: false,
        location: false,
        mediaLibrary: false,
        allGranted: false,
        isRequesting: false,
    });

    // Keep original Expo logic untouched
    const [locationPermission, requestLocation] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibrary] = MediaLibrary.usePermissions();

    const hasRequestedRef = useRef(false);
    const isRequestingRef = useRef(false);
    const waitingForSettingsRef = useRef(false);

    /**
     * Check all permission statuses
     */
    const checkPermissions = useCallback(async () => {
        try {
            const cameraStatus = await Camera.getCameraPermissionStatus();
            const micStatus = await Camera.getMicrophonePermissionStatus();
            const locStatus = await Location.getForegroundPermissionsAsync();

            let bgStatus = { granted: false };
            if (locStatus.granted) {
                bgStatus = await Location.getBackgroundPermissionsAsync();
            }

            const locationGranted = locStatus.granted && bgStatus.granted;
            const mediaStatus = await MediaLibrary.getPermissionsAsync();
            const mediaGranted = mediaStatus.status === MediaLibrary.PermissionStatus.GRANTED;

            const newState = {
                camera: cameraStatus === 'granted',
                microphone: micStatus === 'granted',
                location: locationGranted,
                mediaLibrary: mediaGranted,
                allGranted: false,
                isRequesting: isRequestingRef.current,
            };

            newState.allGranted =
                newState.camera &&
                newState.microphone &&
                newState.location &&
                newState.mediaLibrary;

            setPermissionState(newState);
            return newState;
        } catch (e) {
            if (__DEV__) console.error("checkPermissions error", e);
            return {
                camera: false,
                microphone: false,
                location: false,
                mediaLibrary: false,
                allGranted: false,
                isRequesting: false,
            };
        }
    }, []);

    /**
     * Request permissions sequentially
     */
    const requestPermissionsSequentially = useCallback(async () => {
        if (isRequestingRef.current) return;

        isRequestingRef.current = true;
        hasRequestedRef.current = true;
        setPermissionState(prev => ({ ...prev, isRequesting: true }));

        try {
            // 1. Camera
            const currentCamera = await Camera.getCameraPermissionStatus();
            if (currentCamera !== 'granted') {
                await Camera.requestCameraPermission();
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 2. Microphone
            const currentMic = await Camera.getMicrophonePermissionStatus();
            if (currentMic !== 'granted') {
                await Camera.requestMicrophonePermission();
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Media Library
            const currentMedia = await MediaLibrary.getPermissionsAsync();
            if (currentMedia.status !== MediaLibrary.PermissionStatus.GRANTED) {
                if (currentMedia.status !== MediaLibrary.PermissionStatus.DENIED || currentMedia.canAskAgain) {
                    await requestMediaLibrary();
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. LOCATION PERMISSION (Foreground)
            let loc = await Location.getForegroundPermissionsAsync();
            if (!loc.granted && loc.canAskAgain) {
                loc = await Location.requestForegroundPermissionsAsync();
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 5. LOCATION PERMISSION (Background) - only if foreground is granted
            if (loc.granted) {
                let bg = await Location.getBackgroundPermissionsAsync();
                if (!bg.granted && bg.canAskAgain) {
                    bg = await Location.requestBackgroundPermissionsAsync();
                }
            }

            // Reset the requesting flag BEFORE final check
            isRequestingRef.current = false;

            // All permissions have been attempted - check final state
            await checkPermissions();

            // Only open settings if critical permissions are permanently denied
            const cameraStatus = await Camera.getCameraPermissionStatus();
            const locStatus = await Location.getForegroundPermissionsAsync();
            if (cameraStatus === 'denied' || (locStatus.status === 'denied' && !locStatus.canAskAgain)) {
                // Don't automatically open settings - let user decide
                // They can see which permissions are missing from the UI
            }

        } catch (error) {
            if (__DEV__) console.error('Error requesting permissions:', error);
            // Make sure to reset isRequesting even on error
            isRequestingRef.current = false;
            setPermissionState(prev => ({ ...prev, isRequesting: false }));
        }
    },
        [
            requestMediaLibrary,
            checkPermissions
        ]
    );

    /**
     * Initial permission check + request
     */
    useEffect(() => {
        const initPermissions = async () => {
            const currentState = await checkPermissions();

            if (!currentState.allGranted && !hasRequestedRef.current) {
                setTimeout(() => {
                    requestPermissionsSequentially();
                }, 500);
            }
        };

        initPermissions();
    }, [checkPermissions, requestPermissionsSequentially]);

    /**
     * Re-check on app foreground
     */
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'active') {
                await checkPermissions();
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
