import { previewStyles as styles } from '@/styles/preview.styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getGeoData, GeoData, getCachedMapTile } from '@/utils/geoOverlay';
import GeoOverlay from '@/components/GeoOverlay';
import EditDataModal from '@/components/EditDataModal';
import { saveFileToAppFolder } from '@/utils/mediaUtils';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';

import * as MediaLibrary from 'expo-media-library';
import { useCameraSettings } from '@/contexts/CameraSettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GeoPreviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [mapTile, setMapTile] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const viewRef = useRef<View>(null);
  const { setLastPhotoUri } = useCameraSettings();

  useEffect(() => {
    loadGeoData();
  }, []);

  const loadGeoData = async () => {
    try {
      const data = await getGeoData();
      if (data) {
        setGeoData(data);
        const tile = await getCachedMapTile(data.latitude, data.longitude);
        setMapTile(tile);
      } else {
        setError('Failed to get GPS data');
      }
    } catch (err) {
      console.error('Geo data error:', err);
      setError('Error loading GPS data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = (newData: Partial<GeoData>) => {
    if (geoData) {
      setGeoData({ ...geoData, ...newData });
    }
  };

  const handleSave = async () => {
    if (!viewRef.current || !photoUri || saving) return;

    setSaving(true);
    try {
      const uri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 1,
      });

      // Save using shared utility
      const savedUri = await saveFileToAppFolder(uri, 'photo');

      if (savedUri) {
        console.log('Photo with GPS overlay saved:', savedUri);
        setLastPhotoUri(savedUri);

        Alert.alert('Success', 'Photo saved to GeoShot album', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save photo.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !geoData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'No GPS data available'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsEditing(true)}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="check" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View
          ref={viewRef}
          style={styles.previewContainer}
          collapsable={false}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.image}
            contentFit="cover"
          />
          <GeoOverlay geoData={geoData} mapTile={mapTile} imageWidth={SCREEN_WIDTH} />
        </View>
      </View>

      <EditDataModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleEditSave}
        initialData={geoData}
      />
    </View>
  );
}
