import { previewStyles as styles } from '@/styles/preview.styles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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


