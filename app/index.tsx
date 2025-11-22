import { useCameraSettings } from '@/contexts/CameraSettingsContext';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useLiveGeoData } from '@/utils/useLiveGeoData';
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Linking,
  Platform,
  StyleSheet,
  Alert,
  AppState,
  ActivityIndicator
} from 'react-native';
import { useCameraControls } from '@/hooks/CameraControls';
import { useCameraCapture } from '@/hooks/CameraCapture';
import { useAutoPermissions } from '@/hooks/Permissions';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { CameraPermission } from '@/hooks/CameraPermission';

// Modular Components
import CameraControls from '@/components/CameraControls';
import CameraOverlay from '@/components/CameraOverlay';
import CaptureButton from '@/components/CaptureButton';

// Styles
import { cameraStyles } from '@/styles/camera.styles';

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<Camera>(null);

  // Expo permission system
  const { allGranted, isRequesting } = useAutoPermissions();

  // VisionCamera native permission system
  const {
    isAuthorized: vcAuthorized,
    isRestricted: vcRestricted,
    isRequesting: vcLoading,
  } = CameraPermission();

  // Camera facing state
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // App State & Camera Active State
  const appState = useRef(AppState.currentState);
  const [isActive, setIsActive] = useState(appState.current === 'active');
  const [hasCameraError, setHasCameraError] = useState(false);

  // ⭐ NEW: Delay before mounting camera to avoid keep-awake crash
  const [canMountCamera, setCanMountCamera] = useState(false);

  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => {
        setCanMountCamera(true);
      }, 500); // Android needs time after permission dialogs
      return () => clearTimeout(timeout);
    } else {
      setCanMountCamera(false);
    }
  }, [isActive]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      setIsActive(nextAppState === 'active');
    });

    return () => subscription.remove();
  }, []);

  // Settings and state
  const { settings, updateSetting } = useCameraSettings();
  const { data: liveGeoData, mapTile: liveMapTile } =
    useLiveGeoData(settings.geoOverlayEnabled);

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
    settings.volumeAction === 'shutter'
      ? () => handleCapture(getTimerSeconds())
      : undefined
  );

  // Zoom Gesture
  const startZoom = useRef(zoom);
  const zoomGesture = Gesture.Pan()
    .onStart(() => {
      startZoom.current = zoom;
    })
    .onUpdate((e) => {
      const sensitivity = 0.015;
      const delta = -e.translationY * sensitivity;
      const newZoom = Math.max(
        1,
        Math.min(10, startZoom.current + delta)
      );
      setZoom(newZoom);
    })
    .runOnJS(true);

  // Camera capture
  const {
    isCapturing,
    isRecording,
    recordingDuration,
    timerCountdown,
    handleCapture,
  } = useCameraCapture({
    cameraRef,
    currentMode,
    flashMode:
      settings.flashMode === 'torch' ? 'off' : settings.flashMode,
    imageQuality: settings.imageQuality,
    geoOverlayEnabled: settings.geoOverlayEnabled,
    liveGeoData: liveGeoData,
    router,
    setLastPhotoUri,
  });

  // VisionCamera device
  const device = useCameraDevice(facing);

  // Video Format Selection (only for video mode)
  const targetResolution = settings.videoResolution === '4k'
    ? { width: 3840, height: 2160 }
    : settings.videoResolution === '1080p'
      ? { width: 1920, height: 1080 }
      : { width: 1280, height: 720 };

  const videoFormat = useCameraFormat(device, [
    { videoResolution: targetResolution },
    { fps: settings.videoFPS }
  ]);

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
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

      if (Platform.OS === 'android') {
        await Linking.openURL(
          'content://media/internal/images/media'
        );
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

  // EXPO PERMISSIONS NOT GRANTED
  if (!allGranted) {
    return (
      <View style={cameraStyles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          {isRequesting ? (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text
                style={{
                  color: '#fff',
                  fontSize: 16,
                  marginTop: 20,
                  textAlign: 'center',
                }}
              >
                Setting up permissions...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{
                  color: '#fff',
                  fontSize: 18,
                  textAlign: 'center',
                  marginBottom: 10,
                }}
              >
                Permissions Required
              </Text>
              <Text style={{ color: '#aaa', textAlign: 'center' }}>
                Please grant camera, microphone, location, and photo library permissions in Settings to use GeoShot.
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  // VISION CAMERA RESTRICTED
  if (vcRestricted) {
    return (
      <View style={cameraStyles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          Camera is restricted by device policy.
        </Text>
      </View>
    );
  }

  // DO NOT RENDER CAMERA UNTIL ALL STATES ARE STABLE
  if (!vcAuthorized || vcLoading || !canMountCamera) {
    return (
      <View style={[cameraStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // HARD CAMERA ERROR
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

  // NO CAMERA DEVICE
  if (device == null) {
    return (
      <View style={cameraStyles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
          Camera not available
        </Text>
      </View>
    );
  }

  // RENDER CAMERA UI
  return (
    <View style={cameraStyles.container}>
      <View style={cameraStyles.cameraContainer}>
        <GestureDetector gesture={zoomGesture}>
          <View style={StyleSheet.absoluteFill}>
            <Camera
              ref={cameraRef}
              style={cameraStyles.camera}
              device={device}
              {...(currentMode === 'video' && videoFormat ? { format: videoFormat } : {})}
              isActive={isActive && !hasCameraError}
              photo={currentMode !== 'video'}
              video={currentMode === 'video'}
              audio={currentMode === 'video'}
              zoom={zoom}
              torch={settings.flashMode === 'torch' ? 'on' : 'off'}
              enableZoomGesture={false}
              onError={(error) => {
                console.error('Camera Runtime Error:', error);
                if (error.code === 'system/camera-is-restricted') {
                  setHasCameraError(true);
                  Alert.alert(
                    'Camera Restricted',
                    'Camera is restricted by the OS. Please check device policies or parental controls.'
                  );
                }
              }}
              onTouchEnd={(event) => {
                const { locationX, locationY } = event.nativeEvent;
                handleFocusTap({ x: locationX, y: locationY });
                if (settings.touchToCapture && currentMode === 'photo') {
                  handleCapture(getTimerSeconds());
                }
              }}
            />

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
        toggleGeoOverlay={() =>
          updateSetting('geoOverlayEnabled', !settings.geoOverlayEnabled)
        }
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
