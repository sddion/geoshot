import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, AppState } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import Constants from 'expo-constants';

const isExpoGo = (typeof expo !== 'undefined' && globalThis.expo?.modules?.ExponentConstants?.executionEnvironment === 'STORE_CLIENT') ||
    (Constants?.expoConfig?.extra?.eas?.projectId == null && Constants?.appOwnership === 'expo');

console.log('Running in Expo Go (PermissionsScreen):', {
    isExpoGo,
    expoConfig: Constants?.expoConfig,
    appOwnership: Constants?.appOwnership
});

// Custom hook to handle media library permissions differently in Expo Go
const useMediaLibraryPermissions = (): [MediaLibrary.PermissionResponse | null, () => Promise<MediaLibrary.PermissionResponse>] => {
    console.log('useMediaLibraryPermissions called (PermissionsScreen), isExpoGo:', isExpoGo);

    // In Expo Go, return a mock permission object without calling the real hook
    if (isExpoGo) {
        console.log('Returning mock permissions for Expo Go (PermissionsScreen)');
        const mockResponse: MediaLibrary.PermissionResponse = {
            granted: true,
            canAskAgain: true,
            status: MediaLibrary.PermissionStatus.GRANTED,
            expires: 'never',
            accessPrivileges: 'all'
        };
        return [mockResponse, async () => mockResponse];
    }

    console.log('Calling real MediaLibrary.usePermissions (PermissionsScreen)');
    const [permission, requestPermission] = MediaLibrary.usePermissions({
        granularPermissions: ['photo', 'video']
    });

    return [permission, requestPermission];
};

interface PermissionsScreenProps {
    onAllPermissionsGranted: () => void;
}

export default function PermissionsScreen({ onAllPermissionsGranted }: PermissionsScreenProps) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
    const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();

    // Track if we are checking permissions to avoid flickering
    const [isChecking, setIsChecking] = useState(true);

    const checkPermissions = useCallback(async () => {
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
    }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission, onAllPermissionsGranted]);

    useEffect(() => {
        checkPermissions();
    }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission, checkPermissions]); // Added checkPermissions to dependencies

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
    }, [checkPermissions]);

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

                <Text style={styles.title}>Permissions Required</Text>
                <Text style={styles.subtitle}>
                    We need access to your Camera, Microphone, Location, and Photo Library to function correctly. Please enable them in settings.
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
                    onPress={openSettings}
                >
                    <Text style={styles.buttonText}>Open App Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleRequestPermissions}
                >
                    <Text style={styles.secondaryButtonText}>Try Again</Text>
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
