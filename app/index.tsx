import { useCameraSettings, CameraMode } from '@/contexts/CameraSettingsContext';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import GeoOverlay from '@/components/GeoOverlay';
import { useLiveGeoData } from '@/utils/useLiveGeoData';
import {
  Settings,
  Zap,
  ZapOff,
  RotateCcw,
  Image as ImageIcon,
  Circle,
  Video,
  Moon,
  Aperture,
  MapPin,
} from 'lucide-react-native';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { getGeoData } from '@/utils/geoOverlay';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
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
  console.log('useMediaLibraryPermissions called (index.tsx), isExpoGo:', isExpoGo);

  // In Expo Go, return a mock permission object without calling the real hook
  if (isExpoGo) {
    console.log('Returning mock permissions for Expo Go (index.tsx)');
    const mockResponse: MediaLibrary.PermissionResponse = {
      granted: true,
      canAskAgain: true,
      status: MediaLibrary.PermissionStatus.GRANTED,
      expires: 'never',
      accessPrivileges: 'all'
    };
    return [mockResponse, async () => mockResponse];
  }

  console.log('Calling real MediaLibrary.usePermissions (index.tsx)');
  const [permission, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo', 'video']
  });

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
  const overlayRef = useRef<View>(null);

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

  // Get aspect ratio from settings
  const getCameraAspectRatio = () => {
    switch (settings.photoAspectRatio) {
      case '16:9':
        return 16 / 9;
      case '4:3':
        return 4 / 3;
      case '1:1':
        return 1;
      default:
        return 4 / 3;
    }
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
  }, []);

  const openSystemGallery = async () => {
    try {
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



  const processVideoWithOverlay = async (videoUri: string) => {
    setIsProcessing(true);
    try {
      // Capture the overlay as an image
      const overlayUri = await captureRef(overlayRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const outputUri = `${(FileSystem as any).cacheDirectory}output_${Date.now()}.mp4`;

      // FFmpeg command to overlay image on video
      // Scale overlay to video size? For now, simple overlay at 0:0
      const command = `-i "${videoUri}" -i "${overlayUri}" -filter_complex "overlay=0:0" -c:v libx264 -preset ultrafast "${outputUri}"`;

      console.log('Starting FFmpeg processing...');
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        console.log('FFmpeg processing successful');
        const asset = await MediaLibrary.createAssetAsync(outputUri);
        setLastPhotoUri(asset.uri);
        Alert.alert('Success', 'Video saved with GPS overlay!');
      } else {
        console.error('FFmpeg processing failed');
        const logs = await session.getLogs();
        console.log('FFmpeg Logs:', logs);
        Alert.alert('Error', 'Failed to process video overlay. Saving original.');
        // Fallback to original video
        const asset = await MediaLibrary.createAssetAsync(videoUri);
        setLastPhotoUri(asset.uri);
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'An error occurred while processing video.');
      // Fallback
      await MediaLibrary.createAssetAsync(videoUri);
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
          setRecordingDuration(0);
        } else {
          // Start recording
          setIsRecording(true);
          setRecordingDuration(0);
          // Start recording timer
          recordingInterval.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
          }, 1000);

          // Start recording (this will resolve when stopRecording is called)
          cameraRef.current.recordAsync().then(async (video) => {
            if (video?.uri) {
              if (settings.geoOverlayEnabled && overlayRef.current) {
                await processVideoWithOverlay(video.uri);
              } else {
                MediaLibrary.createAssetAsync(video.uri).then((asset) => {
                  console.log('Video saved:', asset.uri);
                  setLastPhotoUri(asset.uri);
                });
              }
            }
          }).catch((error) => {
            console.error('Recording error:', error);
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
                pathname: '/geo-preview' as any,
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

  const handleTapToFocus = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY });
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const getModeIcon = (mode: CameraMode) => {
    switch (mode) {
      case 'photo':
        return <Aperture size={20} color="#fff" />;
      case 'video':
        return <Video size={20} color="#fff" />;
      case 'night':
        return <Moon size={20} color="#fff" />;
      case 'portrait':
        return <Circle size={20} color="#fff" />;
    }
  };

  const getFlashIcon = () => {
    if (settings.flashMode === 'off') return <ZapOff size={24} color="#fff" />;
    return <Zap size={24} color={settings.flashMode === 'on' ? '#FFD700' : '#fff'} />;
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

  const modes: CameraMode[] = ['photo', 'video', 'night', 'portrait'];

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={[
            styles.camera,
            { aspectRatio: getCameraAspectRatio() }
          ]}
          facing={facing}
          flash={mapFlashMode()}
          zoom={zoom}
          onTouchEnd={handleTapToFocus}
          mode={currentMode === 'video' ? 'video' : 'picture'}
          videoQuality={currentMode === 'video' ? (settings.videoResolution === '4k' ? '2160p' : settings.videoResolution) : undefined}
          videoStabilizationMode={settings.videoStabilization ? 'auto' : 'off'}
        />

        {/* Grid Overlay - Apply gridStyle setting */}
        {settings.gridStyle !== 'off' && (
          <View style={[styles.gridOverlay, { zIndex: 1 }]}>
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
          <Pressable
            style={styles.verticalZoomSlider}
            onTouchStart={(e: GestureResponderEvent) => {
              // Prevent immediate hiding when touching the slider
              if (zoomSliderTimeout.current) {
                clearTimeout(zoomSliderTimeout.current);
              }
            }}
            onTouchEnd={() => {
              // Restart hide timer when touch ends
              zoomSliderTimeout.current = setTimeout(() => {
                setShowZoomSlider(false);
              }, 3000);
            }}
          >
            <View style={styles.verticalSliderTrack}>
              <View style={[styles.verticalSliderFill, { height: `${((zoom * 10 - 0.5) / 9.5) * 100}%` }]} />
              <Pressable
                style={[styles.verticalSliderThumb, { bottom: `${((zoom * 10 - 0.5) / 9.5) * 100}%` }]}
                onTouchMove={(e) => {
                  const { locationY } = e.nativeEvent;
                  const sliderHeight = 200;
                  const value = Math.max(0, Math.min(1, 1 - (locationY / sliderHeight)));
                  handleZoomSliderChange(value);
                }}
              />
            </View>
          </Pressable>
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
            <MapPin size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* Settings - Right */}
        {!isRecording ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/settings' as any)}
          >
            <Settings size={24} color="#fff" />
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
                  <ImageIcon size={24} color="#888" />
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
              <RotateCcw size={32} color="#fff" />
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
            <Text style={styles.capturingText}>Processing Video...</Text>
            <Text style={[styles.capturingText, { fontSize: 14, marginTop: 8 }]}>Adding GPS Overlay</Text>
          </View>
        )
      }
    </View >
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
    bottom: 220, // Moved higher - above bottom controls
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100, // Increased zIndex
  },
  singleZoomButton: {
    position: 'absolute',
    right: 20,
    top: '30%', // Moved up further
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  singleZoomText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  verticalZoomSlider: {
    position: 'absolute',
    right: 80, // Moved more to the left (was 20)
    top: '20%', // Moved up to match button shift
    alignItems: 'center',
    zIndex: 25,
  },
  verticalSliderTrack: {
    width: 4,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  verticalSliderFill: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  verticalSliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
