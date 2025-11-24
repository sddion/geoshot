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
    updateStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    updateDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    updateButton: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    changelogContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 4,
    },
    changelogLink: {
        color: '#BB86FC',
        fontSize: 13,
        fontWeight: '500',
    },
    updateActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: SURFACE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: TEXT_PRIMARY,
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    modalBodyText: {
        fontSize: 14,
        lineHeight: 20,
        color: TEXT_SECONDARY,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    modalButtonPrimary: {
        flex: 1,
        backgroundColor: PRIMARY,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '600',
    },
    modalButtonSecondary: {
        flex: 1,
        backgroundColor: DIVIDER,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        color: TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '600',
    },
});

