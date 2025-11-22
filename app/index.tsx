import { useCameraSettings } from '@/contexts/CameraSettingsContext';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { SkiaCameraCanvas } from 'react-native-vision-camera/src/skia/SkiaCameraCanvas';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import PermissionsScreen from '@/components/PermissionsScreen';
import { useLiveGeoData } from '@/utils/useLiveGeoData';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Linking, Platform, StyleSheet, Alert, AppState, AppStateStatus } from 'react-native';
import { useGPSVideoOverlay } from '@/utils/videoFrameProcessor';
import { useCameraControls } from '@/hooks/useCameraControls';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useCameraPermissions } from '@/hooks/useCameraPermissions';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Modular Components
import CameraControls from '@/components/CameraControls';
import CameraOverlay from '@/components/CameraOverlay';
import CaptureButton from '@/components/CaptureButton';

// Styles
import { cameraStyles } from '@/styles/camera.styles';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);

  // Camera facing state
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // App State & Camera Active State
  const appState = useRef(AppState.currentState);
  const [isActive, setIsActive] = useState(appState.current === 'active');
  const [hasCameraError, setHasCameraError] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      setIsActive(nextAppState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Permissions
  const { allPermissionsGranted } = useCameraPermissions();
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    if (allPermissionsGranted) {
      setHasPermissions(true);
    }
  }, [allPermissionsGranted]);

  // Settings and state
  const { settings, updateSetting } = useCameraSettings();
  const { data: liveGeoData, mapTile: liveMapTile } = useLiveGeoData(settings.geoOverlayEnabled || settings.videoGPSOverlayEnabled);

  const {
    currentMode,
    setCurrentMode,
    cycleFlash,
    lastPhotoUri,
    setLastPhotoUri,
  } = useCameraSettings();

  // Camera controls (zoom, focus)
  const {
    zoom,
    setZoom,
    showZoomSlider,
    handleZoomButtonTap,
    handleZoomSliderChange,
    focusPoint,
    focusAnimation,
    handleFocusTap,
  } = useCameraControls(
    settings.volumeAction,
    () => handleCapture(getTimerSeconds())
  );

  // Zoom Gesture
  const startZoom = useRef(zoom);
  const zoomGesture = Gesture.Pan()
    .onStart(() => {
      startZoom.current = zoom;
    })
    .onUpdate((e) => {
      // Swipe up (negative Y) to zoom in, down to zoom out
      const sensitivity = 0.015;
      const delta = -e.translationY * sensitivity;
      const newZoom = Math.max(1, Math.min(10, startZoom.current + delta));
      // Using runOnJS to update React state from gesture callback
      setZoom(newZoom);
    })
    .runOnJS(true);

  // Camera capture (photo/video)
  const {
    isCapturing,
    isRecording,
    recordingDuration,
    timerCountdown,
    handleCapture,
  } = useCameraCapture({
    cameraRef,
    currentMode,
    flashMode: settings.flashMode === 'torch' ? 'off' : settings.flashMode,
    imageQuality: settings.imageQuality,
    geoOverlayEnabled: settings.geoOverlayEnabled,
    videoGPSOverlayEnabled: settings.videoGPSOverlayEnabled,
    liveGeoData: liveGeoData,
    router,
    setLastPhotoUri,
  });

  // VisionCamera device
  const device = useCameraDevice(facing);

  // GPS overlay frame processor for video
  const skiaFrameProcessor = useGPSVideoOverlay(
    currentMode === 'video' && settings.videoGPSOverlayEnabled ? liveGeoData : null,
    currentMode === 'video' && settings.videoGPSOverlayEnabled
  );

  const toggleCameraFacing = () => {
    setFacing(prev => prev === 'back' ? 'front' : 'back');
  };

  const openSystemGallery = async () => {
    try {
      if (lastPhotoUri) {
        const asset = await MediaLibrary.getAssetInfoAsync(lastPhotoUri);
        if (asset?.localUri) {
          if (await Linking.canOpenURL(asset.localUri)) {
            await Linking.openURL(asset.localUri);
            return;
          }
        }
      }

      // Fallback: open gallery app
      if (Platform.OS === 'android') {
        await Linking.openURL('content://media/internal/images/media');
      } else {
        await Linking.openURL('photos-redirect://');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
    }
  };

  const getTimerSeconds = (): number => {
    switch (settings.timer) {
      case '2s': return 2;
      case '5s': return 5;
      case '10s': return 10;
      default: return 0;
    }
  };

  if (!hasPermissions) {
    return <PermissionsScreen onAllPermissionsGranted={() => setHasPermissions(true)} />;
  }

  if (hasCameraError) {
    return (
      <View style={cameraStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
            Camera Unavailable
          </Text>
          <Text style={{ color: '#aaa', textAlign: 'center' }}>
            The camera has been restricted by the system. Please check your device settings or parental controls.
          </Text>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={cameraStyles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          Camera not available
        </Text>
      </View>
    );
  }

  return (
    <View style={cameraStyles.container}>
      <View style={cameraStyles.cameraContainer}>
        <GestureDetector gesture={zoomGesture}>
          <View style={StyleSheet.absoluteFill}>
            <Camera
              ref={cameraRef}
              style={cameraStyles.camera}
              device={device}
              isActive={isActive && !hasCameraError}
              photo={currentMode !== 'video'}
              video={currentMode === 'video'}
              frameProcessor={currentMode === 'video' && settings.videoGPSOverlayEnabled ? (skiaFrameProcessor as any) : undefined}
              zoom={zoom}
              torch={settings.flashMode === 'torch' ? 'on' : 'off'}
              lowLightBoost={currentMode === 'night'}
              onError={(error) => {
                console.error('Camera Runtime Error:', error);
                if (error.code === 'system/camera-is-restricted') {
                  setHasCameraError(true);
                  Alert.alert('Camera Restricted', 'Camera is restricted by the OS. Please check device policies or parental controls.');
                }
              }}
              onTouchEnd={(event) => {
                const { locationX, locationY } = event.nativeEvent;
                handleFocusTap({ x: locationX, y: locationY });
              }}
            />

            {currentMode === 'video' && settings.videoGPSOverlayEnabled && (
              <SkiaCameraCanvas
                style={StyleSheet.absoluteFill}
                offscreenTextures={skiaFrameProcessor.offscreenTextures}
                resizeMode="cover"
              />
            )}

            <CameraOverlay
              gridStyle={settings.gridStyle}
              focusPoint={focusPoint}
              focusAnimation={focusAnimation}
              timerCountdown={timerCountdown}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              zoom={zoom}
              showZoomSlider={showZoomSlider}
              handleZoomButtonTap={handleZoomButtonTap}
              handleZoomSliderChange={handleZoomSliderChange}
              geoOverlayEnabled={settings.geoOverlayEnabled}
              liveGeoData={liveGeoData}
              liveMapTile={liveMapTile}
              currentMode={currentMode}
              photoAspectRatio={settings.photoAspectRatio}
            />
          </View>
        </GestureDetector>
      </View>

      <CameraControls
        flashMode={settings.flashMode}
        cycleFlash={cycleFlash}
        geoOverlayEnabled={settings.geoOverlayEnabled}
        toggleGeoOverlay={() => updateSetting('geoOverlayEnabled', !settings.geoOverlayEnabled)}
        isRecording={isRecording}
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
        lastPhotoUri={lastPhotoUri}
        openGallery={openSystemGallery}
        toggleCameraFacing={toggleCameraFacing}
        onSettingsPress={() => router.push('/settings')}
        captureButton={
          <CaptureButton
            isRecording={isRecording}
            isCapturing={isCapturing}
            currentMode={currentMode}
            onCapture={() => handleCapture(getTimerSeconds())}
          />
        }
      />
    </View>
  );
}
