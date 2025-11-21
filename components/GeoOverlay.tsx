import { overlayStyles as styles } from '@/styles/overlay.styles';
import { Image } from 'expo-image';
import { GeoData } from '@/utils/geoOverlay';
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
              <MaterialCommunityIcons name="map-marker" size={24} color="#FF5252" />
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
            <MaterialCommunityIcons name="speedometer" size={16} color="#4CAF50" />
            <Text style={styles.metricText}>
              {geoData.speed ? Math.round(geoData.speed * 3.6) : 0} km/h
            </Text>
          </View>

          {/* Altitude */}
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="triangle" size={16} color="#2196F3" />
            <Text style={styles.metricText}>
              {geoData.altitude ? Math.round(geoData.altitude) : 0} m
            </Text>
          </View>

          {/* Magnetic Field */}
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="compass" size={16} color="#FFC107" />
            <Text style={styles.metricText}>
              {geoData.magneticField ? geoData.magneticField.toFixed(0) : 0} µT
            </Text>
          </View>

          {/* Weather */}
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="thermometer" size={16} color="#FF9800" />
            <Text style={styles.metricText}>
              {geoData.temperature ? Math.round(geoData.temperature) : '--'}°C {geoData.weatherCondition}
            </Text>
          </View>

          {/* GPS Lock Indicator */}
          <View style={styles.metricItem}>
            <MaterialCommunityIcons name="navigation" size={16} color="#fff" />
            <Text style={styles.metricText}>GPS</Text>
          </View>
        </View>
      </View>
    </View>
  );
}


