import { StyleSheet, Platform } from 'react-native';

const ACCENT_COLOR = '#FFD700'; // Gold to match camera
const BG_COLOR = '#000000';
const CARD_COLOR = '#1C1C1E'; // iOS-like dark gray
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#8E8E93';

export const settingsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    scrollContent: {
        paddingBottom: 60,
        paddingTop: 80,
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: ACCENT_COLOR,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionCard: {
        backgroundColor: CARD_COLOR,
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 16,
        backgroundColor: CARD_COLOR,
    },
    // Separator line between rows
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#38383A',
        marginLeft: 16,
    },
    settingLabel: {
        fontSize: 17,
        color: TEXT_PRIMARY,
        fontWeight: '500',
        flex: 1,
    },
    settingValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingValueText: {
        fontSize: 17,
        color: TEXT_SECONDARY,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.15)', // Soft red
        paddingVertical: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    dangerButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FF453A', // iOS Red
    },
    aboutContainer: {
        marginHorizontal: 16,
        backgroundColor: CARD_COLOR,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aboutInfo: {
        flex: 1,
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 4,
    },
    aboutSubtext: {
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});
