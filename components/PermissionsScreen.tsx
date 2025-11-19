import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, AppState } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

interface PermissionsScreenProps {
    onAllPermissionsGranted: () => void;
}

export default function PermissionsScreen({ onAllPermissionsGranted }: PermissionsScreenProps) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

    // Track if we are checking permissions to avoid flickering
    const [isChecking, setIsChecking] = useState(true);

    const checkPermissions = async () => {
        setIsChecking(true);

        // Check all statuses
        const cameraGranted = cameraPermission?.granted;
        const micGranted = microphonePermission?.granted;
        const locationGranted = locationPermission?.granted;
        const mediaGranted = mediaLibraryPermission?.granted;

        if (cameraGranted && micGranted && locationGranted && mediaGranted) {
            onAllPermissionsGranted();
        }

        setIsChecking(false);
    };

    useEffect(() => {
        checkPermissions();
    }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission]);

    // Re-check when app comes to foreground (in case user changed settings)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkPermissions();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleRequestPermissions = async () => {
        if (!cameraPermission?.granted) await requestCameraPermission();
        if (!microphonePermission?.granted) await requestMicrophonePermission();
        if (!locationPermission?.granted) await requestLocationPermission();
        if (!mediaLibraryPermission?.granted) await requestMediaLibraryPermission();

        checkPermissions();
    };

    const openSettings = () => {
        Linking.openSettings();
    };

    if (isChecking) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Camera size={48} color="#fff" />
                </View>

                <Text style={styles.title}>Welcome to GeoShot</Text>
                <Text style={styles.subtitle}>
                    To provide the best experience, we need access to a few things:
                </Text>

                <View style={styles.permissionList}>
                    <PermissionItem
                        label="Camera"
                        description="To capture photos and videos"
                        granted={cameraPermission?.granted}
                    />
                    <PermissionItem
                        label="Microphone"
                        description="To record audio with videos"
                        granted={microphonePermission?.granted}
                    />
                    <PermissionItem
                        label="Location"
                        description="To add GPS data to your photos"
                        granted={locationPermission?.granted}
                    />
                    <PermissionItem
                        label="Photo Library"
                        description="To save your captures"
                        granted={mediaLibraryPermission?.granted}
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRequestPermissions}
                >
                    <Text style={styles.buttonText}>Grant Permissions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={openSettings}
                >
                    <Text style={styles.secondaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const PermissionItem = ({ label, description, granted }: { label: string, description: string, granted?: boolean }) => (
    <View style={styles.permissionItem}>
        <View style={[styles.statusDot, { backgroundColor: granted ? '#4CAF50' : '#FF5252' }]} />
        <View>
            <Text style={styles.permissionLabel}>{label}</Text>
            <Text style={styles.permissionDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    permissionList: {
        width: '100%',
        marginBottom: 32,
        gap: 16,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    permissionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    permissionDescription: {
        fontSize: 13,
        color: '#888',
    },
    button: {
        width: '100%',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    secondaryButton: {
        padding: 12,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'underline',
    },
});
