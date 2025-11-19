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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Edit2 } from 'lucide-react-native';
import { getGeoData, GeoData, getCachedMapTile } from '@/utils/geoOverlay';
import GeoOverlay from '@/components/GeoOverlay';
import { captureRef } from 'react-native-view-shot';
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
  const [editedData, setEditedData] = useState<Partial<GeoData>>({});
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
        setEditedData(data); // Initialize edited data with fetched data
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

  const handleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Entering edit mode, reset edited data to current geo data
      setEditedData(geoData || {});
    }
  };

  const handleFieldChange = (field: keyof GeoData, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: field === 'latitude' || field === 'longitude' || field === 'altitude' || field === 'speed' || field === 'temperature'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const applyEdits = () => {
    if (geoData && editedData) {
      const updatedGeoData = { ...geoData, ...editedData };
      setGeoData(updatedGeoData);
      setIsEditing(false);
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

      // Save the photo to the gallery with minimal media library interaction
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Edit2 size={24} color={isEditing ? '#FFD700' : '#fff'} />
          </TouchableOpacity>
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
        </View>
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
          <GeoOverlay geoData={geoData} mapTile={mapTile} imageWidth={SCREEN_WIDTH - 32} />
        </View>

        <View style={styles.info}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Location Information</Text>
            {isEditing && (
              <TouchableOpacity style={styles.applyButton} onPress={applyEdits}>
                <Text style={styles.applyButtonText}>Apply Changes</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Editable Fields */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Latitude:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.latitude?.toString() || ''}
                onChangeText={(val) => handleFieldChange('latitude', val)}
                keyboardType="numeric"
                placeholder="Latitude"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.infoValue}>{geoData.latitude.toFixed(6)}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Longitude:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.longitude?.toString() || ''}
                onChangeText={(val) => handleFieldChange('longitude', val)}
                keyboardType="numeric"
                placeholder="Longitude"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.infoValue}>{geoData.longitude.toFixed(6)}</Text>
            )}
          </View>

          {(geoData.altitude !== null || isEditing) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Altitude:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.altitude?.toString() || ''}
                  onChangeText={(val) => handleFieldChange('altitude', val)}
                  keyboardType="numeric"
                  placeholder="Altitude (m)"
                  placeholderTextColor="#888"
                />
              ) : (
                <Text style={styles.infoValue}>{geoData.altitude?.toFixed(1)} m</Text>
              )}
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editedData.address || ''}
                onChangeText={(val) => handleFieldChange('address', val)}
                placeholder="Address"
                placeholderTextColor="#888"
                multiline
              />
            ) : (
              <Text style={styles.infoValue}>{geoData.address}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Place:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.placeName || ''}
                onChangeText={(val) => handleFieldChange('placeName', val)}
                placeholder="Place name"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.infoValue}>{geoData.placeName}</Text>
            )}
          </View>

          {(geoData.speed !== null || isEditing) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Speed:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.speed?.toString() || ''}
                  onChangeText={(val) => handleFieldChange('speed', val)}
                  keyboardType="numeric"
                  placeholder="Speed (km/h)"
                  placeholderTextColor="#888"
                />
              ) : (
                <Text style={styles.infoValue}>{geoData.speed?.toFixed(1)} km/h</Text>
              )}
            </View>
          )}

          {(geoData.temperature !== null || isEditing) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Temperature:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.temperature?.toString() || ''}
                  onChangeText={(val) => handleFieldChange('temperature', val)}
                  keyboardType="numeric"
                  placeholder="Temperature (°C)"
                  placeholderTextColor="#888"
                />
              ) : (
                <Text style={styles.infoValue}>{geoData.temperature}°C</Text>
              )}
            </View>
          )}

          {(geoData.weatherCondition !== null || isEditing) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weather:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.weatherCondition || ''}
                  onChangeText={(val) => handleFieldChange('weatherCondition', val)}
                  placeholder="Weather condition"
                  placeholderTextColor="#888"
                />
              ) : (
                <Text style={styles.infoValue}>{geoData.weatherCondition}</Text>
              )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: '#fff',
    fontWeight: '500' as const,
    flex: 1,
    textAlign: 'right',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#444',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
});
