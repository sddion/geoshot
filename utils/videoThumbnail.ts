import { getThumbnailAsync } from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

/**
 * Generate a thumbnail for a video file
 * @param videoUri - URI of the video file
 * @returns URI of the generated thumbnail image, or the original video URI if thumbnail generation fails
 */
export async function generateVideoThumbnail(videoUri: string): Promise<string> {
    try {
        const { uri } = await getThumbnailAsync(videoUri, {
            time: 0, // Get thumbnail from the first frame
            quality: 0.7,
        });
        return uri;
    } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
        // Return the video URI as fallback
        return videoUri;
    }
}

/**
 * Check if a URI points to a video file
 * @param uri - File URI to check
 * @returns true if the URI appears to be a video file
 */
export function isVideoUri(uri: string | null): boolean {
    if (!uri) return false;
    const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
    const lowerUri = uri.toLowerCase();
    return videoExtensions.some(ext => lowerUri.includes(ext)) || lowerUri.includes('video');
}

/**
 * Get display URI for media thumbnail
 * If it's a video, attempts to generate a thumbnail
 * @param mediaUri - URI of the media file (photo or video)
 * @returns URI to display in the thumbnail
 */
export async function getMediaThumbnailUri(mediaUri: string): Promise<string> {
    if (isVideoUri(mediaUri)) {
        return await generateVideoThumbnail(mediaUri);
    }
    return mediaUri;
}
