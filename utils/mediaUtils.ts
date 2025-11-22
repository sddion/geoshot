import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

/**
 * Saves a file to the 'GeoShot' album in the media library.
 * Moves the file from the temporary directory to the document directory,
 * renames it with a custom timestamped name, and then adds it to the album.
 * 
 * @param uri The temporary URI of the file to save
 * @param type The type of file ('photo' or 'video')
 * @returns The URI of the saved asset, or null if saving failed
 */
export const saveFileToAppFolder = async (uri: string, type: 'photo' | 'video'): Promise<string | null> => {
    try {
        // 1. Request permissions if not already granted (just in case)
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            console.error('Media Library permission not granted');
            return null;
        }

        // 2. Generate custom filename
        const ext = type === 'photo' ? 'jpg' : 'mp4';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const filename = `GeoShot_${timestamp}_${random}.${ext}`;
        const newUri = `${FileSystem.documentDirectory}${filename}`;

        // 3. Move file to document directory (rename)
        await FileSystem.moveAsync({
            from: uri,
            to: newUri
        });

        // 4. Create asset in Media Library
        // This usually puts it in the default DCIM or Pictures folder initially
        const asset = await MediaLibrary.createAssetAsync(newUri);

        // 5. Move to 'GeoShot' album
        const album = await MediaLibrary.getAlbumAsync('GeoShot');

        if (album == null) {
            // Create album and move asset to it (copyAsset = false)
            await MediaLibrary.createAlbumAsync('GeoShot', asset, false);
        } else {
            // Add asset to existing album and move it (copyAsset = false)
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        // 6. Clean up the local copy in documentDirectory
        // Since MediaLibrary.createAssetAsync copies the file to the system gallery location,
        // we can now safely delete our local copy to avoid duplication.
        try {
            await FileSystem.deleteAsync(newUri, { idempotent: true });
        } catch (cleanupError) {
            console.warn('Failed to clean up local file:', cleanupError);
        }

        // Return the asset URI
        return asset.uri;
    } catch (error) {
        console.error('Error saving file to App Folder:', error);
        return null;
    }
};
