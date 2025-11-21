import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, GestureResponderEvent, Dimensions } from 'react-native';
import { cameraStyles, zoomStyles, overlayStyles } from '@/styles/camera.styles';
import GeoOverlay from '@/components/GeoOverlay';
import type { GridStyle } from '@/contexts/CameraSettingsContext';
import type { FocusPoint } from '@/types/camera';
import type { GeoData } from '@/utils/geoOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CameraOverlayProps {
    gridStyle: GridStyle;
    focusPoint: FocusPoint | null;
    focusAnimation: Animated.Value;
    timerCountdown: number;
    isRecording: boolean;
    recordingDuration: number;
    zoom: number;
    showZoomSlider: boolean;
    handleZoomButtonTap: () => void;
    handleZoomSliderChange: (value: number) => void;
    geoOverlayEnabled: boolean;
    liveGeoData: GeoData | null;
    liveMapTile: string | null;
    currentMode: string;
}

export default function CameraOverlay({
    gridStyle,
    focusPoint,
    focusAnimation,
    timerCountdown,
    isRecording,
    recordingDuration,
    zoom,
    showZoomSlider,
    handleZoomButtonTap,
    handleZoomSliderChange,
    geoOverlayEnabled,
    liveGeoData,
    liveMapTile,
    currentMode,
}: CameraOverlayProps) {
    return (
        <>
            {/* Grid Overlay */}
            {gridStyle !== 'off' && (
                <View style={[cameraStyles.gridOverlay, { zIndex: 1 }]} pointerEvents="none">
                    {gridStyle === '3x3' && (
                        <>
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineHorizontal, { top: '33.33%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineHorizontal, { top: '66.66%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineVertical, { left: '33.33%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineVertical, { left: '66.66%' }]} />
                        </>
                    )}
                    {gridStyle === 'golden' && (
                        <>
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineHorizontal, { top: '38.2%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineHorizontal, { top: '61.8%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineVertical, { left: '38.2%' }]} />
                            <View style={[cameraStyles.gridLine, cameraStyles.gridLineVertical, { left: '61.8%' }]} />
                        </>
                    )}
                </View>
            )}

            {/* Focus Indicator */}
            {focusPoint && (
                <Animated.View
                    style={[
                        cameraStyles.focusIndicator,
                        {
                            left: focusPoint.x - 40,
                            top: focusPoint.y - 40,
                            opacity: focusAnimation,
                            zIndex: 2,
                        },
                    ]}
                    pointerEvents="none"
                />
            )}

            {/* Zoom Controls */}
            {!showZoomSlider && (
                <TouchableOpacity style={zoomStyles.singleZoomButton} onPress={handleZoomButtonTap}>
                    <Text style={zoomStyles.singleZoomText}>{(zoom * 10).toFixed(1)}×</Text>
                </TouchableOpacity>
            )}

            {showZoomSlider && (
                <View style={zoomStyles.verticalZoomSlider} pointerEvents="box-none">
                    <Pressable
                        style={zoomStyles.verticalSliderTrack}
                        onTouchStart={(e: GestureResponderEvent) => {
                            const { locationY } = e.nativeEvent;
                            const sliderHeight = 200;
                            const value = Math.max(0, Math.min(1, 1 - (locationY / sliderHeight)));
                            handleZoomSliderChange(value);
                        }}
                        onTouchMove={(e: GestureResponderEvent) => {
                            const { locationY } = e.nativeEvent;
                            const sliderHeight = 200;
                            const value = Math.max(0, Math.min(1, 1 - (locationY / sliderHeight)));
                            handleZoomSliderChange(value);
                        }}
                    >
                        <View style={[zoomStyles.verticalSliderFill, { height: `${((zoom * 10 - 0.5) / 9.5) * 100}%` }]} />
                    </Pressable>
                </View>
            )}

            {/* Live GPS Overlay (for photos) */}
            {geoOverlayEnabled && currentMode !== 'video' && (
                <View style={cameraStyles.liveOverlayContainer} pointerEvents="none">
                    <GeoOverlay geoData={liveGeoData} mapTile={liveMapTile} imageWidth={SCREEN_WIDTH - 32} />
                </View>
            )}

            {/* Timer Countdown Overlay */}
            {timerCountdown > 0 && (
                <View style={overlayStyles.timerOverlay}>
                    <View style={overlayStyles.timerCircle}>
                        <Text style={overlayStyles.timerText}>{timerCountdown}</Text>
                    </View>
                </View>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <View style={overlayStyles.recordingIndicator}>
                    <View style={overlayStyles.recordingDot} />
                    <Text style={overlayStyles.recordingText}>
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
            )}
        </>
    );
}
