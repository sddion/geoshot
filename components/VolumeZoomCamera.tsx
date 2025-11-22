import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Dimensions,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    CameraRuntimeError,
} from 'react-native-vision-camera';
import { VolumeManager } from 'react-native-volume-manager';
import { volumeZoomCameraStyles } from '@/styles/component.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Enhanced Camera Component with Volume Button Zoom Control
 * 
 * Features:
 * - Volume Up: Zoom In
 * - Volume Down: Zoom Out
 * - Supports both photo and video modes
 * - Production-ready with proper error handling
 * - New Architecture (Fabric) compatible
 */
export default function VolumeZoomCamera() {
    const cameraRef = useRef<Camera>(null);
    const { hasPermission, requestPermission } = useCameraPermission();

    // Camera states
    const [isActive, setIsActive] = useState(true);
    const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
    const [isRecording, setIsRecording] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Volume tracking
    const previousVolumeRef = useRef<number | null>(null);
    const volumeListenerRef = useRef<any>(null);

    // Get camera device
    const device = useCameraDevice('back');

    // Zoom configuration
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 10;
    const ZOOM_STEP = 0.5;

    /**
     * Initialize volume button zoom control
     */
    const initializeVolumeZoom = useCallback(async () => {
        try {
            // Hide native volume UI
            await VolumeManager.showNativeVolumeUI({ enabled: false });

            // Get initial volume
            const initialVolume = await VolumeManager.getVolume();
            previousVolumeRef.current = initialVolume.volume;

            // Add volume change listener
            volumeListenerRef.current = VolumeManager.addVolumeListener((result) => {
                const currentVolume = result.volume;

                if (previousVolumeRef.current !== null) {
                    const volumeDelta = currentVolume - previousVolumeRef.current;

                    // Detect volume change direction
                    if (Math.abs(volumeDelta) > 0.001) {
                        setZoom((prevZoom) => {
                            let newZoom = prevZoom;

                            if (volumeDelta > 0) {
                                // Volume Up -> Zoom In
                                newZoom = Math.min(MAX_ZOOM, prevZoom + ZOOM_STEP);
                            } else {
                                // Volume Down -> Zoom Out
                                newZoom = Math.max(MIN_ZOOM, prevZoom - ZOOM_STEP);
                            }

                            return newZoom;
                        });

                        // Restore volume to previous level to keep it constant
                        setTimeout(() => {
                            if (previousVolumeRef.current !== null) {
                                VolumeManager.setVolume(previousVolumeRef.current, {
                                    showUI: false,
                                    playSound: false,
                                });
                            }
                        }, 50);
                    }
                }

                previousVolumeRef.current = currentVolume;
            });
        } catch (error) {
            console.error('Failed to initialize volume zoom:', error);
        }
    }, []);

    /**
     * Cleanup volume listener
     */
    const cleanupVolumeListener = useCallback(async () => {
        if (volumeListenerRef.current) {
            volumeListenerRef.current.remove();
            volumeListenerRef.current = null;
        }
        await VolumeManager.showNativeVolumeUI({ enabled: true });
        previousVolumeRef.current = null;
    }, []);

    /**
     * Setup volume listener on mount
     */
    useEffect(() => {
        if (hasPermission) {
            initializeVolumeZoom();
        }

        return () => {
            cleanupVolumeListener();
        };
    }, [hasPermission, initializeVolumeZoom, cleanupVolumeListener]);

    /**
     * Request camera permission on mount
     */
    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    /**
     * Take photo
     */
    const takePhoto = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });

            Alert.alert('Success', `Photo saved: ${photo.path} `);
        } catch (error) {
            console.error('Photo capture error:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    }, []);

    /**
     * Toggle video recording
     */
    const toggleRecording = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            if (isRecording) {
                // Stop recording
                await cameraRef.current.stopRecording();
                setIsRecording(false);
            } else {
                // Start recording
                setIsRecording(true);
                cameraRef.current.startRecording({
                    flash: 'off',
                    onRecordingFinished: (video) => {
                        setIsRecording(false);
                        Alert.alert('Success', `Video saved: ${video.path} `);
                    },
                    onRecordingError: (error) => {
                        setIsRecording(false);
                        console.error('Recording error:', error);
                        Alert.alert('Error', `Failed to record video: ${error.message} `);
                    },
                });
            }
        } catch (error) {
            setIsRecording(false);
            console.error('Recording toggle error:', error);
            Alert.alert('Error', 'Failed to toggle recording');
        }
    }, [isRecording]);

    /**
     * Handle camera errors
     */
    const handleCameraError = useCallback((error: CameraRuntimeError) => {
        console.error('Camera error:', error);

        if (error.code === 'system/camera-is-restricted') {
            Alert.alert(
                'Camera Restricted',
                'Camera is restricted by the OS. Please check device policies or parental controls.'
            );
        } else {
            Alert.alert('Camera Error', error.message);
        }
    }, []);

    /**
     * Toggle camera mode
     */
    const toggleMode = useCallback(() => {
        if (isRecording) {
            Alert.alert('Warning', 'Please stop recording before switching modes');
            return;
        }
        setCameraMode((prev) => (prev === 'photo' ? 'video' : 'photo'));
    }, [isRecording]);

    // Permission checks
    if (!hasPermission) {
        return (
            <View style={volumeZoomCameraStyles.container}>
                <Text style={volumeZoomCameraStyles.message}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={volumeZoomCameraStyles.container}>
                <Text style={volumeZoomCameraStyles.message}>Camera device not found</Text>
            </View>
        );
    }

    return (
        <View style={volumeZoomCameraStyles.container}>
            {/* Camera View */}
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                photo={cameraMode === 'photo'}
                video={cameraMode === 'video'}
                zoom={zoom}
                onError={handleCameraError}
            />

            {/* UI Overlay */}
            <View style={volumeZoomCameraStyles.overlay}>
                {/* Zoom Indicator */}
                <View style={volumeZoomCameraStyles.zoomContainer}>
                    <Text style={volumeZoomCameraStyles.zoomText}>{zoom.toFixed(1)}x</Text>
                    <Text style={volumeZoomCameraStyles.zoomHint}>Use Volume Buttons</Text>
                </View>

                {/* Mode Indicator */}
                <View style={volumeZoomCameraStyles.modeContainer}>
                    <Text style={volumeZoomCameraStyles.modeText}>
                        {cameraMode.toUpperCase()}
                        {isRecording && ' - RECORDING'}
                    </Text>
                </View>

                {/* Controls */}
                <View style={volumeZoomCameraStyles.controls}>
                    {/* Mode Toggle */}
                    <TouchableOpacity
                        style={volumeZoomCameraStyles.button}
                        onPress={toggleMode}
                        disabled={isRecording}
                    >
                        <Text style={volumeZoomCameraStyles.buttonText}>
                            {cameraMode === 'photo' ? 'VIDEO' : 'PHOTO'}
                        </Text>
                    </TouchableOpacity>

                    {/* Capture/Record Button */}
                    <TouchableOpacity
                        style={[
                            volumeZoomCameraStyles.captureButton,
                            isRecording && volumeZoomCameraStyles.captureButtonRecording,
                        ]}
                        onPress={cameraMode === 'photo' ? takePhoto : toggleRecording}
                    >
                        <View
                            style={[
                                volumeZoomCameraStyles.captureButtonInner,
                                isRecording && volumeZoomCameraStyles.captureButtonInnerRecording,
                            ]}
                        />
                    </TouchableOpacity>

                    {/* Zoom Reset */}
                    <TouchableOpacity
                        style={volumeZoomCameraStyles.button}
                        onPress={() => setZoom(1)}
                    >
                        <Text style={volumeZoomCameraStyles.buttonText}>1x</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
