import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export default function VideoPreviewScreen() {
    const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
    const router = useRouter();
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const handleSave = async () => {
        try {
            // It's already saved to cache/temp, now save to gallery
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

    if (!videoUri) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No video URI provided</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: videoUri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay={isPlaying}
                onPlaybackStatusUpdate={(status: any) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                    }
                }}
            />

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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    video: {
        flex: 1,
        width: '100%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
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
    errorText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
    },
});
