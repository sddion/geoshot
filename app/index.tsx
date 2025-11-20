import { useCameraSettings, CameraMode } from '@/contexts/CameraSettingsContext';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import GeoOverlay from '@/components/GeoOverlay';
import PermissionsScreen from '@/components/PermissionsScreen';
import { useLiveGeoData } from '@/utils/useLiveGeoData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Alert,
  Dimensions,
  Linking,
  Platform,
  GestureResponderEvent,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { getGeoData } from '@/utils/geoOverlay';
import { saveVideoGPSData } from '@/utils/videoGPSData';
import { GeoData } from '@/utils/geoOverlay';
import Constants from 'expo-constants';

const isExpoGo = (typeof expo !== 'undefined' && globalThis.expo?.modules?.ExponentConstants?.executionEnvironment === 'STORE_CLIENT') ||
  (Constants?.expoConfig?.extra?.eas?.projectId == null && Constants?.appOwnership === 'expo');

console.log('Running in Expo Go (index.tsx):', {
  isExpoGo,
  expoConfig: Constants?.expoConfig,
  appOwnership: Constants?.appOwnership
});

// Custom hook to handle media library permissions differently in Expo Go
const useMediaLibraryPermissions = (): [MediaLibrary.PermissionResponse | null, () => Promise<MediaLibrary.PermissionResponse>] => {
  const [permission, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo', 'video']
  });

  if (isExpoGo) {
    const mockResponse: MediaLibrary.PermissionResponse = {
      granted: true,
      canAskAgain: true,
      status: MediaLibrary.PermissionStatus.GRANTED,
      expires: 'never',
      accessPrivileges: 'all'
    };
    return [mockResponse, async () => mockResponse];
  }

  return [permission, requestPermission];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();

  // Toast utility function
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message);
    }
  };

  const { settings, updateSetting } = useCameraSettings();
  const { data: liveGeoData, mapTile: liveMapTile } = useLiveGeoData(settings.geoOverlayEnabled);

  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const [timerCountdown, setTimerCountdown] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showZoomSlider, setShowZoomSlider] = useState<boolean>(false);
  const zoomSliderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [allPermissionsGranted, setAllPermissionsGranted] = useState<boolean>(false);
  const overlayRef = useRef<View>(null);

  // GPS data collection for video recording
  const [recordingGPSData, setRecordingGPSData] = useState<GeoData[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<string>('');
  const gpsCollectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    currentMode,
    setCurrentMode,
    zoom,
    setZoom,
    cycleFlash,
    lastPhotoUri,
    setLastPhotoUri,
  } = useCameraSettings();



  const handleZoomButtonTap = () => {
    setShowZoomSlider(!showZoomSlider);

    // Auto-hide slider after 3 seconds of inactivity
    if (zoomSliderTimeout.current) {
      clearTimeout(zoomSliderTimeout.current);
    }
    if (!showZoomSlider) {
      zoomSliderTimeout.current = setTimeout(() => {
        setShowZoomSlider(false);
      }, 3000);
    }
  };

  const handleZoomSliderChange = (value: number) => {
    // Map 0-1 slider to 0.5-10 zoom range
    const zoomValue = 0.5 + (value * 9.5);
    setZoom(Math.min(1, zoomValue / 10)); // CameraView zoom is 0-1

    // Reset auto-hide timer
    if (zoomSliderTimeout.current) {
      clearTimeout(zoomSliderTimeout.current);
    }
    zoomSliderTimeout.current = setTimeout(() => {
      setShowZoomSlider(false);
    }, 3000);
  };

  useEffect(() => {
    if (focusPoint) {
      Animated.sequence([
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: 200,
          delay: 800,
          useNativeDriver: true,
        }),
      ]).start(() => setFocusPoint(null));
    }
  }, [focusPoint, focusAnimation]);

  // Request camera permission on mount if not granted
  useEffect(() => {
    if (!cameraPermission?.granted && cameraPermission?.canAskAgain) {
      requestCameraPermission();
    }
  }, [cameraPermission?.granted, cameraPermission?.canAskAgain, requestCameraPermission]);

  // Check if all permissions are granted
  useEffect(() => {
    const allGranted =
      cameraPermission?.granted &&
      microphonePermission?.granted &&
      locationPermission?.granted &&
      mediaLibraryPermission?.granted;

    setAllPermissionsGranted(!!allGranted);
  }, [cameraPermission, microphonePermission, locationPermission, mediaLibraryPermission]);

  const openSystemGallery = async () => {
    try {
      // Check media library permission first
      if (!mediaLibraryPermission?.granted) {
        const result = await requestMediaLibraryPermission();
        if (!result.granted) {
          Alert.alert('Permission Required', 'Media Library permission is needed to access your photos.');
          return;
        }
      }

      if (lastPhotoUri) {
        // Get asset info to get the content URI
        const asset = await MediaLibrary.getAssetInfoAsync(lastPhotoUri);
        if (asset && asset.localUri) {
          // Use the content:// URI instead of file:// URI
          const canOpen = await Linking.canOpenURL(asset.localUri);
          if (canOpen) {
            await Linking.openURL(asset.localUri);
          } else {
            // Fallback: open the default gallery app
            if (Platform.OS === 'android') {
              await Linking.openURL('content://media/internal/images/media');
            } else {
              await Linking.openURL('photos-redirect://');
            }
          }
        } else {
          // Fallback: open the default gallery app
          if (Platform.OS === 'android') {
            await Linking.openURL('content://media/internal/images/media');
          } else {
            await Linking.openURL('photos-redirect://');
          }
        }
      } else {
        // No photo yet, just open gallery app
        if (Platform.OS === 'android') {
          await Linking.openURL('content://media/internal/images/media');
        } else {
          await Linking.openURL('photos-redirect://');
        }
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Gallery', 'Could not open gallery app');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    const timerValue = settings.timer;
    if (timerValue !== 'off') {
      const seconds = timerValue === '2s' ? 2 : timerValue === '5s' ? 5 : 10;
      setTimerCountdown(seconds);

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
  };



  const processVideoWithOverlay = async (videoUri: string, gpsData: GeoData[], startTime: string, duration: number) => {
    setIsProcessing(true);
    try {
      // Save the video to media library
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      setLastPhotoUri(asset.uri);

      // Save GPS data alongside the video
      const endTime = new Date().toISOString();
      await saveVideoGPSData(asset.uri, gpsData, startTime, endTime, duration);

      console.log(`Video saved with ${gpsData.length} GPS data points`);
      showToast(`Video saved with GPS data (${gpsData.length} points)!`);
    } catch (error) {
      console.error('Processing error:', error);
      showToast('Failed to save video');
      // Fallback - still try to save video without GPS data
      try {
        await MediaLibrary.createAssetAsync(videoUri);
      } catch (fallbackError) {
        console.error('Fallback save error:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCapture = async () => {
    if (!cameraRef.current) return;

    // Check media library permission before capturing
    if (!mediaLibraryPermission?.granted) {
      const result = await requestMediaLibraryPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Media Library permission is needed to save photos and videos.');
        setIsCapturing(false);
        return;
      }
    }

    setIsCapturing(true);

    try {
      if (currentMode === 'video') {
        // Check microphone permission for video
        if (!microphonePermission?.granted) {
          const result = await requestMicrophonePermission();
          if (!result.granted) {
            Alert.alert('Permission Required', 'Microphone permission is needed to record videos with audio.');
            setIsCapturing(false);
            return;
          }
        }

        if (isRecording) {
          // Stop recording
          cameraRef.current.stopRecording();
          setIsRecording(false);
          // Clear recording timer
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
          // Clear GPS collection interval
          if (gpsCollectionInterval.current) {
            clearInterval(gpsCollectionInterval.current);
            gpsCollectionInterval.current = null;
          }
          setRecordingDuration(0);
        } else {
          // Start recording
          setIsRecording(true);
          setRecordingDuration(0);

          // Initialize GPS data collection
          const startTime = new Date().toISOString();
          setRecordingStartTime(startTime);
          setRecordingGPSData([]);

          // Collect initial GPS data
          if (settings.geoOverlayEnabled && liveGeoData) {
            setRecordingGPSData([liveGeoData]);
          }

          // Start recording timer
          recordingInterval.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
          }, 1000);

          // Start GPS data collection (every 2 seconds)
          if (settings.geoOverlayEnabled) {
            gpsCollectionInterval.current = setInterval(async () => {
              const gpsData = await getGeoData();
              if (gpsData) {
                setRecordingGPSData(prev => [...prev, gpsData]);
              }
            }, 2000);
          }

          // Start recording (this will resolve when stopRecording is called)
          cameraRef.current.recordAsync().then(async (video) => {
            if (video?.uri) {
              if (settings.geoOverlayEnabled && recordingGPSData.length > 0) {
                await processVideoWithOverlay(video.uri, recordingGPSData, recordingStartTime, recordingDuration);
              } else {
                MediaLibrary.createAssetAsync(video.uri).then((asset) => {
                  console.log('Video saved:', asset.uri);
                  setLastPhotoUri(asset.uri);
                });
              }
              // Reset GPS data
              setRecordingGPSData([]);
              setRecordingStartTime('');
            }
          }).catch((error) => {
            console.error('Recording error:', error);
            // Clean up on error
            if (gpsCollectionInterval.current) {
              clearInterval(gpsCollectionInterval.current);
              gpsCollectionInterval.current = null;
            }
            setRecordingGPSData([]);
            setRecordingStartTime('');
          });
        }
      } else {
        const photo = await cameraRef.current.takePictureAsync({
          quality: settings.imageQuality === 'superfine' ? 1 : settings.imageQuality === 'fine' ? 0.8 : 0.6,
        });

        if (photo?.uri) {
          if (settings.geoOverlayEnabled) {
            // Check location permission for GPS overlay
            if (!locationPermission?.granted) {
              const result = await requestLocationPermission();
              if (!result.granted) {
                Alert.alert('GPS Overlay Disabled', 'Location permission is required for GPS overlay. Saving photo without overlay.');
                const asset = await MediaLibrary.createAssetAsync(photo.uri);
                setLastPhotoUri(asset.uri);
                setIsCapturing(false);
                return;
              }
            }

            console.log('GPS overlay enabled - fetching location data...');
            const geoData = await getGeoData();
            if (geoData) {
              console.log('GPS data retrieved:', geoData);
              router.push({
                pathname: '/geo-preview',
                params: { photoUri: photo.uri },
              });
              setIsCapturing(false);
              return;
            } else {
              Alert.alert('GPS Error', 'Failed to get location data. Saving without overlay.');
            }
          }

          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          console.log('Photo saved:', asset.uri);
          setLastPhotoUri(asset.uri);
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const modes: CameraMode[] = ['photo', 'video', 'night', 'portrait'];

  const getModeIcon = (mode: CameraMode) => {
    const iconProps = { size: 20, color: '#fff' };
    switch (mode) {
      case 'photo':
        return <MaterialCommunityIcons name="camera" {...iconProps} />;
      case 'video':
        return <MaterialCommunityIcons name="video" {...iconProps} />;
      case 'night':
        return <MaterialCommunityIcons name="moon-waning-crescent" {...iconProps} />;
      case 'portrait':
        return <MaterialCommunityIcons name="circle-outline" {...iconProps} />;
    }
  };

  const getFlashIcon = () => {
    if (settings.flashMode === 'off') return <MaterialCommunityIcons name="flash-off" size={24} color="#fff" />;
    return <MaterialCommunityIcons name="flash" size={24} color={settings.flashMode === 'on' ? '#FFD700' : '#fff'} />;
  };

  const mapFlashMode = (): FlashMode => {
    switch (settings.flashMode) {
      case 'on':
        return 'on';
      case 'off':
        return 'off';
      default:
        return 'auto';
    }
  };

  return (
    <>
      {!allPermissionsGranted ? (
        <PermissionsScreen onAllPermissionsGranted={() => setAllPermissionsGranted(true)} />
      ) : (
        <View style={styles.container}>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              flash={mapFlashMode()}
              zoom={zoom}
              mode={currentMode === 'video' ? 'video' : 'picture'}
              videoQuality={currentMode === 'video' ? (settings.videoResolution === '4k' ? '2160p' : settings.videoResolution) : undefined}
              videoStabilizationMode={settings.videoStabilization ? 'auto' : 'off'}
            />

            {/* Grid Overlay - Apply gridStyle setting */}
            {settings.gridStyle !== 'off' && (
              <View style={[styles.gridOverlay, { zIndex: 1 }]} pointerEvents="none">
                {settings.gridStyle === '3x3' && (
                  <>
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '33.33%' }]} />
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '66.66%' }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '33.33%' }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '66.66%' }]} />
                  </>
                )}
                {settings.gridStyle === 'golden' && (
                  <>
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '38.2%' }]} />
                    <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '61.8%' }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '38.2%' }]} />
                    <View style={[styles.gridLine, styles.gridLineVertical, { left: '61.8%' }]} />
                  </>
                )}
              </View>
            )}

            {focusPoint && (
              <Animated.View
                style={[
                  styles.focusIndicator,
                  {
                    left: focusPoint.x - 40,
                    top: focusPoint.y - 40,
                    opacity: focusAnimation,
                    zIndex: 2,
                  },
                ]}
                pointerEvents="none"
              />
            )}

            {/* Single Zoom Button - Right Side, More Centered - Only show when slider is hidden */}
            {!showZoomSlider && (
              <TouchableOpacity
                style={styles.singleZoomButton}
                onPress={handleZoomButtonTap}
              >
                <Text style={styles.singleZoomText}>{(zoom * 10).toFixed(1)}×</Text>
              </TouchableOpacity>
            )}

            {/* Vertical Zoom Slider - Appears on Tap */}
            {showZoomSlider && (
              <View
                style={styles.verticalZoomSlider}
                pointerEvents="box-none"
              >
                <Pressable
                  style={styles.verticalSliderTrack}
                  onTouchStart={(e: GestureResponderEvent) => {
                    // Prevent immediate hiding when touching the slider
                    if (zoomSliderTimeout.current) {
                      clearTimeout(zoomSliderTimeout.current);
                    }
                    // Handle tap to set zoom
                    const { locationY } = e.nativeEvent;
                    const sliderHeight = 200;
                    const value = Math.max(0, Math.min(1, 1 - (locationY / sliderHeight)));
                    handleZoomSliderChange(value);
                  }}
                  onTouchMove={(e: GestureResponderEvent) => {
                    const { locationY } = e.nativeEvent;
                    const sliderHeight = 200;
                    const value = Math.max(0, Math.min(1, 1 - (locationY / sliderHeight)));
                    handleZoomSliderChange(value);
                  }}
                  onTouchEnd={() => {
                    // Restart hide timer when touch ends
                    zoomSliderTimeout.current = setTimeout(() => {
                      setShowZoomSlider(false);
                    }, 3000);
                  }}
                >
                  <View style={[styles.verticalSliderFill, { height: `${((zoom * 10 - 0.5) / 9.5) * 100}%` }]} />
                </Pressable>
              </View>
            )}
          </View>



          <SafeAreaView style={styles.topControls} edges={['top']}>
            {/* Flash - Left */}
            <TouchableOpacity style={styles.iconButton} onPress={cycleFlash}>
              {getFlashIcon()}
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Center Icons: GPS only */}
            <View style={styles.centerIcons}>
              <TouchableOpacity
                style={[
                  styles.iconBadge,
                  { backgroundColor: settings.geoOverlayEnabled ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)' }
                ]}
                onPress={() => updateSetting('geoOverlayEnabled', !settings.geoOverlayEnabled)}
              >
                <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }} />

            {/* Settings - Right */}
            {!isRecording ? (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
              >
                <MaterialCommunityIcons name="cog" size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconButton} />
            )}
          </SafeAreaView>

          <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
            {/* Mode Selector at Top */}
            {!isRecording && (
              <View style={styles.modeSelector}>
                {modes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={styles.modeButton}
                    onPress={() => setCurrentMode(mode)}
                  >
                    <View style={{ marginBottom: 4 }}>
                      {getModeIcon(mode)}
                    </View>
                    <Text
                      style={[
                        styles.modeText,
                        currentMode === mode && styles.modeTextActive,
                      ]}
                    >
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Capture Row */}
            <View style={styles.captureRow}>
              {!isRecording ? (
                <TouchableOpacity
                  style={styles.thumbnailButton}
                  onPress={openSystemGallery}
                >
                  {lastPhotoUri ? (
                    <Image
                      source={{ uri: lastPhotoUri }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailEmpty}>
                      <MaterialCommunityIcons name="image" size={24} color="#888" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.thumbnailButton} />
              )}

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCapture}
                disabled={isCapturing && currentMode !== 'video'}
              >
                {isRecording ? (
                  <View style={styles.recordingButton} />
                ) : (
                  <View style={currentMode === 'video' ? styles.videoRecordButton : styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              {!isRecording ? (
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={toggleCameraFacing}
                >
                  <MaterialCommunityIcons name="sync" size={32} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.flipButton} />
              )}
            </View>
          </SafeAreaView>

          {
            timerCountdown > 0 && (
              <View style={styles.timerOverlay}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{timerCountdown}</Text>
                </View>
              </View>
            )
          }

          {/* Recording Indicator */}
          {
            isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )
          }

          {/* Live GPS Overlay - Highest Z-Index to ensure visibility */}
          {
            settings.geoOverlayEnabled && (
              <View
                ref={overlayRef}
                style={styles.liveOverlayContainer}
                collapsable={false} // Important for captureRef
                pointerEvents="none" // Allow touches to pass through
              >
                <GeoOverlay
                  geoData={liveGeoData}
                  mapTile={liveMapTile}
                  imageWidth={SCREEN_WIDTH - 32}
                />
              </View>
            )
          }

          {/* Processing Overlay */}
          {
            isProcessing && (
              <View style={styles.capturingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={[styles.capturingText, { marginTop: 16 }]}>Processing Video...</Text>
              </View>
            )
          }
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  liveOverlayContainer: {
    position: 'absolute',
    bottom: 240,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  singleZoomButton: {
    position: 'absolute',
    right: 20,
    top: '30%',
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  singleZoomText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  verticalZoomSlider: {
    position: 'absolute',
    right: 40,
    top: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalSliderTrack: {
    width: 50,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalSliderFill: {
    position: 'absolute',
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 25,
  },
  focusIndicator: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 40,
  },
  topControls: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
  },
  thumbnailButton: {
    width: 56,
    height: 56,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmpty: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  recordingButton: {
    width: 32,
    height: 32,
    borderRadius: 4, // Soft square for stop button
    backgroundColor: '#FF3B30',
  },
  videoRecordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'transparent', // To match size of inner button
  },

  flipButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  modeButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modeTextActive: {
    color: '#FFD700',
  },
  timerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700' as const,
    color: '#fff',
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  capturingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  recordingIndicator: {
    position: 'absolute' as const,
    top: 120, // Moved down from 80 to avoid HDR/GPS buttons
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    zIndex: 50,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
