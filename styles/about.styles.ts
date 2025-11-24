import { StyleSheet } from 'react-native';

// Material Design Dark Theme Colors (matching settings.styles.ts)
const BACKGROUND = '#121212'; // Material Dark surface
const SURFACE = '#1E1E1E'; // Slightly elevated surface
const PRIMARY = '#BB86FC'; // Material Purple 200
const TEXT_PRIMARY = '#E1E1E1'; // High emphasis
const TEXT_SECONDARY = '#A0A0A0'; // Medium emphasis
const DIVIDER = '#303030'; // Material divider

export const aboutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        borderBottomWidth: 1,
        borderBottomColor: DIVIDER,
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 18,
        marginBottom: 16,
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    tagline: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginBottom: 12,
    },
    version: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        fontWeight: '500',
    },

    // Description
    descriptionContainer: {
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: TEXT_SECONDARY,
        textAlign: 'center',
    },

    // Features
    featuresContainer: {
        marginBottom: 32,
        backgroundColor: SURFACE,
        borderRadius: 12,
        overflow: 'hidden',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: DIVIDER,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${PRIMARY}15`, // Primary with transparency
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureContent: {
        flex: 1,
        paddingTop: 2,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: TEXT_PRIMARY,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        lineHeight: 20,
    },

    // Action Buttons
    actionsContainer: {
        marginBottom: 40,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: SURFACE,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: DIVIDER,
        minHeight: 56,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: TEXT_PRIMARY,
        marginLeft: 12,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: DIVIDER,
    },
    footerText: {
        color: TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    footerSubtext: {
        color: TEXT_SECONDARY,
        fontSize: 12,
    },
});

