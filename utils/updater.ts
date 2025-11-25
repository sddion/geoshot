import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import { getContentUriAsync, createDownloadResumable } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { canInstallFromUnknownSources, openInstallPermissionSettings } from './permissionUtils';

const GITHUB_REPO = 'sddion/geoshot';
const GITHUB_RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
    content_type: string;
}

export interface GitHubRelease {
    tag_name: string;
    assets: ReleaseAsset[];
    body: string; 
    html_url: string;
}


function compareVersions(v1: string, v2: string): number {
    const cleanV1 = v1.replace(/^v/, '');
    const cleanV2 = v2.replace(/^v/, '');

    const parts1 = cleanV1.split('.').map(Number);
    const parts2 = cleanV2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

function getBestApkAsset(assets: ReleaseAsset[]): ReleaseAsset | null {
    if (!Device.supportedCpuArchitectures) {
        // Fallback: try to find a universal APK or just the first one
        return assets.find(a => a.name.endsWith('.apk')) || null;
    }

    // Map device architectures to the naming convention used in GitHub Actions
    // Action produces: app-armeabi-v7a-release.apk, app-arm64-v8a-release.apk, etc.
    for (const arch of Device.supportedCpuArchitectures) {
        const matchingAsset = assets.find(asset => asset.name.includes(arch) && asset.name.endsWith('.apk'));
        if (matchingAsset) {
            return matchingAsset;
        }
    }

    // If no specific architecture match found, try to find a generic one or just the first APK
    return assets.find(a => a.name.endsWith('.apk')) || null;
}

export async function checkForUpdate(): Promise<GitHubRelease | null> {
    if (Platform.OS !== 'android') return null;

    try {
        // Check if native modules are available
        if (!Application || !Application.nativeApplicationVersion) {
            console.warn('Application module not available. Skipping update check.');
            return null;
        }

        const response = await fetch(GITHUB_RELEASES_URL);
        if (!response.ok) {
            console.warn('Failed to fetch releases:', response.status);
            return null;
        }

        const data: GitHubRelease = await response.json();
        const currentVersion = Application.nativeApplicationVersion || '0.0.0';

        // Check if the release tag is newer than current version
        if (compareVersions(data.tag_name, currentVersion) > 0) {
            // Only return release if we can find a compatible APK
            if (getBestApkAsset(data.assets)) {
                return data;
            }
        }
        return null;
    } catch (error) {
        console.error('Error checking for updates:', error);
        return null;
    }
}

export interface DownloadProgress {
    totalBytes: number;
    downloadedBytes: number;
    progress: number; // 0-1
}

export async function downloadAndInstallUpdate(
    release: GitHubRelease,
    onProgress?: (progress: DownloadProgress) => void,
    onStatusChange?: (status: string) => void,
    onPermissionRequired?: () => void
) {
    if (Platform.OS !== 'android') return;

    try {
        // Check if native modules are available
        if (!Application || !FileSystem || !IntentLauncher || !Device) {
            console.warn('Native modules not available. Skipping update check.');
            Alert.alert('Error', 'Native modules not available on this device.');
            return;
        }

        onStatusChange?.('Preparing download...');

        // Check if permission to install unknown apps is granted
        if (Platform.Version >= 26) {
            const hasPermission = await canInstallFromUnknownSources();
            if (!hasPermission) {
                console.warn('Permission to install unknown apps not granted');
                onStatusChange?.('Permission required');
                onPermissionRequired?.();
                Alert.alert(
                    'Permission Required',
                    'Please enable "Install from unknown sources" in settings to install updates.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: async () => {
                                try {
                                    await openInstallPermissionSettings();
                                    onStatusChange?.('Please grant permission and try again');
                                } catch (settingsError) {
                                    console.error('Failed to open settings:', settingsError);
                                    Alert.alert('Error', 'Could not open settings. Please enable manually.');
                                }
                            },
                        },
                    ]
                );
                return;
            }
        }

        const apkAsset = getBestApkAsset(release.assets);

        if (!apkAsset) {
            Alert.alert('Error', 'No compatible APK found in the latest release.');
            onStatusChange?.('No compatible APK found');
            return;
        }

        // 1. Download the APK with progress tracking
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
        if (!cacheDir) {
            throw new Error('Cache directory not available');
        }

        onStatusChange?.('Downloading update...');

        const downloadResumable = createDownloadResumable(
            apkAsset.browser_download_url,
            cacheDir + 'update.apk',
            {},
            (downloadProgress: any) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                onProgress?.({
                    totalBytes: downloadProgress.totalBytesExpectedToWrite,
                    downloadedBytes: downloadProgress.totalBytesWritten,
                    progress: progress,
                });
            }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result || !result.uri) {
            throw new Error('Download failed');
        }

        onStatusChange?.('Preparing installation...');

        // 2. Get Content URI (Required for Android N+)
        let contentUri: string;
        try {
            contentUri = await getContentUriAsync(result.uri);
        } catch (uriError) {
            console.error('Failed to get content URI:', uriError);
            throw new Error('Failed to prepare file for installation');
        }

        onStatusChange?.('Opening installer...');

        // 3. Launch Intent to Install
        try {
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                type: 'application/vnd.android.package-archive',
            });

            onStatusChange?.('Installation started');
        } catch (intentError) {
            console.error('Failed to launch installer:', intentError);
            throw new Error('Failed to launch installer. Please check if update file is valid.');
        }

    } catch (error) {
        console.error('Update installation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        Alert.alert(
            'Update Failed',
            `Could not install the update.\n\nError: ${errorMessage}`
        );
        onStatusChange?.('Installation failed');
    }
}

