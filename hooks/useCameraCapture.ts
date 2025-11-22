import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { Camera, PhotoFile, VideoFile, CameraRuntimeError, CameraCaptureError } from 'react-native-vision-camera';
import type { CameraMode } from '@/contexts/CameraSettingsContext';
import { getGeoData, GeoData } from '@/utils/geoOverlay';
import { Router } from 'expo-router';
import { saveFileToAppFolder } from '@/utils/mediaUtils';
import * as ImageManipulator from 'expo-image-manipulator';


interface UseCameraCaptureProps {
    cameraRef: React.RefObject<Camera | null>;
    currentMode: CameraMode;
    flashMode: 'off' | 'on' | 'auto';
    imageQuality: 'normal' | 'fine' | 'superfine';
    geoOverlayEnabled: boolean;
    videoGPSOverlayEnabled: boolean;
    liveGeoData: GeoData | null;
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
    liveGeoData,
    router,
    setLastPhotoUri,
}: UseCameraCaptureProps) {
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [timerCountdown, setTimerCountdown] = useState<number>(0);
    const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Refs for GPS recording
    const currentGeoDataRef = useRef<GeoData | null>(null);
    const gpsTrackRef = useRef<GeoData[]>([]);
    const recordingStartTimeRef = useRef<string>('');

    // Update ref when new data comes in
    useEffect(() => {
        if (liveGeoData) {
            currentGeoDataRef.current = liveGeoData;
        }
    }, [liveGeoData]);

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
                enableShutterSound: false,

            });

            if (photo?.path) {
                const photoUri = `file://${photo.path}`;

                // ...

                // Compress image based on quality setting
                let finalUri = photoUri;
                if (imageQuality !== 'superfine') {
                    const compression = imageQuality === 'fine' ? 0.8 : 0.5;
                    const manipulated = await ImageManipulator.manipulateAsync(
                        photoUri,
                        [],
                        { compress: compression, format: ImageManipulator.SaveFormat.JPEG }
                    );
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
    }, [cameraRef, flashMode, imageQuality, geoOverlayEnabled, router, setLastPhotoUri]);

    const startVideoRecording = useCallback(async () => {
        if (!cameraRef.current || isRecording) return;

        try {
            setIsRecording(true);
            setRecordingDuration(0);

            // Reset GPS track
            gpsTrackRef.current = [];
            if (currentGeoDataRef.current) {
                gpsTrackRef.current.push(currentGeoDataRef.current);
            }
            recordingStartTimeRef.current = new Date().toISOString();

            // Start recording duration timer and GPS logger
            recordingInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);

                // Log GPS point
                if (currentGeoDataRef.current) {
                    gpsTrackRef.current.push(currentGeoDataRef.current);
                }
            }, 1000);

            // Start recording (frame processor will add GPS overlay if enabled)
            cameraRef.current.startRecording({
                flash: flashMode === 'on' ? 'on' : 'off',
                onRecordingFinished: async (video: VideoFile) => {
                    if (video?.path) {
                        const videoUri = `file://${video.path}`;
                        const endTime = new Date().toISOString();
                        const duration = (new Date(endTime).getTime() - new Date(recordingStartTimeRef.current).getTime()) / 1000;

                        // Save video to GeoShot album
                        const savedUri = await saveFileToAppFolder(videoUri, 'video');
                        if (savedUri) {
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
    }, [cameraRef, isRecording, flashMode, setLastPhotoUri, videoGPSOverlayEnabled]);

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
