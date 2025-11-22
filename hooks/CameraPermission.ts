
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

/**
 * CameraPermission
 *
 * Encapsulates react-native-vision-camera permission checks + requests.
 *
 * - autoRequest: if true (default) the hook will call requestCameraPermission()
 *   automatically when the current status is not 'authorized' on mount.
 * - It re-checks permission whenever the app comes back to the foreground.
 *
 * Returned API:
 * - status: raw permission status string from VisionCamera
 * - isAuthorized / isDenied / isRestricted / isNotDetermined: booleans
 * - isRequesting: whether a permission request is in flight
 * - checkPermission(): re-checks current permission status
 * - requestPermission(): explicitly requests camera permission
 * - openSettings(): opens OS settings (Linking.openSettings)
 */
export type VisionPermissionStatus = 'authorized' | 'denied' | 'restricted' | 'not-determined' | 'limited' | 'unknown';

export function CameraPermission({ autoRequest = true } = {}) {
    const [status, setStatus] = useState<VisionPermissionStatus>('not-determined');
    const [isRequesting, setIsRequesting] = useState(false);
    const mounted = useRef(true);

    const normalize = (s: string | null | undefined): VisionPermissionStatus => {
        if (!s) return 'unknown';
        // vision-camera returns these typical values — keep a safe fallback
        if (s === 'authorized' || s === 'denied' || s === 'restricted' || s === 'not-determined' || s === 'limited') {
            return s as VisionPermissionStatus;
        }
        return 'unknown';
    };

    const checkPermission = async (): Promise<VisionPermissionStatus> => {
        try {
            const s = await Camera.getCameraPermissionStatus();
            const n = normalize(s);
            if (mounted.current) setStatus(n);
            return n;
        } catch (e) {
            if (mounted.current) setStatus('unknown');
            return 'unknown';
        }
    };

    const requestPermission = async (): Promise<VisionPermissionStatus> => {
        try {
            setIsRequesting(true);
            const r = await Camera.requestCameraPermission();
            const n = normalize(r);
            if (mounted.current) setStatus(n);
            return n;
        } finally {
            if (mounted.current) setIsRequesting(false);
        }
    };

    const openSettings = async () => {
        try {
            await Linking.openSettings();
        } catch (e) {
            // best-effort; swallow error
            console.warn('openSettings failed', e);
        }
    };

    useEffect(() => {
        mounted.current = true;

        (async () => {
            const s = await checkPermission();
            if (autoRequest && s !== 'authorized') {
                // If not authorized, attempt request once.
                // Some devices may return 'restricted' immediately; request will be a no-op or return restricted.
                await requestPermission();
            }
        })();

        const sub = AppState.addEventListener('change', (next) => {
            if (next === 'active') {
                // re-check when app returns to foreground (user may have toggled settings)
                void checkPermission();
            }
        });

        return () => {
            mounted.current = false;
            sub.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    return {
        status,
        isAuthorized: status === 'authorized',
        isDenied: status === 'denied',
        isRestricted: status === 'restricted',
        isNotDetermined: status === 'not-determined',
        isLimited: status === 'limited',
        isUnknown: status === 'unknown',
        isRequesting,
        checkPermission,
        requestPermission,
        openSettings,
    } as const;
}

export default CameraPermission;
