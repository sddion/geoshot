import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const ITEM_SIZE = (width - (COLUMN_COUNT - 1) * SPACING) / COLUMN_COUNT;

export default function GalleryScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        loadAssets();
      } else {
        setLoading(false);
      }
    })();
  }, []);

  const loadAssets = async () => {
    try {
      const album = await MediaLibrary.getAlbumAsync('GeoShot');
      if (album) {
        const { assets } = await MediaLibrary.getAssetsAsync({
          album: album,
          sortBy: [MediaLibrary.SortBy.creationTime],
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          first: 100, // Limit to 100 for now
        });
        setAssets(assets);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAsset = async (asset: MediaLibrary.Asset) => {
    try {
      // Use expo-linking or Linking to open the file
      // On Android, we can try to open with intent
      if (Platform.OS === 'android') {
        // This is a simple way, might not work for all file types/versions without specific intent setup
        // But expo-linking openURL might work if it's a file URI
        await Linking.openURL(asset.uri);
      } else {
        await Linking.openURL(asset.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open file');
    }
  };

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => openAsset(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      {item.mediaType === 'video' && (
        <View style={styles.videoIndicator}>
          <MaterialCommunityIcons name="video" size={20} color="#fff" />
          <Text style={styles.durationText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to gallery</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GeoShot Gallery</Text>
        <View style={{ width: 28 }} />
      </SafeAreaView>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="image-off" size={48} color="#666" />
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 4,
  },
  grid: {
    paddingTop: 2,
  },
  columnWrapper: {
    gap: SPACING,
    marginBottom: SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE, // 1:1 Aspect Ratio
    backgroundColor: '#222',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
    fontSize: 16,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});