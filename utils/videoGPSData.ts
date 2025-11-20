import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoData } from './geoOverlay';

export interface VideoGPSData {
    videoUri: string;
    gpsData: GeoData[];
    recordingStartTime: string;
    recordingEndTime: string;
    recordingDuration: number;
}

const GPS_DATA_KEY_PREFIX = '@geoshot_video_gps_';

/**
 * Save GPS data for a video recording
 */
export async function saveVideoGPSData(videoUri: string, gpsDataArray: GeoData[], startTime: string, endTime: string, duration: number): Promise<void> {
    try {
        const data: VideoGPSData = {
            videoUri,
            gpsData: gpsDataArray,
            recordingStartTime: startTime,
            recordingEndTime: endTime,
            recordingDuration: duration,
        };

        // Use video URI as key (sanitized)
        const key = `${GPS_DATA_KEY_PREFIX}${sanitizeUri(videoUri)}`;
        await AsyncStorage.setItem(key, JSON.stringify(data));

        console.log(`Saved GPS data for video: ${videoUri} (${gpsDataArray.length} data points)`);
    } catch (error) {
        console.error('Error saving video GPS data:', error);
    }
}

/**
 * Retrieve GPS data for a video
 */
export async function getVideoGPSData(videoUri: string): Promise<VideoGPSData | null> {
    try {
        const key = `${GPS_DATA_KEY_PREFIX}${sanitizeUri(videoUri)}`;
        const data = await AsyncStorage.getItem(key);

        if (data) {
            return JSON.parse(data) as VideoGPSData;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving video GPS data:', error);
        return null;
    }
}

/**
 * Delete GPS data for a video
 */
export async function deleteVideoGPSData(videoUri: string): Promise<void> {
    try {
        const key = `${GPS_DATA_KEY_PREFIX}${sanitizeUri(videoUri)}`;
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('Error deleting video GPS data:', error);
    }
}

/**
 * Get all videos with GPS data
 */
export async function getAllVideosWithGPS(): Promise<VideoGPSData[]> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const gpsKeys = keys.filter(key => key.startsWith(GPS_DATA_KEY_PREFIX));

        const allData = await AsyncStorage.multiGet(gpsKeys);
        return allData
            .map(([_, value]) => value ? JSON.parse(value) as VideoGPSData : null)
            .filter((data): data is VideoGPSData => data !== null);
    } catch (error) {
        console.error('Error retrieving all video GPS data:', error);
        return [];
    }
}

/**
 * Sanitize URI for use as storage key
 */
function sanitizeUri(uri: string): string {
    return uri.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Export GPS data to JSON file
 */
export function exportGPSDataToJSON(gpsData: VideoGPSData): string {
    return JSON.stringify(gpsData, null, 2);
}
