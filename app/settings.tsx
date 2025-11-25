import { settingsStyles as styles } from '@/styles/settings.styles';
import { useCameraSettings } from '@/contexts/CameraSettingsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ToastAndroid,
  Platform,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import Constants from 'expo-constants';
import { useUpdate } from '@/utils/UpdateContext';
import { downloadAndInstallUpdate } from '@/utils/updater';

// Toast utility function
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};

// UpdateRow Component
const UpdateRow = () => {
  const { updateInfo, refresh } = useUpdate();
  const [showChangelog, setShowChangelog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState(0);
  const [totalMB, setTotalMB] = useState(0);
  const [status, setStatus] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    showToast(updateInfo ? 'Update available!' : 'App is up to date');
  };

  const checkPermissionAndUpdate = async () => {
    if (!updateInfo) return;

    // Check permission for Android 8.0+
    if (Platform.OS === 'android' && Platform.Version >= 26) {
      try {
        // For now, we'll just proceed - permission will be requested by system
        // In future, add proper permission check using permissionUtils
        setNeedsPermission(false);
      } catch (error) {
        console.warn('Permission check failed:', error);
      }
    }

    handleUpdate();
  };

  const handleUpdate = () => {
    if (!updateInfo || downloading) return;

    setDownloading(true);
    setProgress(0);
    setStatus('Starting download...');

    downloadAndInstallUpdate(
      updateInfo,
      (progressData) => {
        const percentComplete = Math.round(progressData.progress * 100);
        const dlMB = (progressData.downloadedBytes / (1024 * 1024)).toFixed(1);
        const totMB = (progressData.totalBytes / (1024 * 1024)).toFixed(1);

        setProgress(progressData.progress);
        setDownloadedMB(parseFloat(dlMB));
        setTotalMB(parseFloat(totMB));
      },
      (statusMessage) => {
        setStatus(statusMessage);
        if (statusMessage === 'Installation started' || statusMessage === 'Installation failed') {
          setDownloading(false);
        }
      }
    );
  };

  const openPermissionSettings = () => {
    Linking.openSettings();
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SYSTEM</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="download" size={24} color="#A0A0A0" />
              </View>
              <Text style={styles.settingLabel}>App Update</Text>
            </View>
            <View style={styles.updateStatusContainer}>
              <View
                style={[
                  styles.updateDot,
                  { backgroundColor: updateInfo ? '#FF5252' : '#4CAF50' },
                ]}
              />
              {refreshing ? (
                <ActivityIndicator size="small" color="#BB86FC" />
              ) : (
                <TouchableOpacity onPress={handleRefresh}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#A0A0A0" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {updateInfo && (
            <View style={styles.updateCard}>
              {/* Version Info */}
              <View style={styles.versionInfo}>
                <Text style={styles.versionText}>
                  Update available: {updateInfo.tag_name}
                </Text>
              </View>

              {/* Permission Prompt (if needed) */}
              {needsPermission && (
                <View style={styles.permissionPrompt}>
                  <Text style={styles.permissionPromptText}>
                    Enable "Install from unknown sources" to install updates
                  </Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={openPermissionSettings}
                  >
                    <Text style={styles.permissionButtonText}>Open Settings</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Progress Bar */}
              {downloading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {downloadedMB > 0
                      ? `${downloadedMB} MB / ${totalMB} MB (${Math.round(progress * 100)}%)`
                      : status}
                  </Text>
                </View>
              )}

              {/* Status Text */}
              {status && downloading && (
                <Text style={styles.statusText}>{status}</Text>
              )}

              {/* Action Buttons */}
              {!downloading && (
                <View style={styles.updateActionsContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={checkPermissionAndUpdate}
                  >
                    <Text style={styles.primaryButtonText}>Update Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowChangelog(true)}
                  >
                    <Text style={styles.secondaryButtonText}>View Changelog</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Changelog Modal */}
      <Modal
        visible={showChangelog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangelog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Release {updateInfo?.tag_name}
              </Text>
              <TouchableOpacity onPress={() => setShowChangelog(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#E1E1E1" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalBodyText}>{updateInfo?.body || 'No changelog available.'}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setShowChangelog(false);
                  if (updateInfo?.html_url) {
                    Linking.openURL(updateInfo.html_url);
                  }
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Open on GitHub</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowChangelog(false);
                  checkPermissionAndUpdate();
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default function SettingsScreen() {
  const { settings, updateSetting, resetSettings } = useCameraSettings();
  const router = useRouter();

  const Separator = () => <View style={styles.separator} />;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
    // Filter out null/false children to avoid rendering separators for them
    const validChildren = React.Children.toArray(children).filter(Boolean);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionCard}>
          {validChildren.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < validChildren.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  const SettingRow = ({
    label,
    value,
    onPress,
    showToggle,
    toggleValue,
    onToggle,
    icon,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
    icon?: string;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={showToggle || !onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.settingRowContent}>
        {icon && (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon as any} size={24} color="#A0A0A0" />
          </View>
        )}
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#424242', true: '#BB86FC' }} // Material Design colors
          thumbColor={toggleValue ? '#E1E1E1' : '#9E9E9E'}
        />
      ) : (
        <View style={styles.settingValue}>
          <Text style={styles.settingValueText}>{value}</Text>
          {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />}
        </View>
      )}
    </TouchableOpacity>
  );

  const handleReset = () => {
    Alert.alert(
      'Reset Camera Settings',
      'Are you sure you want to reset all camera settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetSettings();
            showToast('Camera settings have been reset to default');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* OTA Update Row */}
        <UpdateRow />
        <Section title="General">
          <SettingRow
            icon="folder"
            label="Storage Location"
            value={settings.storageLocation === 'phone' ? 'Phone' : 'SD Card'}
            onPress={() => {
              const newValue = settings.storageLocation === 'phone' ? 'sd' : 'phone';
              updateSetting('storageLocation', newValue);
            }}
          />
          <SettingRow
            icon="volume-high"
            label="Volume Button Action"
            value={settings.volumeAction === 'shutter' ? 'Shutter' : settings.volumeAction === 'zoom' ? 'Zoom' : 'Off'}
            onPress={() => {
              const actions = ['shutter', 'zoom', 'off'] as const;
              const currentIndex = actions.indexOf(settings.volumeAction);
              const newValue = actions[(currentIndex + 1) % actions.length];
              updateSetting('volumeAction', newValue);
            }}
          />
          <SettingRow
            icon="music-note"
            label="Shutter Sound"
            showToggle
            toggleValue={settings.shutterSound}
            onToggle={(value) => updateSetting('shutterSound', value)}
          />
          <SettingRow
            icon="map-marker"
            label="Save Location Info"
            showToggle
            toggleValue={settings.saveLocation}
            onToggle={(value) => updateSetting('saveLocation', value)}
          />
          <SettingRow
            icon="grid"
            label="Grid Overlay"
            value={settings.gridStyle === 'off' ? 'Off' : settings.gridStyle === '3x3' ? '3×3' : 'Golden Ratio'}
            onPress={() => {
              const styles = ['off', '3x3', 'golden'] as const;
              const currentIndex = styles.indexOf(settings.gridStyle);
              const newValue = styles[(currentIndex + 1) % styles.length];
              updateSetting('gridStyle', newValue);
            }}
          />
          <SettingRow
            icon="timer"
            label="Timer"
            value={settings.timer === 'off' ? 'Off' : settings.timer}
            onPress={() => {
              const timers = ['off', '2s', '5s', '10s'] as const;
              const currentIndex = timers.indexOf(settings.timer);
              const newValue = timers[(currentIndex + 1) % timers.length];
              updateSetting('timer', newValue);
            }}
          />
          <SettingRow
            icon="gesture-tap"
            label="Touch to Capture"
            showToggle
            toggleValue={settings.touchToCapture}
            onToggle={(value) => updateSetting('touchToCapture', value)}
          />
        </Section>

        <Section title="Photo">
          <SettingRow
            icon="crop"
            label="Aspect Ratio"
            value={settings.photoAspectRatio}
            onPress={() => {
              const ratios = ['4:3', '16:9', '1:1'] as const;
              const currentIndex = ratios.indexOf(settings.photoAspectRatio);
              const newValue = ratios[(currentIndex + 1) % ratios.length];
              updateSetting('photoAspectRatio', newValue);
            }}
          />
          <SettingRow
            icon="image-filter-hdr"
            label="Quality"
            value={settings.imageQuality === 'normal' ? 'Normal' : settings.imageQuality === 'fine' ? 'Fine' : 'Superfine'}
            onPress={() => {
              const qualities = ['normal', 'fine', 'superfine'] as const;
              const currentIndex = qualities.indexOf(settings.imageQuality);
              const newValue = qualities[(currentIndex + 1) % qualities.length];
              updateSetting('imageQuality', newValue);
            }}
          />
          <SettingRow
            icon="gesture-pinch"
            label="Gesture Zoom"
            showToggle
            toggleValue={settings.gestureZoom}
            onToggle={(value) => updateSetting('gestureZoom', value)}
          />
        </Section>

        <Section title="Video">
          <SettingRow
            icon="video"
            label="Resolution"
            value={settings.videoResolution.toUpperCase()}
            onPress={() => {
              const resolutions = ['720p', '1080p', '4k'] as const;
              const currentIndex = resolutions.indexOf(settings.videoResolution);
              const newValue = resolutions[(currentIndex + 1) % resolutions.length];
              updateSetting('videoResolution', newValue);
            }}
          />
          <SettingRow
            icon="speedometer"
            label="Frame Rate"
            value={`${settings.videoFPS} FPS`}
            onPress={() => {
              const fps = [30, 60, 120] as const;
              const currentIndex = fps.indexOf(settings.videoFPS);
              const newValue = fps[(currentIndex + 1) % fps.length];
              updateSetting('videoFPS', newValue);
            }}
          />
          <SettingRow
            icon="video-stabilization"
            label="Stabilization"
            showToggle
            toggleValue={settings.videoStabilization}
            onToggle={(value) => updateSetting('videoStabilization', value)}
          />
        </Section>

        <View style={{ marginTop: 20 }}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
            <MaterialCommunityIcons name="restore" size={20} color="#CF6679" style={{ marginRight: 8 }} />
            <Text style={styles.dangerButtonText}>Reset Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aboutContainer}
            onPress={() => router.push('/about' as Href)}
            activeOpacity={0.7}
          >
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>About GeoShot</Text>
              <Text style={styles.aboutSubtext}>Version {Constants.expoConfig?.version || '1.0.0'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}