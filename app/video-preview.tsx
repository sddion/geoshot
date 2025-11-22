import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
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
        if (saving || !videoUri) return;

        setSaving(true);
        try {
            // Save the video to the gallery
            const asset = await MediaLibrary.createAssetAsync(videoUri);
            console.log('Saved video asset:', asset.uri);

            Alert.alert('Success', 'Video saved to gallery!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
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


                    {/* GPS Overlay */}
                    <View
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
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
        justifyContent: 'flex-end', 
        marginBottom: 90, 
    },
});
