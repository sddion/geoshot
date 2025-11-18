import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Trash2, Share2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const IMAGE_SIZE = (width - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaLibrary.Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [permission, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    if (permission?.granted) {
      loadPhotos();
    }
  }, [permission]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const album = await MediaLibrary.getAlbumAsync('Camera');
      if (album) {
        const { assets } = await MediaLibrary.getAssetsAsync({
          album: album,
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
          first: 100,
        });
        setPhotos(assets);
      } else {
        const { assets } = await MediaLibrary.getAssetsAsync({
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
          first: 100,
        });
        setPhotos(assets);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigatePhoto = (direction: number) => {
    const newIndex = selectedIndex + direction;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const handleShare = async () => {
    if (!selectedPhoto) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(selectedPhoto.uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share photo');
    }
  };

  const handleDelete = () => {
    if (!selectedPhoto) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync([selectedPhoto]);
              const updatedPhotos = photos.filter(p => p.id !== selectedPhoto.id);
              setPhotos(updatedPhotos);
              
              if (updatedPhotos.length === 0) {
                setSelectedPhoto(null);
              } else if (selectedIndex >= updatedPhotos.length) {
                const newIndex = updatedPhotos.length - 1;
                setSelectedIndex(newIndex);
                setSelectedPhoto(updatedPhotos[newIndex]);
              } else {
                setSelectedPhoto(updatedPhotos[selectedIndex]);
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need media library permission to show your photos
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerBar} edges={['top']}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadPhotos}
          disabled={loading}
        >
          <RefreshCw size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>
            Start capturing moments with GeoShot Camera
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={COLUMN_COUNT}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => {
                setSelectedPhoto(item);
                setSelectedIndex(photos.findIndex(p => p.id === item.id));
              }}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.photo}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPhoto(null)}
            >
              <X size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Share2 size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Trash2 size={24} color="#ff5555" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.fullscreenImage}
                contentFit="contain"
              />

              {selectedIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={() => navigatePhoto(-1)}
                >
                  <ChevronLeft size={32} color="#fff" />
                </TouchableOpacity>
              )}

              {selectedIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={() => navigatePhoto(1)}
                >
                  <ChevronRight size={32} color="#fff" />
                </TouchableOpacity>
              )}

              <SafeAreaView style={styles.photoInfo} edges={['bottom']}>
                <Text style={styles.photoInfoText}>
                  {selectedIndex + 1} of {photos.length}
                </Text>
                <Text style={styles.photoDate}>
                  {new Date(selectedPhoto.creationTime || Date.now()).toLocaleString()}
                </Text>
              </SafeAreaView>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  headerBar: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  grid: {
    paddingTop: SPACING,
  },
  photoContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: SPACING / 2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  fullscreenImage: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute' as const,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  photoInfo: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  photoInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 12,
    color: '#aaa',
  },
});
