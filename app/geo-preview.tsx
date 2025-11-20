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
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
          <MaterialCommunityIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geo Preview</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <MaterialCommunityIcons name="pencil" size={24} color={isEditing ? '#FFD700' : '#fff'} />
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
          <View style={styles.infoTitleContainer}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#4CAF50" />
            <Text style={styles.infoTitle}>Location Data</Text>
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

          {isEditing && (
            <TouchableOpacity 
              style={[styles.applyButton, { marginTop: 20, alignSelf: 'center', width: '80%' }]} 
              onPress={applyEdits}
            >
              <Text style={[styles.applyButtonText, { textAlign: 'center' }]}>Apply Changes</Text>
            </TouchableOpacity>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  infoRow: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500' as const,
    flex: 1,
    textAlign: 'left',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#333333',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 14,
    textAlign: 'left',
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginTop: 8,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
});
