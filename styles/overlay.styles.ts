import { StyleSheet } from 'react-native';

export const overlayStyles = StyleSheet.create({
    container: {
        // No fixed height, let it grow
        pointerEvents: 'none',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        borderRadius: 0, // Edge to edge look usually
    },
    contentRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    mapContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#333',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    pinOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 8, // Lift pin slightly
    },
    osmBranding: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 1,
    },
    osmText: {
        color: 'white',
        fontSize: 6,
        textAlign: 'center',
    },
    mainInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    placeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    address: {
        fontSize: 11,
        color: '#ddd',
        marginBottom: 4,
        lineHeight: 14,
    },
    coords: {
        fontSize: 11,
        color: '#ddd',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
    dateTime: {
        fontSize: 10,
        color: '#aaa',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 8,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
});
