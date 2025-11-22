import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { getVideoGPSData, saveVideoGPSData, VideoGPSData } from '@/utils/videoGPSData';
import GeoOverlay from '@/components/GeoOverlay';
import EditDataModal from '@/components/EditDataModal';
import { GeoData, getCachedMapTile } from '@/utils/geoOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VideoPreviewScreen() {
    const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
    const router = useRouter();
    const [gpsData, setGpsData] = useState<GeoData | null>(null);
    const [mapTile, setMapTile] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

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

                // Update map tile if we moved significantly (optional optimization)
                // For now, let's keep the initial tile or update it occasionally
                // setMapTile(await getCachedMapTile(currentPoint.latitude, currentPoint.longitude));
            }
        }, 200); // Update every 200ms

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
        try {
            if (videoUri) {
                await MediaLibrary.createAssetAsync(videoUri);
                Alert.alert('Saved', 'Video saved to gallery!');
                router.back();
            }
        } catch (error) {
            console.error('Error saving video:', error);
            Alert.alert('Error', 'Failed to save video.');
        }
    };

    const handleShare = async () => {
        if (videoUri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(videoUri);
        }
    };

    const handleDiscard = () => {
        Alert.alert(
            'Discard Video',
            'Are you sure you want to discard this video?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => router.back()
                },
            ]
        );
    };

    const handleEditSave = async (newData: Partial<GeoData>) => {
        if (gpsData && videoUri) {
            const updatedData = { ...gpsData, ...newData };
            setGpsData(updatedData);

            // Update the stored data
            // Note: This simplifies it by applying edits to ALL data points
            // A more advanced implementation would interpolate or offset all points
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
            <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                contentFit="contain"
            />

            {/* Overlay Layer */}
            <View style={styles.overlayLayer} pointerEvents="box-none">
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                        <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                        <Text style={styles.editButtonText}>Edit GPS</Text>
                    </TouchableOpacity>
                </View>

                {gpsData && (
                    <GeoOverlay
                        geoData={gpsData}
                        mapTile={mapTile}
                        imageWidth={SCREEN_WIDTH - 32}
                        style={styles.geoOverlay}
                    />
                )}

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleDiscard}>
                        <MaterialCommunityIcons name="trash-can-outline" size={32} color="#FF3B30" />
                        <Text style={styles.iconLabel}>Discard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                        <MaterialCommunityIcons name="share-variant" size={32} color="#fff" />
                        <Text style={styles.iconLabel}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <MaterialCommunityIcons name="check" size={32} color="#000" />
                        <Text style={styles.saveLabel}>Save</Text>
                    </TouchableOpacity>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
        width: '100%',
    },
    overlayLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    geoOverlay: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 20,
        borderRadius: 30,
        marginHorizontal: 20,
    },
    iconButton: {
        alignItems: 'center',
        gap: 4,
    },
    iconLabel: {
        color: '#fff',
        fontSize: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 8,
    },
    saveLabel: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
