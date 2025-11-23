import { StyleSheet } from 'react-native';

export const aboutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
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
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    tagline: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    version: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },

    // Description
    descriptionContainer: {
        marginBottom: 32,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#999',
        textAlign: 'center',
    },

    // Features
    featuresContainer: {
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
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
        color: '#FFFFFF',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#888',
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
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
        marginLeft: 12,
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    footerText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    footerSubtext: {
        color: '#444',
        fontSize: 12,
    },
});
