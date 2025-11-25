import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { captureStyles } from '@/styles/camera.styles';
import type { CameraMode } from '@/contexts/CameraSettingsContext';
import Loader from '@/components/Loader';

interface CaptureButtonProps {
    isRecording: boolean;
    isCapturing: boolean;
    currentMode: CameraMode;
    onCapture: () => void;
}

export default function CaptureButton({
    isRecording,
    isCapturing,
    currentMode,
    onCapture,
}: CaptureButtonProps) {
    const getAccessibilityLabel = () => {
        if (currentMode === 'video') {
            return isRecording ? "Stop Recording" : "Start Recording";
        }
        return "Take Photo";
    };

    return (
        <TouchableOpacity
            style={captureStyles.captureButton}
            onPress={onCapture}
            disabled={isCapturing && currentMode !== 'video'}
            accessibilityRole="button"
            accessibilityLabel={getAccessibilityLabel()}
        >
            {isCapturing && currentMode !== 'video' ? (
                <Loader size={40} />
            ) : isRecording ? (
                <View style={captureStyles.recordingButton} />
            ) : (
                <View style={currentMode === 'video' ? captureStyles.videoRecordButton : captureStyles.captureButtonInner} />
            )}
        </TouchableOpacity>
    );
}
