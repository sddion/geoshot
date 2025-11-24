import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import { getContentUriAsync, createDownloadResumable } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

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

export async function downloadAndInstallUpdate(release: GitHubRelease) {
    if (Platform.OS !== 'android') return;

    try {
        // Check if native modules are available
        if (!Application || !FileSystem || !IntentLauncher || !Device) {
            console.warn('Native modules not available. Skipping update check.');
            return;
        }

        const apkAsset = getBestApkAsset(release.assets);

        if (!apkAsset) {
            Alert.alert('Error', 'No compatible APK found in the latest release.');
            return;
        }

        // 1. Download the APK
        // @ts-ignore
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
            throw new Error('Cache directory not available');
        }
        const downloadResumable = createDownloadResumable(
            apkAsset.browser_download_url,
            cacheDir + 'update.apk'
        );

        const result = await downloadResumable.downloadAsync();
        if (!result || !result.uri) {
            throw new Error("Download failed");
        }

        // 2. Get Content URI (Required for Android N+)
        const contentUri = await getContentUriAsync(result.uri);

        // 3. Launch Intent to Install
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/vnd.android.package-archive',
        });

    } catch (error) {
        console.error('Update installation failed:', error);
        Alert.alert('Update Failed', 'Could not download or install the update.');
    }
}
