import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { controlStyles, modeStyles, captureStyles } from '@/styles/camera.styles';
import type { CameraMode, FlashMode } from '@/contexts/CameraSettingsContext';

interface CameraControlsProps {
    flashMode: FlashMode;
    cycleFlash: () => void;
    geoOverlayEnabled: boolean;
    toggleGeoOverlay: () => void;
    isRecording: boolean;
    currentMode: CameraMode;
    setCurrentMode: (mode: CameraMode) => void;
    lastPhotoUri: string | null;
    openGallery: () => void;
    toggleCameraFacing: () => void;
    onSettingsPress: () => void;
    captureButton: React.ReactNode;
}

export default function CameraControls({
    flashMode,
    cycleFlash,
    geoOverlayEnabled,
    toggleGeoOverlay,
    isRecording,
    currentMode,
    setCurrentMode,
    lastPhotoUri,
    openGallery,
    toggleCameraFacing,
    onSettingsPress,
    captureButton,
}: CameraControlsProps) {
    const modes: CameraMode[] = ['photo', 'video', 'night', 'portrait'];

    const getModeIcon = (mode: CameraMode) => {
        const iconProps = { size: 20, color: '#fff' };
        switch (mode) {
            case 'photo':
                return <MaterialCommunityIcons name="camera" {...iconProps} />;
            case 'video':
                return <MaterialCommunityIcons name="video" {...iconProps} />;
            case 'night':
                return <MaterialCommunityIcons name="moon-waning-crescent" {...iconProps} />;
            case 'portrait':
                return <MaterialCommunityIcons name="circle-outline" {...iconProps} />;
        }
    };

    const getFlashIcon = () => {
        if (flashMode === 'off') return <MaterialCommunityIcons name="flash-off" size={24} color="#fff" />;
        return <MaterialCommunityIcons name="flash" size={24} color={flashMode === 'on' ? '#FFD700' : '#fff'} />;
    };

    return (
        <>
            {/* Top Controls */}
            <SafeAreaView style={controlStyles.topControls} edges={['top']}>
                <TouchableOpacity style={controlStyles.iconButton} onPress={cycleFlash}>
                    {getFlashIcon()}
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <View style={controlStyles.centerIcons}>
                    <TouchableOpacity
                        style={[
                            controlStyles.iconBadge,
                            { backgroundColor: geoOverlayEnabled ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)' }
                        ]}
                        onPress={toggleGeoOverlay}
                    >
                        <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }} />

                {!isRecording && (
                    <TouchableOpacity style={controlStyles.iconButton} onPress={onSettingsPress}>
                        <MaterialCommunityIcons name="cog" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </SafeAreaView>

            {/* Bottom Controls */}
            <SafeAreaView style={controlStyles.bottomControls} edges={['bottom']}>
                {!isRecording && (
                    <View style={modeStyles.modeSelector}>
                        {modes.map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={modeStyles.modeButton}
                                onPress={() => setCurrentMode(mode)}
                            >
                                <View style={{ marginBottom: 4 }}>{getModeIcon(mode)}</View>
                                <Text style={[modeStyles.modeText, currentMode === mode && modeStyles.modeTextActive]}>
                                    {mode.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={captureStyles.captureRow}>
                    {!isRecording && (
                        <TouchableOpacity style={captureStyles.thumbnailButton} onPress={openGallery}>
                            {lastPhotoUri ? (
                                <Image source={{ uri: lastPhotoUri }} style={captureStyles.thumbnail} contentFit="cover" />
                            ) : (
                                <View style={captureStyles.thumbnailEmpty}>
                                    <MaterialCommunityIcons name="image" size={24} color="#888" />
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Capture Button injected here */}
                    {captureButton}

                    {!isRecording && (
                        <TouchableOpacity style={captureStyles.flipButton} onPress={toggleCameraFacing}>
                            <MaterialCommunityIcons name="sync" size={32} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </>
    );
}
