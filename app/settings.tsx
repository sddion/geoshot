import { settingsStyles as styles } from '@/styles/settings.styles';
import { useCameraSettings } from '@/contexts/CameraSettingsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import Constants from 'expo-constants';

// Toast utility function
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
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
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={showToggle || !onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#3A3A3C', true: '#FFD700' }} // Gold accent
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.settingValue}>
          <Text style={styles.settingValueText}>{value}</Text>
          {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color="#555" />}
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
        <Section title="General">
          <SettingRow
            label="Storage Location"
            value={settings.storageLocation === 'phone' ? 'Phone' : 'SD Card'}
            onPress={() => {
              const newValue = settings.storageLocation === 'phone' ? 'sd' : 'phone';
              updateSetting('storageLocation', newValue);
            }}
          />
          <SettingRow
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
            label="Shutter Sound"
            showToggle
            toggleValue={settings.shutterSound}
            onToggle={(value) => updateSetting('shutterSound', value)}
          />
          <SettingRow
            label="Save Location Info"
            showToggle
            toggleValue={settings.saveLocation}
            onToggle={(value) => updateSetting('saveLocation', value)}
          />
          <SettingRow
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
            label="Touch to Capture"
            showToggle
            toggleValue={settings.touchToCapture}
            onToggle={(value) => updateSetting('touchToCapture', value)}
          />
        </Section>

        <Section title="Photo">
          <SettingRow
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
            label="Gesture Zoom"
            showToggle
            toggleValue={settings.gestureZoom}
            onToggle={(value) => updateSetting('gestureZoom', value)}
          />
        </Section>

        <Section title="Video">
          <SettingRow
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
            label="Stabilization"
            showToggle
            toggleValue={settings.videoStabilization}
            onToggle={(value) => updateSetting('videoStabilization', value)}
          />
        </Section>

        <View style={{ marginTop: 20 }}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
            <MaterialCommunityIcons name="restore" size={22} color="#FF453A" style={{ marginRight: 8 }} />
            <Text style={styles.dangerButtonText}>Reset Camera Settings</Text>
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
