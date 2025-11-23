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
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: PRIMARY,
        marginBottom: 8,
        marginTop: 16,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionCard: {
        backgroundColor: SURFACE,
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
    // Full-width separator (Android style)
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: DIVIDER,
    },
    settingValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    settingValueText: {
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
    // Material Design button
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SURFACE,
        paddingVertical: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: 8,
        minHeight: 48,
    },
    dangerButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: ERROR,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    aboutContainer: {
        marginHorizontal: 16,
        backgroundColor: SURFACE,
        padding: 16,
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
        fontWeight: '400',
        color: TEXT_PRIMARY,
        marginBottom: 4,
    },
    aboutSubtext: {
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});
