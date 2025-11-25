import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

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

    // Android 8.0+ - permission is per-app, let the system handle it
    return true;
}

/**
 * Get the current app's package name
 */
function getPackageName(): string {
    try {
        // Use expo-constants to get the package name
        return Constants.expoConfig?.android?.package || 'app.geoshot.camera';
    } catch {
        return 'app.geoshot.camera';
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
            
            try {
                // Try to open the specific "Install unknown apps" settings for this app
                await IntentLauncher.startActivityAsync(
                    'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
                    {
                        data: `package:${packageName}`,
                    }
                );
            } catch (intentError) {
                console.warn('Could not open specific settings, opening general settings:', intentError);
                // Fallback to general settings
                await Linking.openSettings();
            }
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
