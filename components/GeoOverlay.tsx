import { Image } from 'expo-image';
import { GeoData, getMapImageUrl } from '@/utils/geoOverlay';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  MapPin,
  Thermometer,
  Gauge,
  Mountain,
  Compass,
} from 'lucide-react-native';

interface GeoOverlayProps {
  geoData: GeoData;
  imageWidth: number;
  imageHeight: number;
}

export default function GeoOverlay({ geoData, imageWidth, imageHeight }: GeoOverlayProps) {
  const mapUrl = getMapImageUrl(geoData.latitude, geoData.longitude, 200, 120, 14);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { width: imageWidth, height: imageHeight }]}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: mapUrl }}
              style={styles.map}
              contentFit="cover"
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.placeName} numberOfLines={1}>
              {geoData.placeName}
            </Text>
            <Text style={styles.address} numberOfLines={2}>
              {geoData.address}
            </Text>
            <Text style={styles.coords}>
              {geoData.latitude.toFixed(6)}, {geoData.longitude.toFixed(6)}
            </Text>
            <Text style={styles.plusCode}>{geoData.plusCode}</Text>
            <Text style={styles.dateTime}>{formatDate(geoData.dateTime)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {geoData.speed !== null && (
            <View style={styles.dataItem}>
              <Gauge size={16} color="#fff" />
              <Text style={styles.dataText}>{Math.round(geoData.speed * 3.6)} km/h</Text>
            </View>
          )}

          {geoData.altitude !== null && (
            <View style={styles.dataItem}>
              <Mountain size={16} color="#fff" />
              <Text style={styles.dataText}>{Math.round(geoData.altitude)}m</Text>
            </View>
          )}

          {geoData.magneticField !== null && (
            <View style={styles.dataItem}>
              <Compass size={16} color="#fff" />
              <Text style={styles.dataText}>{geoData.magneticField.toFixed(1)}µT</Text>
            </View>
          )}

          {geoData.temperature !== null && (
            <View style={styles.dataItem}>
              <Thermometer size={16} color="#fff" />
              <Text style={styles.dataText}>
                {Math.round(geoData.temperature)}°C {geoData.weatherCondition}
              </Text>
            </View>
          )}

          <View style={styles.dataItem}>
            <MapPin size={16} color="#fff" />
            <Text style={styles.dataText}>GPS</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
  },
  overlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mapContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  address: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 14,
    marginBottom: 4,
  },
  coords: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  plusCode: {
    fontSize: 10,
    color: '#888',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 10,
    color: '#aaa',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dataText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
