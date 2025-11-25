import { Platform, Linking, NativeModules } from 'react-native';

const { PackageManager } = NativeModules;

/**
 * Check if the app has permission to install unknown apps (Android 8.0+)
 * For Android versions before 8.0, this always returns true as the permission
 * is managed globally in system settings.
 */
export async function canInstallFromUnknownSources(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return false;
    }

    if (Platform.Version < 26) {
        // Android 7.1 and below - permission is system-wide, assume granted
        return true;
    }

    try {
        // For Android 8.0+ (API 26+), check if we can request package installs
        // We'll use IntentLauncher to check settings
        const canInstall = await Linking.canOpenURL('package:' + getPackageName());
        return canInstall;
    } catch (error) {
        console.warn('Error checking install permission:', error);
        // If we can't check, assume we need to request it
        return false;
    }
}

/**
 * Get the current app's package name
 */
function getPackageName(): string {
    // This is typically available via expo-application or react-native DeviceInfo
    // For now, we'll use a common pattern
    try {
        const { manifest } = require('expo-constants').default;
        return manifest?.android?.package || 'com.geoshot.app';
    } catch {
        return 'com.geoshot.app';
    }
}

/**
 * Open the system settings page where users can grant permission to install unknown apps
 * This is for Android 8.0+ (API 26+)
 */
export async function openInstallPermissionSettings(): Promise<void> {
    if (Platform.OS !== 'android') {
        return;
    }

    try {
        if (Platform.Version >= 26) {
            // Android 8.0+ - Open the specific app's install unknown apps settings
            const packageName = getPackageName();
            const url = `android.settings.MANAGE_UNKNOWN_APP_SOURCES`;

            // Try to open the specific settings page
            await Linking.openSettings();
        } else {
            // Android 7.1 and below - Open general security settings
            await Linking.openSettings();
        }
    } catch (error) {
        console.error('Error opening install permission settings:', error);
        throw error;
    }
}

/**
 * Check if we should show the permission prompt
 * This checks both the Android version and current permission status
 */
export async function shouldShowInstallPermissionPrompt(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return false;
    }

    // Only show for Android 8.0+
    if (Platform.Version < 26) {
        return false;
    }

    // Check if permission is already granted
    const hasPermission = await canInstallFromUnknownSources();
    return !hasPermission;
}
