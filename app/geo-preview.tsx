import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { getGeoData, GeoData } from '@/utils/geoOverlay';
import GeoOverlay from '@/components/GeoOverlay';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useCameraSettings } from '@/contexts/CameraSettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GeoPreviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
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
      } else {
        setError('Failed to get GPS data');
      }
    } catch (err) {
      console.error('Geo data error:', err);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
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

      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log('Photo with GPS overlay saved:', asset.uri);
      setLastPhotoUri(asset.uri);
      
      Alert.alert('Success', 'Photo saved with GPS overlay', [
        { text: 'OK', onPress: () => router.back() },
      ]);
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
        <Text style={styles.loadingText}>Fetching location data...</Text>
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
          <X size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geo Preview</Text>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Check size={28} color="#fff" />
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
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
          <GeoOverlay geoData={geoData} imageWidth={SCREEN_WIDTH - 32} imageHeight={500} />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Location Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Coordinates:</Text>
            <Text style={styles.infoValue}>
              {geoData.latitude.toFixed(6)}, {geoData.longitude.toFixed(6)}
            </Text>
          </View>
          {geoData.altitude !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Altitude:</Text>
              <Text style={styles.infoValue}>{Math.round(geoData.altitude)}m</Text>
            </View>
          )}
          {geoData.speed !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Speed:</Text>
              <Text style={styles.infoValue}>
                {Math.round(geoData.speed * 3.6)} km/h
              </Text>
            </View>
          )}
          {geoData.temperature !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weather:</Text>
              <Text style={styles.infoValue}>
                {Math.round(geoData.temperature)}°C, {geoData.weatherCondition}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff5555',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  headerButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  info: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
