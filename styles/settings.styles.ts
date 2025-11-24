import { StyleSheet } from 'react-native';

// Material Design Dark Theme Colors
const BACKGROUND = '#121212'; // Material Dark surface
const SURFACE = '#1E1E1E'; // Slightly elevated surface
const PRIMARY = '#BB86FC'; // Material Purple 200
const TEXT_PRIMARY = '#E1E1E1'; // High emphasis
const TEXT_SECONDARY = '#A0A0A0'; // Medium emphasis
const DIVIDER = '#303030'; // Material divider
const ERROR = '#CF6679'; // Material error color

export const settingsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 60,
        paddingTop: 80,
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: PRIMARY,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    sectionCard: {
        backgroundColor: SURFACE,
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: SURFACE,
        minHeight: 56, // Material Design minimum touch target
    },
    settingRowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 24,
        height: 24,
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 16,
        color: TEXT_PRIMARY,
        fontWeight: '400',
        flex: 1,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: DIVIDER,
        marginLeft: 56, // Indent to align with text
    },
    settingValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    settingValueText: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SURFACE,
        paddingVertical: 16,
        marginBottom: 16,
        marginTop: 8,
        minHeight: 48,
        borderRadius: 12,
    },
    dangerButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: ERROR,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    aboutContainer: {
        backgroundColor: SURFACE,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
    },
    aboutInfo: {
        flex: 1,
    },
    aboutTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: TEXT_PRIMARY,
        marginBottom: 4,
    },
    aboutSubtext: {
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});

