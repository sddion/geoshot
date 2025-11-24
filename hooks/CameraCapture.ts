import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { Camera, PhotoFile, VideoFile, CameraRuntimeError, CameraCaptureError } from 'react-native-vision-camera';
import type { CameraMode } from '@/contexts/CameraSettingsContext';
import { getGeoData, GeoData } from '@/utils/geoOverlay';
import { Router } from 'expo-router';
import { saveFileToAppFolder } from '@/utils/mediaUtils';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';


interface UseCameraCaptureProps {
    cameraRef: React.RefObject<Camera | null>;
    currentMode: CameraMode;
    flashMode: 'off' | 'on' | 'auto';
    imageQuality: 'normal' | 'fine' | 'superfine';
    geoOverlayEnabled: boolean;
    liveGeoData: GeoData | null;
    router: Router;
    setLastPhotoUri: (uri: string) => void;
    shutterSound: boolean;
}

/**
 * Custom hook for photo/video capture functionality
 */
export function useCameraCapture({
    cameraRef,
    currentMode,
    flashMode,
    imageQuality,
    geoOverlayEnabled,
    liveGeoData,
    router,
    setLastPhotoUri,
    shutterSound,
}: UseCameraCaptureProps) {
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [timerCountdown, setTimerCountdown] = useState<number>(0);
    const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastCaptureTimeRef = useRef<number>(0); // For debouncing captures
    const CAPTURE_DEBOUNCE_MS = 300; // Minimum time between captures



    const showToast = (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('', message);
        }
    };

    // Removed local saveFileToAppFolder definition as it is now imported

    const capturePhoto = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            const photo: PhotoFile = await cameraRef.current.takePhoto({
                flash: currentMode === 'night' ? 'off' : flashMode, // Disable flash for night mode to rely on exposure
                enableShutterSound: shutterSound,
            });

            if (photo?.path) {
                const photoUri = `file://${photo.path}`;

                // Crop to 1:1 if in portrait mode
                let finalUri = photoUri;
                if (currentMode === 'portrait') {
                    // Get image dimensions to calculate square crop
                    const imageInfo = await ImageManipulator.manipulateAsync(
                        photoUri,
                        [],
                        { format: ImageManipulator.SaveFormat.JPEG }
                    );

                    const { width, height } = imageInfo;
                    const size = Math.min(width, height);
                    const originX = (width - size) / 2;
                    const originY = (height - size) / 2;

                    // Crop to 1:1 square
                    const croppedResult = await ImageManipulator.manipulateAsync(
                        photoUri,
                        [
                            {
                                crop: {
                                    originX,
                                    originY,
                                    width: size,
                                    height: size,
                                },
                            },
                        ],
                        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    finalUri = croppedResult.uri;

                    // Clean up original photo
                    try {
                        await FileSystem.deleteAsync(photoUri, { idempotent: true });
                    } catch (e) {
                        console.warn('Failed to delete original photo:', e);
                    }
                }

                // Compress image based on quality setting (skip if already processed for portrait)
                if (imageQuality !== 'superfine' && currentMode !== 'portrait') {
                    const compression = imageQuality === 'fine' ? 0.8 : 0.5;
                    const manipulated = await ImageManipulator.manipulateAsync(
                        finalUri,
                        [],
                        { compress: compression, format: ImageManipulator.SaveFormat.JPEG }
                    );

                    // Clean up the previous file
                    try {
                        await FileSystem.deleteAsync(finalUri, { idempotent: true });
                    } catch (e) {
                        console.warn('Failed to delete uncompressed photo:', e);
                    }
                    finalUri = manipulated.uri;
                } else if (currentMode === 'portrait' && imageQuality !== 'superfine') {
                    // Apply compression to already-cropped portrait photo
                    const compression = imageQuality === 'fine' ? 0.8 : 0.5;
                    const manipulated = await ImageManipulator.manipulateAsync(
                        finalUri,
                        [],
                        { compress: compression, format: ImageManipulator.SaveFormat.JPEG }
                    );

                    // Clean up the uncompressed cropped file
                    try {
                        await FileSystem.deleteAsync(finalUri, { idempotent: true });
                    } catch (e) {
                        console.warn('Failed to delete uncompressed photo:', e);
                    }
                    finalUri = manipulated.uri;
                }

                if (geoOverlayEnabled) {
                    // Navigate to geo-preview for GPS overlay
                    const geoData = await getGeoData();
                    if (geoData) {
                        router.push({
                            pathname: '/geo-preview',
                            params: { photoUri: finalUri },
                        });
                        return;
                    } else {
                        Alert.alert('GPS Error', 'Failed to get location data. Saving without overlay.');
                    }
                }

                // Save without GPS overlay
                const savedUri = await saveFileToAppFolder(finalUri, 'photo');
                if (savedUri) {
                    setLastPhotoUri(savedUri);
                    showToast('Photo saved to GeoShot album!');
                } else {
                    showToast('Failed to save photo');
                }
            }
        } catch (error) {
            console.error('Photo capture error:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        }
    }, [cameraRef, currentMode, flashMode, imageQuality, geoOverlayEnabled, router, setLastPhotoUri, shutterSound]);

    const startVideoRecording = useCallback(async () => {
        if (!cameraRef.current || isRecording) return;

        try {
            setIsRecording(true);
            setRecordingDuration(0);

            // Start recording duration timer
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            cameraRef.current.startRecording({
                flash: flashMode === 'on' ? 'on' : 'off',
                onRecordingFinished: async (video: VideoFile) => {
                    if (video?.path) {
                        const videoUri = `file://${video.path}`;

                        // Save video to GeoShot album
                        const savedUri = await saveFileToAppFolder(videoUri, 'video');
                        if (savedUri) {
                            setLastPhotoUri(savedUri); // Update thumbnail with video
                            console.log('Video saved:', savedUri);
                            showToast('Video saved to GeoShot album!');
                        } else {
                            showToast('Failed to save video');
                        }
                    }
                },
                onRecordingError: (error: CameraCaptureError) => {
                    console.error('Recording error:', error);
                    Alert.alert('Error', `Failed to record video: ${error.message}`);
                },
            });
        } catch (error) {
            console.error('Start recording error:', error);
            setIsRecording(false);
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
                recordingInterval.current = null;
            }
        }
    }, [cameraRef, isRecording, flashMode, setLastPhotoUri]);

    const stopVideoRecording = useCallback(async () => {
        if (!cameraRef.current || !isRecording) return;

        try {
            await cameraRef.current.stopRecording();
            setIsRecording(false);

            // Clear recording timer
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
                recordingInterval.current = null;
            }
            setRecordingDuration(0);
        } catch (error) {
            console.error('Stop recording error:', error);
        }
    }, [cameraRef, isRecording]);

    const executeCapture = useCallback(async () => {
        setIsCapturing(true);

        try {
            if (currentMode === 'video') {
                if (isRecording) {
                    await stopVideoRecording();
                } else {
                    await startVideoRecording();
                }
            } else {
                await capturePhoto();
            }
        } finally {
            setIsCapturing(false);
        }
    }, [currentMode, isRecording, capturePhoto, startVideoRecording, stopVideoRecording]);

    const handleCapture = useCallback(async (timerSeconds?: number) => {
        if (isCapturing) return;

        // Debounce to prevent multiple rapid captures
        const now = Date.now();
        if (now - lastCaptureTimeRef.current < CAPTURE_DEBOUNCE_MS) {
            console.log('Capture debounced - too soon since last capture');
            return;
        }
        lastCaptureTimeRef.current = now;

        // Handle timer countdown
        if (timerSeconds && timerSeconds > 0) {
            setTimerCountdown(timerSeconds);

            const interval = setInterval(() => {
                setTimerCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        executeCapture();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return;
        }

        executeCapture();
    }, [isCapturing, executeCapture]);

    return {
        isCapturing,
        isRecording,
        recordingDuration,
        timerCountdown,
        handleCapture,
        startVideoRecording,
        stopVideoRecording,
    };
}
