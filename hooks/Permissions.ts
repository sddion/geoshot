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
                if (cameraResult === 'denied') {
                    console.log('Camera permission denied, continuing to next permission...');
                    // Don't return - continue to next permission
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 2. Microphone
            const currentMic = await Camera.getMicrophonePermissionStatus();
            if (currentMic !== 'granted') {
                console.log('Requesting microphone permission...');
                const micResult = await Camera.requestMicrophonePermission();
                if (micResult === 'denied') {
                    console.log('Microphone permission denied, continuing to next permission...');
                    // Don't return - continue to next permission
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Media Library
            const currentMedia = await MediaLibrary.getPermissionsAsync();
            if (currentMedia.status !== MediaLibrary.PermissionStatus.GRANTED) {
                // Prevent loop: Only ask if we can ask again, or if it's undetermined.
                if (currentMedia.status === MediaLibrary.PermissionStatus.DENIED && !currentMedia.canAskAgain) {
                    console.log('Media library permission permanently denied, continuing to next permission...');
                    // Don't return - continue to next permission
                } else {
                    console.log('Requesting media library permission...');
                    const mediaResult = await requestMediaLibrary();
                    if (mediaResult.status !== MediaLibrary.PermissionStatus.GRANTED) {
                        console.log('Media library permission denied, continuing to next permission...');
                        // Don't return - continue to next permission
                    }
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. LOCATION PERMISSION
            console.log("Checking location permission...");
            let loc = await Location.getForegroundPermissionsAsync();

            // Request foreground location if not granted
            if (!loc.granted && loc.canAskAgain) {
                console.log("Asking for foreground location...");
                loc = await Location.requestForegroundPermissionsAsync();
            }

            if (!loc.granted) {
                console.log("Foreground location not granted.");
                // If we can't ask again, open settings and stop flow
                if (!loc.canAskAgain) {
                    console.log("Foreground location blocked. Opening settings...");
                    waitingForSettingsRef.current = true;
                    Linking.openSettings();
                    await checkPermissions();
                    return;
                }
                // If denied but can ask again, just log and continue
                console.log("Foreground location denied, but can ask again. Continuing...");
            }

            // Request Background Location (only if foreground is granted)
            if (loc.granted) {
                let bg = await Location.getBackgroundPermissionsAsync();
                if (!bg.granted && bg.canAskAgain) {
                    console.log("Asking for background location...");
                    bg = await Location.requestBackgroundPermissionsAsync();
                }

                if (!bg.granted && !bg.canAskAgain) {
                    console.log("Background location permanently denied. Opening settings...");
                    waitingForSettingsRef.current = true;
                    Linking.openSettings().catch(() => console.warn("Unable to open settings"));
                    await checkPermissions();
                    return;
                } else if (!bg.granted) {
                    console.log("Background location denied but can ask again.");
                }
            }

            // Final check of all permissions after the flow completes
            const finalState = await checkPermissions();
            console.log('All permissions requested. Final state:', finalState);

        } catch (error) {
            console.error('Error requesting permissions:', error);
        } finally {
            console.log("Permission request flow finished. Resetting isRequesting.");
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

                // If we are currently requesting (e.g. dialog open), don't interrupt.
                if (isRequestingRef.current) {
                    console.log("Already requesting, skipping re-check.");
                    return;
                }

                const newState = await checkPermissions();

                // Resume the flow if:
                // 1. We were explicitly waiting for settings, OR
                // 2. Not all permissions are granted AND we haven't requested yet (first time), OR
                // 3. Not all permissions are granted AND we have requested before (continue sequential flow)
                const shouldResume = waitingForSettingsRef.current ||
                    (!newState.allGranted && hasRequestedRef.current);

                if (shouldResume) {
                    console.log("Resuming permission flow...");
                    waitingForSettingsRef.current = false;
                    requestPermissionsSequentially();
                }
            }
        });

        return () => subscription.remove();
    }, [checkPermissions, requestPermissionsSequentially]);

    return {
        ...permissionState,
        retryPermissions: requestPermissionsSequentially,
        checkPermissions,
    };
}
