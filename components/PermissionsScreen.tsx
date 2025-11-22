import React, { useEffect, useCallback, useState } from 'react';
import { AppState, Linking, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import { usePermissions, PermissionStatus } from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface PermissionsScreenProps {
    onAllPermissionsGranted: () => void;
}

export default function PermissionsScreen({ onAllPermissionsGranted }: PermissionsScreenProps) {
    const [cameraStatus, setCameraStatus] = useState<CameraPermissionStatus>('not-determined');
    const [micStatus, setMicStatus] = useState<CameraPermissionStatus>('not-determined');
    const router = useRouter();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = usePermissions();

    const checkPermissions = useCallback(async () => {
        const camera = Camera.getCameraPermissionStatus();
        const mic = Camera.getMicrophonePermissionStatus();

        setCameraStatus(camera);
        setMicStatus(mic);

        const locationGranted = locationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.status === PermissionStatus.GRANTED;

        if (camera === 'granted' && mic === 'granted' && locationGranted && mediaGranted) {
            onAllPermissionsGranted();
            router.replace('/');
        }
    }, [locationPermission, mediaLibraryPermission, onAllPermissionsGranted]);

    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });
        return () => subscription.remove();
    }, [checkPermissions]);

    const handleRequestPermissions = async () => {
        // Camera
        if (cameraStatus !== 'granted') {
            const newStatus = await Camera.requestCameraPermission();
            setCameraStatus(newStatus);
            if (newStatus === 'denied') {
                await Linking.openSettings();
                return;
            }
        }

        // Microphone
        if (micStatus !== 'granted') {
            const newStatus = await Camera.requestMicrophonePermission();
            setMicStatus(newStatus);
            if (newStatus === 'denied') {
                await Linking.openSettings();
                return;
            }
        }

        // Location
        if (!locationPermission?.granted) {
            const result = await requestLocationPermission();
            if (!result.granted) {
                if (!result.canAskAgain) {
                    await Linking.openSettings();
                }
                return;
            }
        }

        // Media Library
        if (mediaLibraryPermission?.status !== PermissionStatus.GRANTED) {
            const result = await requestMediaLibraryPermission();
            if (result.status !== PermissionStatus.GRANTED) {
                if (!result.canAskAgain) {
                    await Linking.openSettings();
                }
                return;
            }
        }

        // Final check
        checkPermissions();
    };

    const isCameraGranted = cameraStatus === 'granted';
    const isMicGranted = micStatus === 'granted';
    const isLocationGranted = locationPermission?.granted ?? false;
    const isMediaGranted = mediaLibraryPermission?.status === PermissionStatus.GRANTED;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="shield-checkmark" size={64} color="#fff" style={styles.icon} />
                <Text style={styles.title}>Permissions Required</Text>
                <Text style={styles.subtitle}>
                    GeoShot needs access to your camera, microphone, location, and photos to work properly.
                </Text>

                <View style={styles.permissionList}>
                    <PermissionItem
                        label="Camera"
                        granted={isCameraGranted}
                        icon="camera"
                    />
                    <PermissionItem
                        label="Microphone"
                        granted={isMicGranted}
                        icon="mic"
                    />
                    <PermissionItem
                        label="Location"
                        granted={isLocationGranted}
                        icon="location"
                    />
                    <PermissionItem
                        label="Photo Library"
                        granted={isMediaGranted}
                        icon="images"
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRequestPermissions}
                >
                    <Text style={styles.buttonText}>
                        {(isCameraGranted && isMicGranted && isLocationGranted && isMediaGranted)
                            ? "Continue"
                            : "Grant Permissions"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function PermissionItem({ label, granted, icon }: { label: string, granted: boolean, icon: keyof typeof Ionicons.glyphMap }) {
    return (
        <View style={styles.permissionItem}>
            <View style={styles.permissionLeft}>
                <Ionicons name={icon} size={24} color="#fff" style={{ marginRight: 12 }} />
                <Text style={styles.permissionLabel}>{label}</Text>
            </View>
            <Ionicons
                name={granted ? "checkmark-circle" : "alert-circle-outline"}
                size={24}
                color={granted ? "#4ade80" : "#fbbf24"}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#a1a1aa',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    permissionList: {
        width: '100%',
        marginBottom: 40,
        backgroundColor: '#18181b',
        borderRadius: 16,
        padding: 8,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#27272a',
    },
    permissionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    permissionLabel: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 100,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
