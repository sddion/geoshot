import { StyleSheet } from 'react-native';

export const cameraStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    camera: {
        width: '100%',
        height: '100%',
    },
    gridOverlay: {
        position: 'absolute',
        top: 100,
        bottom: 200,
        left: 0,
        right: 0,
    },
    gridLine: {
        position: 'absolute' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    gridLineHorizontal: {
        width: '100%',
        height: 1,
    },
    gridLineVertical: {
        width: 1,
        height: '100%',
    },
    focusIndicator: {
        position: 'absolute' as const,
        width: 80,
        height: 80,
        borderWidth: 2,
        borderColor: '#FFD700',
        borderRadius: 40,
    },
    liveOverlayContainer: {
        position: 'absolute',
        bottom: 200,
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 1,
    },
});

export const controlStyles = StyleSheet.create({
    topControls: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    iconButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
});

export const modeStyles = StyleSheet.create({
    modeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        paddingVertical: 8,
    },
    modeButton: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    modeText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    modeTextActive: {
        color: '#FFD700',
    },
});

export const captureStyles = StyleSheet.create({
    captureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 16,
    },
    thumbnailButton: {
        width: 56,
        height: 56,
    },
    thumbnailContainer: {
        width: 56,
        height: 56,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    thumbnailVideoIndicator: {
        position: 'absolute' as const,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    thumbnailEmpty: {
        width: 56,
        height: 56,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    recordingButton: {
        width: 32,
        height: 32,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
    videoRecordButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF3B30',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    flipButton: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export const zoomStyles = StyleSheet.create({
    singleZoomButton: {
        position: 'absolute',
        right: 20,
        top: '30%',
        width: 40,
        height: 40,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    singleZoomText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    verticalZoomSlider: {
        position: 'absolute',
        right: 40,
        top: '20%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    verticalSliderTrack: {
        width: 50,
        height: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verticalSliderFill: {
        position: 'absolute',
        bottom: 0,
        width: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 25,
    },
});

export const overlayStyles = StyleSheet.create({
    timerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    timerCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    timerText: {
        fontSize: 64,
        fontWeight: '700' as const,
        color: '#fff',
    },
    capturingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99,
    },
    capturingText: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: '#fff',
    },
    recordingIndicator: {
        position: 'absolute' as const,
        top: 120,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        zIndex: 50,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    recordingText: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
});
