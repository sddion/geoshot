import { useState, useRef, useCallback } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { Camera, PhotoFile, VideoFile, CameraRuntimeError, CameraCaptureError } from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import type { CameraMode } from '@/contexts/CameraSettingsContext';
import { getGeoData } from '@/utils/geoOverlay';

import { Router } from 'expo-router';

interface UseCameraCaptureProps {
    cameraRef: React.RefObject<Camera | null>;
    currentMode: CameraMode;
    flashMode: 'off' | 'on' | 'auto';
    imageQuality: 'normal' | 'fine' | 'superfine';
    geoOverlayEnabled: boolean;
    videoGPSOverlayEnabled: boolean;
    router: Router;
    setLastPhotoUri: (uri: string) => void;
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
    videoGPSOverlayEnabled,
    router,
    setLastPhotoUri,
}: UseCameraCaptureProps) {
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [timerCountdown, setTimerCountdown] = useState<number>(0);
    const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const showToast = (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('', message);
        }
    };

    const capturePhoto = useCallback(async () => {
        if (!cameraRef.current) return;

        try {
            const photo: PhotoFile = await cameraRef.current.takePhoto({
                flash: flashMode,
                enableShutterSound: false,
            });

            if (photo?.path) {
                const photoUri = `file://${photo.path}`;

                if (geoOverlayEnabled) {
                    // Navigate to geo-preview for GPS overlay
                    const geoData = await getGeoData();
                    if (geoData) {
                        router.push({
                            pathname: '/geo-preview',
                            params: { photoUri },
                        });
                        return;
                    } else {
                        Alert.alert('GPS Error', 'Failed to get location data. Saving without overlay.');
                    }
                }

                // Save without GPS overlay
                const asset = await MediaLibrary.createAssetAsync(photoUri);
                setLastPhotoUri(asset.uri);
                showToast('Photo saved!');
            }
        } catch (error) {
            console.error('Photo capture error:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
        }
    }, [cameraRef, flashMode, imageQuality, geoOverlayEnabled, router, setLastPhotoUri]);

    const startVideoRecording = useCallback(async () => {
        if (!cameraRef.current || isRecording) return;

        try {
            setIsRecording(true);
            setRecordingDuration(0);

            // Start recording duration timer
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            // Start recording (frame processor will add GPS overlay if enabled)
            cameraRef.current.startRecording({
                flash: flashMode === 'on' ? 'on' : 'off',
                onRecordingFinished: async (video: VideoFile) => {
                    if (video?.path) {
                        const videoUri = `file://${video.path}`;
                        const asset = await MediaLibrary.createAssetAsync(videoUri);
                        setLastPhotoUri(asset.uri);
                        showToast('Video saved!');
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

    const handleCapture = useCallback(async (timerSeconds?: number) => {
        if (isCapturing) return;

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
    }, [isCapturing]);

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
