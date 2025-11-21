import { useCameraSettings } from '@/contexts/CameraSettingsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ToastAndroid,
  Platform,
} from 'react-native';

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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

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
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#444', true: '#4CAF50' }}
          thumbColor="#fff"
        />
      ) : (
        <View style={styles.settingValue}>
          <Text style={styles.settingValueText}>{value}</Text>
          {onPress && <MaterialCommunityIcons name="chevron-right" size={20} color="#888" />}
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
    <ScrollView style={styles.container}>
      <Section title="GENERAL">
        <SettingRow
          label="Storage location"
          value={settings.storageLocation === 'phone' ? 'Phone' : 'SD Card'}
          onPress={() => {
            const newValue = settings.storageLocation === 'phone' ? 'sd' : 'phone';
            updateSetting('storageLocation', newValue);
          }}
        />
        <SettingRow
          label="Volume button action"
          value={settings.volumeAction === 'shutter' ? 'Shutter' : settings.volumeAction === 'zoom' ? 'Zoom' : 'Off'}
          onPress={() => {
            const actions = ['shutter', 'zoom', 'off'] as const;
            const currentIndex = actions.indexOf(settings.volumeAction);
            const newValue = actions[(currentIndex + 1) % actions.length];
            updateSetting('volumeAction', newValue);
          }}
        />
        <SettingRow
          label="Shutter sound"
          showToggle
          toggleValue={settings.shutterSound}
          onToggle={(value) => updateSetting('shutterSound', value)}
        />
        <SettingRow
          label="Save location information"
          showToggle
          toggleValue={settings.saveLocation}
          onToggle={(value) => updateSetting('saveLocation', value)}
        />
        <SettingRow
          label="Grid style"
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
          value={settings.timer === 'off' ? 'Off' : settings.timer === '2s' ? '2 seconds' : settings.timer === '5s' ? '5 seconds' : '10 seconds'}
          onPress={() => {
            const timers = ['off', '2s', '5s', '10s'] as const;
            const currentIndex = timers.indexOf(settings.timer);
            const newValue = timers[(currentIndex + 1) % timers.length];
            updateSetting('timer', newValue);
          }}
        />
        <SettingRow
          label="Touch to capture"
          showToggle
          toggleValue={settings.touchToCapture}
          onToggle={(value) => updateSetting('touchToCapture', value)}
        />
      </Section>

      <Section title="PHOTO">
        <SettingRow
          label="Aspect ratio"
          value={settings.photoAspectRatio}
          onPress={() => {
            const ratios = ['4:3', '16:9', '1:1'] as const;
            const currentIndex = ratios.indexOf(settings.photoAspectRatio);
            const newValue = ratios[(currentIndex + 1) % ratios.length];
            updateSetting('photoAspectRatio', newValue);
          }}
        />
        <SettingRow
          label="Photo resolution"
          value={settings.photoResolution.toUpperCase()}
          onPress={() => {
            const resolutions = ['1080p', '4k', '8k', 'max'] as const;
            const currentIndex = resolutions.indexOf(settings.photoResolution);
            const newValue = resolutions[(currentIndex + 1) % resolutions.length];
            updateSetting('photoResolution', newValue);
          }}
        />
        <SettingRow
          label="Image quality"
          value={settings.imageQuality === 'normal' ? 'Normal' : settings.imageQuality === 'fine' ? 'Fine' : 'Superfine'}
          onPress={() => {
            const qualities = ['normal', 'fine', 'superfine'] as const;
            const currentIndex = qualities.indexOf(settings.imageQuality);
            const newValue = qualities[(currentIndex + 1) % qualities.length];
            updateSetting('imageQuality', newValue);
          }}
        />
        <SettingRow
          label="Gesture zoom"
          showToggle
          toggleValue={settings.gestureZoom}
          onToggle={(value) => updateSetting('gestureZoom', value)}
        />
      </Section>

      <Section title="VIDEO">
        <SettingRow
          label="Video resolution"
          value={settings.videoResolution.toUpperCase()}
          onPress={() => {
            const resolutions = ['720p', '1080p', '4k'] as const;
            const currentIndex = resolutions.indexOf(settings.videoResolution);
            const newValue = resolutions[(currentIndex + 1) % resolutions.length];
            updateSetting('videoResolution', newValue);
          }}
        />
        <SettingRow
          label="FPS"
          value={`${settings.videoFPS} FPS`}
          onPress={() => {
            const fps = [30, 60, 120] as const;
            const currentIndex = fps.indexOf(settings.videoFPS);
            const newValue = fps[(currentIndex + 1) % fps.length];
            updateSetting('videoFPS', newValue);
          }}
        />
        <SettingRow
          label="Video stabilization"
          showToggle
          toggleValue={settings.videoStabilization}
          onToggle={(value) => updateSetting('videoStabilization', value)}
        />
      </Section>

      <Section title="ADVANCED">
        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerButtonText}>Reset Camera Settings</Text>
        </TouchableOpacity>

        <View style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>GeoShot v1.0.2</Text>
          <Text style={styles.aboutDescription}>
            Built by Sddion
          </Text>
          <Text style={styles.aboutSubtext}>
            Passionate about open-source development
          </Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.githubButton}
              onPress={() => Linking.openURL('https://github.com/sddion/geoshot.git')}
            >
              <MaterialCommunityIcons name="github" size={20} color="#fff" />
              <Text style={styles.githubButtonText}>GitHub</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.donateButton}
              onPress={() => {}}
            >
              <MaterialCommunityIcons name="heart" size={20} color="#fff" />
              <Text style={styles.donateButtonText}>Donate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 16,
    color: '#888',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  aboutSubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  githubButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
