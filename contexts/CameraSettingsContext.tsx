import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

export type CameraMode = 'photo' | 'video' | 'night' | 'portrait';
export type FlashMode = 'on' | 'off' | 'torch';
export type GridStyle = 'off' | '3x3' | 'golden';
export type Timer = 'off' | '2s' | '5s' | '10s';
export type AspectRatio = '1:1' | '4:3' | '16:9';
export type ImageQuality = 'normal' | 'fine' | 'superfine';
export type PhotoResolution = '1080p' | '4k' | '8k' | 'max';
export type VideoResolution = '720p' | '1080p' | '4k';
export type VideoFPS = 30 | 60 | 120;
export type StorageLocation = 'phone' | 'sd';
export type VolumeAction = 'shutter' | 'zoom' | 'off';

export interface CameraSettings {
  storageLocation: StorageLocation;
  volumeAction: VolumeAction;
  shutterSound: boolean;
  saveLocation: boolean;
  gridStyle: GridStyle;
  timer: Timer;
  touchToCapture: boolean;
  photoAspectRatio: AspectRatio;
  photoResolution: PhotoResolution;
  imageQuality: ImageQuality;
  gestureZoom: boolean;
  videoResolution: VideoResolution;
  videoFPS: VideoFPS;
  videoStabilization: boolean;
  flashMode: FlashMode;
  geoOverlayEnabled: boolean;
  videoGPSOverlayEnabled: boolean;
}

const defaultSettings: CameraSettings = {
  storageLocation: 'phone',
  volumeAction: 'shutter',
  shutterSound: true,
  saveLocation: true,
  gridStyle: '3x3',
  timer: 'off',
  touchToCapture: false,
  photoAspectRatio: '4:3',
  photoResolution: '4k',
  imageQuality: 'fine',
  gestureZoom: true,
  videoResolution: '1080p',
  videoFPS: 30,
  videoStabilization: true,
  flashMode: 'off',
  geoOverlayEnabled: true,
  videoGPSOverlayEnabled: true,
};

const STORAGE_KEY = '@geoshot_camera_settings';

import * as MediaLibrary from 'expo-media-library';

// ... imports

export const [CameraSettingsProvider, useCameraSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<CameraSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<CameraMode>('photo');
  const [zoom, setZoom] = useState<number>(0); // 0 = neutral zoom for CameraView

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load camera settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const fetchLastGeoShotAsset = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;

      const album = await MediaLibrary.getAlbumAsync('GeoShot');
      if (album) {
        const assets = await MediaLibrary.getAssetsAsync({
          album: album,
          first: 1,
          sortBy: [MediaLibrary.SortBy.creationTime],
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        });

        if (assets.assets.length > 0) {
          setLastPhotoUri(assets.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Failed to fetch last GeoShot asset:', error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save camera settings:', error);
    }
  }, [settings]);

  useEffect(() => {
    loadSettings();
    fetchLastGeoShotAsset();
  }, [loadSettings, fetchLastGeoShotAsset]);

  useEffect(() => {
    if (isLoaded) {
      saveSettings();
    }
  }, [settings, isLoaded, saveSettings]);

  const updateSetting = <K extends keyof CameraSettings>(
    key: K,
    value: CameraSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  const cycleFlash = () => {
    setSettings((prev) => {
      const modes: FlashMode[] = ['off', 'on', 'torch'];
      const currentIndex = modes.indexOf(prev.flashMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...prev, flashMode: modes[nextIndex] };
    });
  };

  return {
    settings,
    updateSetting,
    resetSettings,
    isLoaded,
    lastPhotoUri,
    setLastPhotoUri,
    fetchLastGeoShotAsset,
    currentMode,
    setCurrentMode,
    zoom,
    setZoom,
    cycleFlash,
  };
});
