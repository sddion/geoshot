import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getVideoGPSData, saveVideoGPSData, VideoGPSData } from '@/utils/videoGPSData';
import GeoOverlay from '@/components/GeoOverlay';
import EditDataModal from '@/components/EditDataModal';
import { GeoData, getCachedMapTile } from '@/utils/geoOverlay';
import { previewStyles as styles } from '@/styles/preview.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VideoPreviewScreen() {
    const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
    const router = useRouter();
    const [gpsData, setGpsData] = useState<GeoData | null>(null);
    const [mapTile, setMapTile] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fullGpsData, setFullGpsData] = useState<VideoGPSData | null>(null);

    // Ref for capturing the overlay
    const overlayRef = useRef<View>(null);

    // Initialize video player
    const player = useVideoPlayer(videoUri, player => {
        player.loop = true;
        player.play();
    });

    useEffect(() => {
        loadGPSData();
    }, [videoUri]);

    // Sync GPS data with video playback
    useEffect(() => {
        if (!fullGpsData || fullGpsData.gpsData.length === 0) return;

        const interval = setInterval(() => {
            const currentTime = player.currentTime;
            const index = Math.floor(currentTime);

            if (index >= 0 && index < fullGpsData.gpsData.length) {
                const currentPoint = fullGpsData.gpsData[index];
                setGpsData(currentPoint);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [fullGpsData, player]);

    const loadGPSData = async () => {
        if (videoUri) {
            const data = await getVideoGPSData(videoUri);
            if (data && data.gpsData.length > 0) {
                setFullGpsData(data);
                const initialPoint = data.gpsData[0];
                setGpsData(initialPoint);
                const tile = await getCachedMapTile(initialPoint.latitude, initialPoint.longitude);
                setMapTile(tile);
            }
        }
    };

    const handleSave = async () => {
        if (saving || !videoUri || !overlayRef.current) return;

        setSaving(true);
        try {
            // 1. Capture the overlay as an image
            const overlayUri = await captureRef(overlayRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile',
            });

            // 2. Define output path
            const outputUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory || ''}geoshot_output_${Date.now()}.mp4`;

            // 3. Construct FFmpeg command
            // Overlay the image on top of the video. 
            // Assuming the captured overlay image is the same size as the video view.
            const command = `-i "${videoUri}" -i "${overlayUri}" -filter_complex "[0:v][1:v]overlay=0:0" -c:v libx264 -preset ultrafast -c:a copy "${outputUri}"`;

            console.log('Running FFmpeg command:', command);

            // 4. Execute FFmpeg
            const session = await FFmpegKit.execute(command);
            const returnCode = await session.getReturnCode();

            if (ReturnCode.isSuccess(returnCode)) {
                console.log('FFmpeg process finished successfully');

                // 5. Save to Gallery
                const asset = await MediaLibrary.createAssetAsync(outputUri);
                console.log('Saved video asset:', asset.uri);

                Alert.alert('Success', 'Video saved with GPS overlay!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                console.error('FFmpeg process failed with state', await session.getState());
                const logs = await session.getLogs();
                console.error('FFmpeg logs:', logs);
                Alert.alert('Error', 'Failed to process video.');
            }

        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save video.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditSave = async (newData: Partial<GeoData>) => {
        if (gpsData && videoUri) {
            const updatedData = { ...gpsData, ...newData };
            setGpsData(updatedData);

            const currentData = await getVideoGPSData(videoUri);
            if (currentData) {
                const updatedPoints = currentData.gpsData.map(p => ({ ...p, ...newData }));
                await saveVideoGPSData(
                    videoUri,
                    updatedPoints,
                    currentData.recordingStartTime,
                    currentData.recordingEndTime,
                    currentData.recordingDuration
                );
            }
        }
    };

    if (!videoUri) return null;

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header} edges={['top']}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Preview</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setIsEditing(true)}
                    >
                        <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialCommunityIcons name="check" size={28} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                <View style={styles.previewContainer}>
                    {/* Video Player */}
                    <VideoView
                        style={customStyles.video}
                        player={player}
                        allowsPictureInPicture
                        contentFit="cover"
                    />

                    {/* Overlay Container - Captured for FFmpeg */}
                    {/* We position this absolutely over the video to match what the user sees, 
                        and we capture THIS container which includes the transparent area and the bottom overlay */}
                    <View
                        ref={overlayRef}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                        collapsable={false}
                    >
                        <View style={customStyles.overlayWrapper}>
                            {gpsData && (
                                <GeoOverlay
                                    geoData={gpsData}
                                    mapTile={mapTile}
                                    imageWidth={SCREEN_WIDTH - 32} // Adjust for padding
                                />
                            )}
                        </View>
                    </View>
                </View>
            </View>

            <EditDataModal
                visible={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleEditSave}
                initialData={gpsData}
            />
        </View>
    );
}

const customStyles = StyleSheet.create({
    video: {
        width: '100%',
        height: '100%',
    },
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end', // Push to bottom
        marginBottom: 90, // Move overlay up a bit
    },
});
