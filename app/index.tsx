import { useCameraSettings, CameraMode } from '@/contexts/CameraSettingsContext';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import {
  Settings,
  Zap,
  ZapOff,
  Grid3x3,
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { getGeoData } from '@/utils/geoOverlay';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const [timerCountdown, setTimerCountdown] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const {
    settings,
    currentMode,
    setCurrentMode,
    zoom,
    setZoom,
    toggleGrid,
    cycleFlash,
    lastPhotoUri,
    setLastPhotoUri,
  } = useCameraSettings();

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

  if (!cameraPermission || !mediaPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted || !mediaPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera and media library permissions
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            if (!cameraPermission.granted) requestCameraPermission();
            if (!mediaPermission.granted) requestMediaPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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

  const executeCapture = async () => {
    if (!cameraRef.current) return;
    setIsCapturing(true);

    try {
      if (currentMode === 'video') {
        if (isRecording) {
          cameraRef.current.stopRecording();
          setIsRecording(false);
        } else {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync();
          if (video?.uri) {
            const asset = await MediaLibrary.createAssetAsync(video.uri);
            console.log('Video saved:', asset.uri);
            setLastPhotoUri(asset.uri);
          }
        }
      } else {
        const photo = await cameraRef.current.takePictureAsync({
          quality: settings.imageQuality === 'superfine' ? 1 : settings.imageQuality === 'standard' ? 0.7 : 0.5,
        });
        
        if (photo?.uri) {
          if (settings.geoOverlayEnabled) {
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
  const zoomLevels = [0.6, 1, 2];

  return (
    <View style={styles.container}>
      <Pressable style={styles.cameraContainer} onPress={handleTapToFocus}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={mapFlashMode()}
          zoom={zoom}
        >
          {settings.showGrid && (
            <View style={styles.gridOverlay}>
              <View style={styles.gridLine} />
              <View style={[styles.gridLine, styles.gridLineVertical]} />
              <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '33.33%' }]} />
              <View style={[styles.gridLine, styles.gridLineHorizontal, { top: '66.66%' }]} />
              <View style={[styles.gridLine, styles.gridLineVertical, { left: '33.33%' }]} />
              <View style={[styles.gridLine, styles.gridLineVertical, { left: '66.66%' }]} />
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
                },
              ]}
            />
          )}
        </CameraView>
      </Pressable>

      <SafeAreaView style={styles.topControls} edges={['top']}>
        <TouchableOpacity style={styles.controlButton} onPress={cycleFlash}>
          {getFlashIcon()}
          <Text style={styles.flashText}>{settings.flashMode.toUpperCase()}</Text>
        </TouchableOpacity>

        {settings.hdrEnabled && (
          <View style={styles.hdrBadge}>
            <Text style={styles.hdrText}>HDR</Text>
          </View>
        )}

        {settings.geoOverlayEnabled && (
          <View style={[styles.hdrBadge, { backgroundColor: '#4CAF50' }]}>
            <MapPin size={14} color="#fff" />
            <Text style={styles.hdrText}>GPS</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.controlButton} onPress={toggleGrid}>
          <Grid3x3 size={24} color={settings.showGrid ? '#FFD700' : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.push('/settings' as any)}
        >
          <Settings size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
        <View style={styles.zoomControls}>
          {zoomLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.zoomButton,
                zoom === level && styles.zoomButtonActive,
              ]}
              onPress={() => setZoom(level)}
            >
              <Text
                style={[
                  styles.zoomText,
                  zoom === level && styles.zoomTextActive,
                ]}
              >
                {level}×
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.captureRow}>
          <TouchableOpacity
            style={styles.thumbnailButton}
            onPress={() => router.push('/gallery' as any)}
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

          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && styles.captureButtonRecording,
            ]}
            onPress={handleCapture}
          >
            <View
              style={[
                styles.captureButtonInner,
                currentMode === 'video' && styles.captureButtonVideo,
                isRecording && styles.captureButtonInnerRecording,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <RotateCcw size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.modeSelector}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={styles.modeButton}
              onPress={() => setCurrentMode(mode)}
            >
              <View
                style={[
                  styles.modeIconContainer,
                  currentMode === mode && styles.modeIconContainerActive,
                ]}
              >
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
      </SafeAreaView>

      {timerCountdown > 0 && (
        <View style={styles.timerOverlay}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timerCountdown}</Text>
          </View>
        </View>
      )}

      {isCapturing && (
        <View style={styles.capturingOverlay}>
          <Text style={styles.capturingText}>Capturing...</Text>
        </View>
      )}
    </View>
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
  },
  camera: {
    flex: 1,
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
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  flashText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  hdrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hdrText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  bottomControls: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonActive: {
    backgroundColor: '#fff',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  zoomTextActive: {
    color: '#000',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonRecording: {
    borderColor: '#ff0000',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  captureButtonVideo: {
    borderRadius: 8,
  },
  captureButtonInnerRecording: {
    backgroundColor: '#ff0000',
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  flipButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 32,
  },
  modeButton: {
    alignItems: 'center',
    gap: 4,
  },
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIconContainerActive: {
    backgroundColor: '#fff',
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#aaa',
  },
  modeTextActive: {
    color: '#fff',
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
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
