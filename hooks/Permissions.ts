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
        console.log("checkPermissions: starting...");
        try {
            const cameraStatus = await Camera.getCameraPermissionStatus();
            console.log("checkPermissions: camera checked", cameraStatus);

            const micStatus = await Camera.getMicrophonePermissionStatus();
            console.log("checkPermissions: mic checked", micStatus);

            // Re-fetch fresh location status to be sure
            const locStatus = await Location.getForegroundPermissionsAsync();
            console.log("checkPermissions: loc foreground checked", locStatus.status);

            let bgStatus = { granted: false };
            if (locStatus.granted) {
                bgStatus = await Location.getBackgroundPermissionsAsync();
                console.log("checkPermissions: loc background checked", bgStatus.granted);
            } else {
                console.log("checkPermissions: skipping background loc check (foreground not granted)");
            }

            // Consider location granted if we have both foreground and background (if needed)
            // For this app, it seems we want "Allow all the time" which implies background.
            const locationGranted = locStatus.granted && bgStatus.granted;

            // Fetch fresh media library status
            const mediaStatus = await MediaLibrary.getPermissionsAsync();
            console.log("checkPermissions: media checked", mediaStatus.status);
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

            console.log("checkPermissions: done", newState);
            setPermissionState(newState);
            return newState;
        } catch (e) {
            console.error("checkPermissions error", e);
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
                console.log('Requesting camera permission...');
                const cameraResult = await Camera.requestCameraPermission();
                console.log('Camera permission result:', cameraResult);
                // Don't return early - continue to next permission
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 2. Microphone
            const currentMic = await Camera.getMicrophonePermissionStatus();
            if (currentMic !== 'granted') {
                console.log('Requesting microphone permission...');
                const micResult = await Camera.requestMicrophonePermission();
                console.log('Microphone permission result:', micResult);
                // Don't return early - continue to next permission
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Media Library
            const currentMedia = await MediaLibrary.getPermissionsAsync();
            if (currentMedia.status !== MediaLibrary.PermissionStatus.GRANTED) {
                // Prevent loop: Only ask if we can ask again, or if it's undetermined.
                if (currentMedia.status === MediaLibrary.PermissionStatus.DENIED && !currentMedia.canAskAgain) {
                    console.log('Media library permission permanently denied.');
                    // Continue to next permission anyway
                } else {
                    console.log('Requesting media library permission...');
                    const mediaResult = await requestMediaLibrary();
                    console.log('Media library permission result:', mediaResult.status);
                    // Don't return early - continue to next permission
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. LOCATION PERMISSION (Foreground)
            console.log("Checking foreground location permission...");
            let loc = await Location.getForegroundPermissionsAsync();

            // Request foreground location if not granted
            if (!loc.granted && loc.canAskAgain) {
                console.log("Requesting foreground location...");
                loc = await Location.requestForegroundPermissionsAsync();
                console.log("Foreground location result:", loc.granted);
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 5. LOCATION PERMISSION (Background) - only if foreground is granted
            if (loc.granted) {
                console.log("Checking background location permission...");
                let bg = await Location.getBackgroundPermissionsAsync();
                if (!bg.granted && bg.canAskAgain) {
                    console.log("Requesting background location...");
                    bg = await Location.requestBackgroundPermissionsAsync();
                    console.log("Background location result:", bg.granted);
                }
            }

            // Reset the requesting flag BEFORE final check
            isRequestingRef.current = false;

            // All permissions have been attempted - check final state
            const finalState = await checkPermissions();
            console.log('All permissions requested. Final state:', finalState);

            // Only open settings if critical permissions are permanently denied
            if (!finalState.allGranted) {
                const cameraStatus = await Camera.getCameraPermissionStatus();
                const locStatus = await Location.getForegroundPermissionsAsync();

                // Open settings only if camera or location is permanently denied
                if (cameraStatus === 'denied' || (locStatus.status === 'denied' && !locStatus.canAskAgain)) {
                    console.log("Critical permissions permanently denied. User may need to enable in settings.");
                    // Don't automatically open settings - let user decide
                    // They can see which permissions are missing from the UI
                }
            }

        } catch (error) {
            console.error('Error requesting permissions:', error);
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
                console.log("App returned to foreground, re-checking permissions...");

                // Just check status, do NOT automatically trigger a new request flow
                // This prevents infinite loops if a permission is permanently denied
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
