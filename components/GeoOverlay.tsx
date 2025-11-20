import { Image } from 'expo-image';
import { GeoData } from '@/utils/geoOverlay';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  MapPin,
  Thermometer,
  Gauge,
  Mountain,
  Compass,
  Navigation,
} from 'lucide-react-native';

interface GeoOverlayProps {
  geoData: GeoData | null;
  mapTile: string | null;
  imageWidth: number;
  imageHeight?: number;
}

export default function GeoOverlay({ geoData, mapTile, imageWidth }: GeoOverlayProps) {
  if (!geoData) {
    // Skeleton / Loading state
    return (
      <View style={[styles.container, { width: imageWidth }]}>
        <View style={styles.overlay}>
          <Text style={{ color: 'white' }}>Acquiring GPS...</Text>
        </View>
      </View>
    );
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    // Format: Wednesday, 19/11/2025 03:24 AM GMT +05:30
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetHours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
    const offsetMins = (Math.abs(offset) % 60).toString().padStart(2, '0');

    return `${dayName}, ${dateStr} ${timeStr} GMT ${offsetSign}${offsetHours}:${offsetMins}`;
  };

  return (
    <View style={[styles.container, { width: imageWidth }]}>
      <View style={styles.overlay}>
        <View style={styles.contentRow}>
          {/* Left: Map Thumbnail */}
          <View style={styles.mapContainer}>
            {mapTile && (
              <Image
                source={{ uri: mapTile }}
                style={styles.map}
                contentFit="cover"
              />
            )}
            <View style={styles.pinOverlay}>
              <MapPin size={24} color="#FF5252" fill="#FF5252" />
            </View>
            <View style={styles.osmBranding}>
              <Text style={styles.osmText}>© OpenStreetMap</Text>
            </View>
          </View>

          {/* Right: Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.placeName} numberOfLines={1}>
              {geoData.placeName}
            </Text>
            <Text style={styles.address} numberOfLines={2}>
              {geoData.plusCode}, {geoData.address}
            </Text>
            <Text style={styles.coords}>
              Lat {geoData.latitude.toFixed(6)}° Long {geoData.longitude.toFixed(6)}°
            </Text>
            <Text style={styles.dateTime}>{formatDate(geoData.dateTime)}</Text>
          </View>
        </View>

        {/* Bottom Row: Metrics */}
        <View style={styles.metricsRow}>
          {/* Speed */}
          <View style={styles.metricItem}>
            <Gauge size={16} color="#4CAF50" />
            <Text style={styles.metricText}>
              {geoData.speed ? Math.round(geoData.speed * 3.6) : 0} km/h
            </Text>
          </View>

          {/* Altitude */}
          <View style={styles.metricItem}>
            <Mountain size={16} color="#2196F3" />
            <Text style={styles.metricText}>
              {geoData.altitude ? Math.round(geoData.altitude) : 0} m
            </Text>
          </View>

          {/* Magnetic Field */}
          <View style={styles.metricItem}>
            <Compass size={16} color="#FFC107" />
            <Text style={styles.metricText}>
              {geoData.magneticField ? geoData.magneticField.toFixed(0) : 0} µT
            </Text>
          </View>

          {/* Weather */}
          <View style={styles.metricItem}>
            <Thermometer size={16} color="#FF9800" />
            <Text style={styles.metricText}>
              {geoData.temperature ? Math.round(geoData.temperature) : '--'}°C {geoData.weatherCondition}
            </Text>
          </View>

          {/* GPS Lock Indicator */}
          <View style={styles.metricItem}>
            <Navigation size={16} color="#fff" />
            <Text style={styles.metricText}>GPS</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No fixed height, let it grow
    pointerEvents: 'none',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 0, // Edge to edge look usually
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mapContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8, // Lift pin slightly
  },
  osmBranding: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 1,
  },
  osmText: {
    color: 'white',
    fontSize: 6,
    textAlign: 'center',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  address: {
    fontSize: 11,
    color: '#ddd',
    marginBottom: 4,
    lineHeight: 14,
  },
  coords: {
    fontSize: 11,
    color: '#ddd',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  dateTime: {
    fontSize: 10,
    color: '#aaa',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
});
